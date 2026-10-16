/**
 * Runs the real migration SQL against an in-process Postgres (PGlite) — no
 * server, no network, never production. The tables below are minimal stubs
 * with only the columns the migration touches; they are NOT the production
 * schema, so these tests prove the functions' logic and transaction
 * behaviour, not RLS. RLS is exercised once the migration is applied (see
 * docs/maintenance.md → verification).
 */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";

const MIGRATION = readFileSync(
  new URL("../supabase/migrations/20261017000000_atomic_reorder_and_revisions.sql", import.meta.url),
  "utf8",
);

const P1 = "00000000-0000-4000-8000-000000000001";
const P2 = "00000000-0000-4000-8000-000000000002";
const P3 = "00000000-0000-4000-8000-000000000003";
const ART = "00000000-0000-4000-9000-000000000001";

let db: PGlite;

beforeEach(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create table public.projects (id uuid primary key, title text, position integer not null default 0);
    create table public.articles (
      id uuid primary key, title text not null, body_md text not null default '',
      state text not null default 'draft' check (state in ('draft', 'published', 'archived')),
      position integer not null default 0
    );
    create table public.article_revisions (
      id uuid primary key default gen_random_uuid(),
      article_id uuid not null references public.articles(id) on delete cascade,
      title text, body_md text, created_at timestamptz not null default clock_timestamp()
    );
    insert into public.projects values ('${P1}', 'one', 0), ('${P2}', 'two', 1), ('${P3}', 'three', 1);
    insert into public.articles (id, title, body_md) values ('${ART}', 'Original', 'Original body');
  `);
  await db.exec(MIGRATION);
});

const positions = async () =>
  Object.fromEntries((await db.query<{ id: string; position: number }>("select id, position from projects")).rows.map((r) => [r.id, r.position]));
const revisions = async () =>
  (await db.query<{ title: string; body_md: string }>("select title, body_md from article_revisions order by created_at")).rows;

describe("swap_positions", () => {
  it("swaps two rows so that `a` ends up before `b`", async () => {
    await db.query("select swap_positions('projects', $1, $2)", [P2, P1]); // move P2 up past P1
    expect(await positions()).toMatchObject({ [P1]: 1, [P2]: 0 });
  });

  it("breaks a tie instead of 'swapping' equal positions to the same values", async () => {
    await db.query("select swap_positions('projects', $1, $2)", [P3, P2]); // both at 1
    const p = await positions();
    expect(p[P3]).toBeLessThan(p[P2]);
  });

  it("refuses tables that are not reorderable", async () => {
    await expect(db.query("select swap_positions('article_revisions', $1, $2)", [P1, P2])).rejects.toThrow(/not reorderable/);
  });

  it("raises and changes nothing when a row is missing (or hidden by RLS)", async () => {
    const before = await positions();
    await expect(db.query("select swap_positions('projects', $1, $2)", [P1, "00000000-0000-4000-8000-0000000000ff"])).rejects.toThrow(/not found/);
    expect(await positions()).toEqual(before);
  });

  it("is all-or-nothing: if updating either row fails, neither changes", async () => {
    // simulate a failure on one of the two rows mid-statement
    await db.exec(`
      create function fail_on_p2() returns trigger language plpgsql as $$
      begin if new.id = '${P2}' then raise exception 'simulated failure'; end if; return new; end $$;
      create trigger t before update on projects for each row execute function fail_on_p2();
    `);
    const before = await positions();
    await expect(db.query("select swap_positions('projects', $1, $2)", [P2, P1])).rejects.toThrow(/simulated failure/);
    expect(await positions()).toEqual(before);
  });

  it("is not executable by anonymous visitors, only signed-in users (RLS then applies)", async () => {
    const can = async (role: string) =>
      (await db.query<{ ok: boolean }>("select has_function_privilege($1, 'public.swap_positions(text,uuid,uuid)', 'execute') as ok", [role])).rows[0].ok;
    expect(await can("anon")).toBe(false);
    expect(await can("authenticated")).toBe(true);
  });
});

describe("article revision trigger", () => {
  it("snapshots the previous title and body in the same transaction as the edit", async () => {
    await db.query("update articles set body_md = 'Edited' where id = $1", [ART]);
    expect(await revisions()).toEqual([{ title: "Original", body_md: "Original body" }]);
  });

  it("does not snapshot publish, archive or reorder (no content change)", async () => {
    await db.query("update articles set state = 'published', position = 5 where id = $1", [ART]);
    expect(await revisions()).toEqual([]);
  });

  it("leaves no revision behind when the edit itself fails", async () => {
    await expect(db.query("update articles set body_md = 'Edited', state = 'bogus' where id = $1", [ART])).rejects.toThrow();
    expect(await revisions()).toEqual([]);
    expect((await db.query<{ body_md: string }>("select body_md from articles")).rows[0].body_md).toBe("Original body");
  });

  it("keeps restore undoable: restoring is an edit, so it snapshots too", async () => {
    await db.query("update articles set body_md = 'Edited' where id = $1", [ART]);
    await db.query("update articles set body_md = 'Original body' where id = $1", [ART]); // restore
    expect(await revisions()).toEqual([
      { title: "Original", body_md: "Original body" },
      { title: "Original", body_md: "Edited" },
    ]);
  });
});
