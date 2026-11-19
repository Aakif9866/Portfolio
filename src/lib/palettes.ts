/**
 * Colour schemes for the public site, chosen on the admin dashboard and stored in site_config
 * under PALETTE_KEY. Each id maps to a `:root[data-palette="…"]` block in globals.css; "aurora"
 * (the original orange → rose → violet → sky) is the default and needs no block. `swatch` is only
 * for the picker.
 */
export const PALETTE_KEY = "theme.palette";

export const PALETTES = [
  { id: "aurora", name: "Aurora", note: "The original: orange, rose, violet and sky, rose → violet mark", swatch: ["#fb923c", "#f43f5e", "#a855f7", "#38bdf8"] },
  { id: "apple", name: "Apple Blue", note: "System blue mark, green → cyan → blue shine", swatch: ["#30d158", "#64d2ff", "#0a84ff", "#0040dd"] },
  { id: "emerald", name: "Emerald", note: "Lime, mint and teal on black", swatch: ["#a3e635", "#34d399", "#2dd4bf", "#22d3ee"] },
  { id: "solar", name: "Solar", note: "Gold, amber and flame", swatch: ["#fde047", "#fbbf24", "#fb923c", "#f97316"] },
  { id: "ocean", name: "Ocean", note: "Cyan, sky and deep blue", swatch: ["#22d3ee", "#38bdf8", "#3b82f6", "#6366f1"] },
  { id: "titanium", name: "Titanium", note: "Monochrome silver, like brushed metal", swatch: ["#ffffff", "#d4d4d8", "#a1a1aa", "#52525b"] },
] as const;

export type PaletteId = (typeof PALETTES)[number]["id"];
export const DEFAULT_PALETTE: PaletteId = "aurora";
export const isPalette = (v: unknown): v is PaletteId => PALETTES.some((p) => p.id === v);
