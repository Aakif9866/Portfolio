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
