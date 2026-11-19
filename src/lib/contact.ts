import { cache } from "react";
import { supabasePublic } from "./supabase/server";
import { fetchOrThrow } from "./db";
import { DEFAULT_PALETTE, PALETTE_KEY, isPalette, type PaletteId } from "./palettes";

export type Contact = { email: string; github: string; linkedin: string | null };

/** Keys in site_config that drive contact links. Editable under Admin → Settings. */
export const CONTACT_KEYS = ["contact.email", "social.github", "social.linkedin"] as const;

const FALLBACK: Contact = { email: "aakif9866@gmail.com", github: "https://github.com/Aakif9866", linkedin: null };

/** The site_config values the layout needs (contact links + colour scheme), read once per render. */
const siteValues = cache(async () => {
  const { data } = await fetchOrThrow("contact settings", (s) =>
    supabasePublic().from("site_config").select("key,value").abortSignal(s).in("key", [...CONTACT_KEYS, PALETTE_KEY]));
  const v: Record<string, string | null> = {};
  for (const r of (data ?? []) as { key: string; value: unknown }[]) {
    v[r.key] = typeof r.value === "string" && r.value.trim() ? r.value.trim() : null;
  }
  return v;
});

/** Contact links from site_config, falling back to built-in values. Deduped per render. */
export const getContact = cache(async (): Promise<Contact> => {
  const v = await siteValues();
  return {
    email: v["contact.email"] ?? FALLBACK.email,
    github: v["social.github"] ?? FALLBACK.github,
    linkedin: v["social.linkedin"] ?? FALLBACK.linkedin,
  };
});

/** The colour scheme chosen on the admin dashboard; unknown or missing values fall back to Aurora. */
export const getPalette = cache(async (): Promise<PaletteId> => {
  const v = (await siteValues())[PALETTE_KEY];
  return isPalette(v) ? v : DEFAULT_PALETTE;
});
