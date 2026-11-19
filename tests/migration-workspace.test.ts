/**
 * Runs the workspace migration against an in-process Postgres (PGlite). public.is_admin()
 * is a stub driven by a session setting, so these prove the RLS *logic* — admin-only, anon
 * locked out — not the production auth wiring (check-rls.mjs covers that after applying).
 */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";

const MIGRATION = readFileSync(new URL("../supabase/migrations/20261119000001_workspace_entries.sql", import.meta.url), "utf8");

let db: PGlite;
const as = async (role: string, admin: boolean, sql: string) => {
  await db.exec(`set role ${role}; set test.admin = '${admin ? "on" : "off"}';`);
  try {
    return await db.query<Record<string, unknown>>(sql);
  } finally {
    await db.exec("reset role;");
  }
};

beforeEach(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create function public.is_admin() returns boolean language sql stable
      as $$ select coalesce(current_setting('test.admin', true), 'off') = 'on' $$;
    grant execute on function public.is_admin() to anon, authenticated;
    grant usage on schema public to anon, authenticated;
  `);
  await db.exec(MIGRATION);
});

describe("entries", () => {
  it("the admin can insert, read, update and delete", async () => {
    await as("authenticated", true, "insert into public.entries (title) values ('first')");
    expect((await as("authenticated", true, "select title, kind from public.entries")).rows).toEqual([{ title: "first", kind: "note" }]);
    await as("authenticated", true, "update public.entries set title = 'edited'");
    await as("authenticated", true, "delete from public.entries");
    expect((await as("authenticated", true, "select 1 from public.entries")).rows).toHaveLength(0);
  });

  it("a signed-in non-admin sees nothing and can't write", async () => {
    await as("authenticated", true, "insert into public.entries (title) values ('secret')");
    expect((await as("authenticated", false, "select * from public.entries")).rows).toHaveLength(0);
    await expect(as("authenticated", false, "insert into public.entries (title) values ('x')")).rejects.toThrow(/row-level security/);
    await as("authenticated", false, "update public.entries set title = 'pwned'"); // matches no visible rows
    expect((await as("authenticated", true, "select title from public.entries")).rows).toEqual([{ title: "secret" }]);
  });

  it("anon has no access at all, even if is_admin() were true", async () => {
    await expect(as("anon", true, "select * from public.entries")).rejects.toThrow(/permission denied/);
    await expect(as("anon", true, "select * from public.private_config")).rejects.toThrow(/permission denied/);
  });

  it("enforces the shape: known kind, title or url, http(s) links", async () => {
    const bad = ["insert into public.entries (kind, title) values ('salary', 'x')", "insert into public.entries (title) values ('')",
      "insert into public.entries (url) values ('javascript:alert(1)')"];
    for (const sql of bad) await expect(as("authenticated", true, sql), sql).rejects.toThrow();
    await as("authenticated", true, "insert into public.entries (url) values ('https://a.dev')");
  });

  it("updated_at moves on update, created_at doesn't", async () => {
    await as("authenticated", true, "insert into public.entries (title, created_at, updated_at) values ('t', '2020-06-01', '2020-06-01')");
    await as("authenticated", true, "update public.entries set title = 't2'");
    const [row] = (await as("authenticated", true, "select created_at, updated_at from public.entries")).rows as { created_at: Date; updated_at: Date }[];
    expect(row.created_at.getUTCFullYear()).toBe(2020);
    expect(row.updated_at.getUTCFullYear()).toBeGreaterThan(2020);
  });
});

describe("private_config", () => {
  it("admin-only key/value store with safe keys", async () => {
    await as("authenticated", true, `insert into public.private_config (key, value) values ('career', '{"target":"x"}')`);
    expect((await as("authenticated", false, "select * from public.private_config")).rows).toHaveLength(0);
    await expect(as("authenticated", true, "insert into public.private_config (key) values ('Bad Key')")).rejects.toThrow();
  });
});
