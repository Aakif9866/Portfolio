"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { isFetchableUrl, parseCapture, parsePreview, urlTitle, validateEntry, type LinkPreview } from "@/lib/entries";
import type { ActionResult } from "./actions";

/**
 * Private workspace writes. Every action runs as the signed-in admin (supabaseServer via
 * requireAdmin), so RLS on `entries` is the authority; nothing here uses the service role,
 * and nothing revalidates a public path, because no public page reads these tables.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function friendly(error: { code?: string; message: string }) {
  if (error.code === "42501") return "Not permitted. Your session may have expired — sign in again.";
  if (error.code === "42P01" || error.code === "PGRST205") return "The workspace tables don't exist yet: the migration hasn't been applied.";
  return error.message;
}

/** Title, site and image for a link, in at most 4 s. Any failure just means no preview. */
async function preview(url: string): Promise<LinkPreview | null> {
  if (!isFetchableUrl(url)) return null;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; PortfolioLinkPreview/1.0)", accept: "text/html" },
      redirect: "follow",
    });
    if (!res.ok || !res.body || !(res.headers.get("content-type") ?? "").includes("html")) return null;
    // The <head> is near the top; never read more than 256 KB of a page.
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < 256 * 1024) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
    }
    reader.cancel().catch(() => {});
    return parsePreview(new TextDecoder().decode(Buffer.concat(chunks)), res.url || url);
  } catch {
    return null;
  }
}

/** Quick capture: one line of text in, one entry out. */
export async function captureEntry(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const capture = parseCapture(String(formData.get("text") ?? ""));
  if (!capture) return { ok: false, message: "Type something, or paste a link." };

  let { title } = capture;
  let meta: Record<string, string> = {};
  if (capture.url) {
    const p = await preview(capture.url);
    title = (p?.title || urlTitle(capture.url)).slice(0, 300);
    meta = Object.fromEntries(Object.entries({ site: p?.site, description: p?.description, image: p?.image }).filter(([, v]) => v)) as Record<string, string>;
  }

  const { data, error } = await supabase
    .from("entries")
    .insert({ kind: capture.kind, title, body_md: capture.body_md, url: capture.url, tags: capture.tags, meta })
    .select("id")
    .single();
  if (error) return { ok: false, message: friendly(error) };
  revalidatePath("/admin");
  return { ok: true, message: "Saved.", id: data.id };
}

export async function saveEntry(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) return { ok: false, message: "Invalid entry." };

  const parsed = validateEntry(Object.fromEntries(formData));
  if (!parsed.ok) return parsed;

  const { error } = await supabase.from("entries").update(parsed.row).eq("id", id);
  if (error) return { ok: false, message: friendly(error) };
  revalidatePath("/admin");
  return { ok: true, message: "Saved." };
}

export async function deleteEntry(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) return { ok: false, message: "Invalid entry." };
  const { error, count } = await supabase.from("entries").delete({ count: "exact" }).eq("id", id);
  if (error) return { ok: false, message: friendly(error) };
  if (!count) return { ok: false, message: "Nothing was deleted. It may already be gone." };
  revalidatePath("/admin");
  return { ok: true, message: "Deleted." };
}

export async function togglePin(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) return { ok: false, message: "Invalid entry." };
  const { error } = await supabase.from("entries").update({ pinned: formData.get("pinned") === "true" }).eq("id", id);
  if (error) return { ok: false, message: friendly(error) };
  revalidatePath("/admin");
  return { ok: true, message: "Saved." };
}
