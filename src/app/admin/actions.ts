"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { validateRow, type EditableTable } from "@/lib/admin-fields";
import { assertTable, canTransition, parseRowForm } from "@/lib/form";
import { isSiteKey } from "@/lib/site-content";
import { MEDIA_BUCKET, checkUpload, isMediaPath, mediaPath } from "@/lib/media";

export type ActionResult = { ok: true; message: string; id?: string } | { ok: false; message: string };

const SLUGGED: string[] = ["projects", "technologies", "articles", "experiments"];
const UUID_RE =/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Database errors in words the admin can act on. */
function friendly(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "Something with that URL slug (or name) already exists. Choose another.";
  if (error.code === "23502") return `A required field is missing (${error.message}).`;
  if (error.code === "23503") return "That refers to something that no longer exists. Reload the page and try again.";
  if (error.code === "42501") return "Not permitted. Your session may have expired — sign in again.";
  return error.message;
}

function revalidateFor(table: EditableTable | "project_technologies", slug?: string | null) {
  revalidatePath("/", "layout");
  const map: Partial<Record<string, string>> = {
    projects: "/projects", project_sections: "/projects", project_milestones: "/projects",
    architecture_diagrams: "/projects", technologies: "/system", articles: "/articles",
    experiments: "/lab", timeline_entries: "/experience", site_config: "/about",
  };
  const base = map[table];
  if (base) {
    revalidatePath(base);
    if (slug) revalidatePath(`${base}/${slug}`);
  }
}

/** Create or update a row. Only columns listed in admin-fields.ts are accepted, and they are validated here. */
export async function saveRow(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const table = assertTable(String(formData.get("__table")));
  const id = formData.get("__id") ? String(formData.get("__id")) : null;
  if (id && !UUID_RE.test(id)) return { ok: false, message: "Invalid item." };

  const parsed = parseRowForm(formData);
  if (!parsed.ok) return parsed;
  const row = parsed.row;

  const invalid = validateRow(table, row, !id);
  if (invalid) return { ok: false, message: invalid };

  // site_config's primary key is `key`, not a uuid id — upsert on it.
  if (table === "site_config") {
    if (!isSiteKey(row.key)) return { ok: false, message: "That setting isn't used by the site, so it can't be edited here." };
    // value is NOT NULL; an emptied field means "use the built-in default", which the site reads from "".
    if (row.value === null) row.value = "";
    if (typeof row.value === "string" && row.key !== "about_md" && row.key !== "contact.email" && !/^https?:\/\//.test(row.value)) {
      return { ok: false, message: "Links must start with http:// or https://." };
    }
    if (row.key === "contact.email" && typeof row.value === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.value)) {
      return { ok: false, message: "Enter a valid email address." };
    }
    const { error } = await supabase.from(table).upsert(row, { onConflict: "key" });
    if (error) return { ok: false, message: friendly(error) };
    revalidateFor(table);
    return { ok: true, message: "Saved." };
  }

  const cols = SLUGGED.includes(table) ? "id, slug" : "id";
  const { data, error } = id
    ? await supabase.from(table).update(row).eq("id", id).select(cols).maybeSingle()
    : await supabase.from(table).insert(row).select(cols).maybeSingle();
  if (error) return { ok: false, message: friendly(error) };
  if (id && !data) return { ok: false, message: "Nothing was saved — the item may have been deleted." };

  const saved = data as unknown as { id: string; slug?: string } | null;
  revalidateFor(table, saved?.slug ?? null);
  return { ok: true, message: id ? "Saved." : "Created.", id: saved?.id };
}

export async function deleteRow(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const table = assertTable(String(formData.get("__table")));
  const id = String(formData.get("__id") ?? "");
  if (!UUID_RE.test(id)) return { ok: false, message: "Invalid item." };

  const { data, error } = await supabase.from(table).delete().eq("id", id).select("id");
  if (error) return { ok: false, message: friendly(error) };
  if (!data?.length) return { ok: false, message: "Nothing was deleted — it may already be gone." };

  revalidateFor(table);
  return { ok: true, message: "Deleted." };
}

/** Publish / unpublish / archive / restore — only the transitions stateActions() offers. */
export async function setState(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const table = assertTable(String(formData.get("__table")));
  const id = String(formData.get("__id") ?? "");
  const to = String(formData.get("__state") ?? "");
  if (!UUID_RE.test(id)) return { ok: false, message: "Invalid item." };

  const { data: current, error: readErr } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
  if (readErr || !current) return { ok: false, message: "Item not found." };
  const from = String((current as { state?: string }).state ?? "");
  if (!canTransition(table, from, to)) return { ok: false, message: `Can't change from ${from} to ${to}.` };

  const patch: Record<string, unknown> = { state: to };
  // Stamp published_at the first time something goes live.
  if (to === "published" && "published_at" in current && !(current as { published_at: string | null }).published_at) {
    patch.published_at = new Date().toISOString();
  }

  const { error } = await supabase.from(table).update(patch).eq("id", id);
  if (error) return { ok: false, message: friendly(error) };

  revalidateFor(table, (current as { slug?: string }).slug ?? null);
  const words: Record<string, string> = { published: "Published — now visible on the site.", draft: from === "published" ? "Unpublished — moved back to draft." : "Restored to draft.", archived: "Archived — no longer shown publicly.", hidden: "Hidden from the case study." };
  return { ok: true, message: words[to] ?? "Updated." };
}

