/** The project card migration against PGlite: additive, idempotent, cards off by default. */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";

const MIGRATION = readFileSync(new URL("../supabase/migrations/20261122000000_project_card.sql", import.meta.url), "utf8");

it("adds card_enabled (off), card_used_for and card_features (empty), and can run twice", { timeout: 30_000 }, async () => {
  const db = new PGlite();
  await db.exec("create table public.projects (id serial primary key, title text not null)");
  await db.exec("insert into public.projects (title) values ('existing')");
  await db.exec(MIGRATION);
  await db.exec(MIGRATION);
  const { rows } = await db.query("select card_enabled, card_used_for, card_features from public.projects");
  expect(rows).toEqual([{ card_enabled: false, card_used_for: null, card_features: [] }]);
});
