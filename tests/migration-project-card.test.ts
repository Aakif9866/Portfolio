/** The project card migrations against PGlite: the add is additive and idempotent, the drop removes it again. */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";

const read = (f: string) => readFileSync(new URL(`../supabase/migrations/${f}`, import.meta.url), "utf8");
const ADD = read("20261122000000_project_card.sql");
const DROP = read("20261122000001_drop_project_card.sql");

it("adds the card columns (off by default), then drops them, keeping the rows; both can run twice", { timeout: 30_000 }, async () => {
  const db = new PGlite();
  await db.exec("create table public.projects (id serial primary key, title text not null)");
  await db.exec("insert into public.projects (title) values ('existing')");
  await db.exec(ADD);
  await db.exec(ADD);
  expect((await db.query("select card_enabled, card_used_for, card_features from public.projects")).rows)
    .toEqual([{ card_enabled: false, card_used_for: null, card_features: [] }]);
  await db.exec(DROP);
  await db.exec(DROP);
  expect((await db.query("select * from public.projects")).rows).toEqual([{ id: 1, title: "existing" }]);
});
