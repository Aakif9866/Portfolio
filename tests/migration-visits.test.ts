/**
 * Runs the visit-counter migration against an in-process Postgres (PGlite). The table
 * is a stub with only the columns the function touches, not the production schema.
 */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";

const MIGRATION = readFileSync(
  new URL("../supabase/migrations/20261118000000_increment_visit_count.sql", import.meta.url),
  "utf8",
);

let db: PGlite;
const count = async () =>
  (await db.query<{ value: string }>("select value from public.site_config where key = 'visit_count'")).rows[0]?.value;

beforeEach(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create table public.site_config (key text primary key, value text, label text not null, "group" text);
    grant select, insert, update on public.site_config to service_role;
  `);
  await db.exec(MIGRATION);
});

describe("increment_visit_count()", () => {
  it("adds exactly one per call", async () => {
    await db.exec(`insert into public.site_config values ('visit_count', '771', 'Visit count', 'internal')`);
    for (let i = 0; i < 5; i++) await db.exec("select public.increment_visit_count()");
    expect(await count()).toBe("776");
  });

  it("creates the row on first use", async () => {
    await db.exec("select public.increment_visit_count()");
    expect(await count()).toBe("1");
  });

  it("treats an empty value as zero", async () => {
    await db.exec(`insert into public.site_config values ('visit_count', '', 'Visit count', 'internal')`);
    await db.exec("select public.increment_visit_count()");
    expect(await count()).toBe("1");
  });

  it("can be called by service_role only", async () => {
    await db.exec("set role service_role; select public.increment_visit_count(); reset role;");
    expect(await count()).toBe("1");
    for (const role of ["anon", "authenticated"]) {
      await expect(db.exec(`set role ${role}; select public.increment_visit_count();`)).rejects.toThrow(/permission denied/);
      await db.exec("reset role");
    }
  });
});