/**
 * Swap positions with the neighbour.
 * ponytail: two separate UPDATEs, not atomic — a failure between them can leave
 * two rows sharing a position. Fix is a swap_positions() RPC (needs a migration).
 */
export async function reorder(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const table = assertTable(String(formData.get("__table")));
  const id = String(formData.get("__id"));
  const dir = String(formData.get("__dir")) === "up" ? -1 : 1;
  const scopeCol = formData.get("__scopeCol") ? String(formData.get("__scopeCol")) : null;
  const scopeVal = formData.get("__scopeVal") ? String(formData.get("__scopeVal")) : null;
  if (scopeCol && !["project_id", "category"].includes(scopeCol)) return { ok: false, message: "Invalid scope." };

  let q = supabase.from(table).select("id, position").order("position");
  if (scopeCol && scopeVal) q = q.eq(scopeCol, scopeVal);
  const { data: rows, error } = await q;
  if (error || !rows) return { ok: false, message: error ? friendly(error) : "Could not read order." };

  const list = rows as unknown as { id: string; position: number }[];
  const i = list.findIndex((r) => r.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return { ok: false, message: dir < 0 ? "Already first." : "Already last." };

  // One atomic call (migration 20261017000000): afterwards `first` sorts before `second`, ties included.
  const [first, second] = dir < 0 ? [list[i], list[j]] : [list[j], list[i]];
  const { error: swapErr } = await supabase.rpc("swap_positions", { tbl: table, a: first.id, b: second.id });
  if (swapErr) return { ok: false, message: friendly(swapErr) };

  revalidateFor(table);
  return { ok: true, message: "Moved." };
}

/**
 * Every article save keeps the previous title/body in article_revisions, so a bad edit is
 * recoverable. The articles_snapshot_revision trigger does it in the same transaction as the
 * update (migration 20261017000000); restoring is just another save, so it is undoable too.
 */
export async function saveArticle(formData: FormData): Promise<ActionResult> {
  return saveRow(formData);
}

export async function restoreRevision(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const revisionId = String(formData.get("__revision_id"));
  const articleId = String(formData.get("__article_id"));

  const { data: rev, error } = await supabase
    .from("article_revisions").select("title, body_md").eq("id", revisionId).maybeSingle();
  if (error || !rev) return { ok: false, message: "Revision not found." };

  const fd = new FormData();
  fd.set("__table", "articles");
  fd.set("__id", articleId);
  fd.set("title", (rev as { title: string }).title);
  fd.set("body_md", (rev as { body_md: string | null }).body_md ?? "");
  const r = await saveArticle(fd);
  return r.ok ? { ok: true, message: "Restored. The version it replaced was kept, so this can be undone." } : r;
}

/**
 * project_technologies is a pure join table (project_id, technology_id) with
 * no `id` column, so it can't go through saveRow/deleteRow's `.eq("id", …)`.
 */
export async function addProjectTech(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const project_id = String(formData.get("project_id") ?? "");
  const technology_id = String(formData.get("technology_id") ?? "");
  if (!UUID_RE.test(project_id) || !UUID_RE.test(technology_id)) return { ok: false, message: "Pick a technology." };

  const { error } = await supabase
    .from("project_technologies")
    .upsert({ project_id, technology_id }, { onConflict: "project_id,technology_id" });
  if (error) return { ok: false, message: friendly(error) };

  revalidateFor("project_technologies");
  revalidatePath("/projects");
  revalidatePath("/system");
  return { ok: true, message: "Added." };
}

export async function removeProjectTech(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const project_id = String(formData.get("project_id") ?? "");
  const technology_id = String(formData.get("technology_id") ?? "");
  if (!UUID_RE.test(project_id) || !UUID_RE.test(technology_id)) return { ok: false, message: "Invalid technology." };

  const { error } = await supabase
    .from("project_technologies")
    .delete()
    .eq("project_id", project_id)
    .eq("technology_id", technology_id);
  if (error) return { ok: false, message: friendly(error) };

  revalidateFor("project_technologies");
  revalidatePath("/projects");
  revalidatePath("/system");
  return { ok: true, message: "Removed." };
}

/**
 * Upload one file to Storage. Runs as the signed-in admin (supabaseServer), so storage RLS
 * decides; the service role is never used.
 */
export async function uploadMedia(formData: FormData): Promise<{ ok: true; message: string; url: string } | { ok: false; message: string }> {
  const { supabase } = await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, message: "Choose a file to upload." };

  const check = checkUpload(file.size, new Uint8Array(await file.slice(0, 16).arrayBuffer()));
  if (!check.ok) return check;

  const path = mediaPath(file.name, check.ext);
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, { contentType: check.mime, upsert: false });
  if (error) return { ok: false, message: error.message.includes("row-level security") ? "Not permitted. Your session may have expired — sign in again." : `Upload failed: ${error.message}` };

  revalidatePath("/admin/media");
  return { ok: true, message: "Uploaded.", url: supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl };
}

export async function deleteMedia(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const path = String(formData.get("path") ?? "");
  if (!isMediaPath(path)) return { ok: false, message: "Invalid file." };
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  if (error) return { ok: false, message: `Delete failed: ${error.message}` };
  // Storage returns an empty list (not an error) when RLS hides the object.
  if (!data?.length) return { ok: false, message: "Nothing was deleted. The file may already be gone, or your session expired." };
  revalidatePath("/admin/media");
  return { ok: true, message: "Deleted." };
}

export async function signOut() {
  // No admin check needed to end your own session; skipping it saves two round trips.
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}
