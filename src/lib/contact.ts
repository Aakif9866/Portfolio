import { cache } from "react";
import { supabasePublic } from "./supabase/server";

export type Contact = { email: string; github: string; linkedin: string | null };

/** Keys in site_config that drive contact links. Editable under Admin → Settings. */
export const CONTACT_KEYS = ["contact.email", "social.github", "social.linkedin"] as const;

const FALLBACK: Contact = { email: "aakif9866@gmail.com", github: "https://github.com/Aakif9866", linkedin: null };

/** Contact links from site_config, falling back to built-in values. Deduped per render. */
export const getContact = cache(async (): Promise<Contact> => {
  const { data } = await supabasePublic().from("site_config").select("key,value").in("key", [...CONTACT_KEYS]);
  const v: Record<string, string | null> = {};
  for (const r of (data ?? []) as { key: string; value: unknown }[]) {
    v[r.key] = typeof r.value === "string" && r.value.trim() ? r.value.trim() : null;
  }
  return {
    email: v["contact.email"] ?? FALLBACK.email,
    github: v["social.github"] ?? FALLBACK.github,
    linkedin: v["social.linkedin"] ?? FALLBACK.linkedin,
  };
});
