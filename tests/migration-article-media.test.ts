/** The article media migration against PGlite: additive, idempotent, sensible defaults. */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";

const MIGRATION = readFileSync(new URL("../supabase/migrations/20261119000003_article_media.sql", import.meta.url), "utf8");

it("adds tags (default empty), cover_image_url and video_url, and can run twice", { timeout: 30_000 }, async () => {
  const db = new PGlite();
  await db.exec("create table public.articles (id serial primary key, title text not null)");
  await db.exec("insert into public.articles (title) values ('existing')");
  await db.exec(MIGRATION);
  await db.exec(MIGRATION);
  const { rows } = await db.query<{ tags: string[]; cover_image_url: string | null; video_url: string | null }>(
    "select tags, cover_image_url, video_url from public.articles");
  expect(rows).toEqual([{ tags: [], cover_image_url: null, video_url: null }]);
});
