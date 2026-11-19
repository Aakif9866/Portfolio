/** Every colour scheme in the picker has its CSS, in both themes; Aurora is the default. */
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { DEFAULT_PALETTE, PALETTES, isPalette } from "@/lib/palettes";

const css = readFileSync("src/app/globals.css", "utf8");

it("defines a block per non-default scheme, for dark and light", () => {
  for (const { id } of PALETTES.filter((p) => p.id !== DEFAULT_PALETTE)) {
    expect(css, id).toContain(`:root[data-palette="${id}"] {`);
    expect(css, id).toContain(`:root[data-palette="${id}"][data-theme="dark"]`);
    expect(css, id).toContain(`:root[data-palette="${id}"]:not([data-theme="dark"])`);
  }
});

it("only accepts known ids", () => {
  expect(isPalette("ocean")).toBe(true);
  for (const v of ["", "pink", null, 3, "aurora; color:red"]) expect(isPalette(v)).toBe(false);
});
