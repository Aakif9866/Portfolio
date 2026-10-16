/**
 * The admin can only edit SITE_KEYS, so the site must only read SITE_KEYS —
 * otherwise a page would depend on a setting nobody can change from the UI.
 * Conversely, every SITE_KEY must actually be read somewhere.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SITE_KEYS } from "@/lib/site-content";
import { CONTACT_KEYS } from "@/lib/contact";

const src: string[] = [];
const walk = (dir: string) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(f) && !p.includes(join("app", "admin"))) src.push(readFileSync(p, "utf8"));
  }
};
walk(join(__dirname, "..", "src"));
const code = src.join("\n");

// keys read with .eq("key", "…"), plus the contact keys read with .in("key", CONTACT_KEYS)
const read = new Set([...code.matchAll(/\.eq\("key", "([^"]+)"\)/g)].map((m) => m[1]).concat(CONTACT_KEYS));
const KEY = /^const KEY = "([^"]+)"/m.exec(readFileSync(join(__dirname, "..", "src", "lib", "visits.ts"), "utf8"))?.[1];

describe("site settings usage", () => {
  it("the public site reads only keys that Admin → Settings can edit (plus the visit counter)", () => {
    const editable = new Set<string>(SITE_KEYS.map((k) => k.key));
    expect([...read].filter((k) => !editable.has(k) && k !== KEY)).toEqual([]);
  });

  it("every editable setting is actually read by the site", () => {
    expect(SITE_KEYS.map((k) => k.key).filter((k) => !read.has(k))).toEqual([]);
  });
});
