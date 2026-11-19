/**
 * The private workspace must never reach a public page. RLS is the real boundary; this is
 * the tripwire in code review: outside src/app/admin, no file may touch a private table.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PRIVATE_TABLES = ["entries", "private_config"];
const src = join(__dirname, "..", "src");
const files: string[] = [];
(function walk(dir: string) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { if (p !== join(src, "app", "admin")) walk(p); }
    else if (/\.tsx?$/.test(f)) files.push(p);
  }
})(src);

describe("private workspace stays private", () => {
  it.each(files.map((f) => [f.slice(src.length), f]))("%s doesn't query a private table", (_name, file) => {
    const code = readFileSync(file, "utf8");
    for (const t of PRIVATE_TABLES) expect(code, t).not.toMatch(new RegExp(`from\\(\\s*["'\`]${t}["'\`]`));
  });
});

/** The AI helper reads the API key from the environment; it must only run on the server. */
describe("AI stays server-side", () => {
  const all: string[] = [];
  (function walk(dir: string) {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.tsx?$/.test(f)) all.push(p);
    }
  })(src);
  const clientFiles = all.filter((f) => /^\s*["']use client["']/.test(readFileSync(f, "utf8")));

  it.each(clientFiles.map((f) => [f.slice(src.length), f]))("%s doesn't import the AI helper or page fetcher", (_n, file) => {
    const code = readFileSync(file, "utf8");
    expect(code).not.toMatch(/from\s+["']@\/lib\/(ai|ai-prompts|fetch-page)["']/);
  });

  it("no NEXT_PUBLIC_ AI key anywhere", () => {
    for (const f of all) expect(readFileSync(f, "utf8"), f).not.toMatch(/NEXT_PUBLIC_(AI|DEEPSEEK)/);
  });
});
