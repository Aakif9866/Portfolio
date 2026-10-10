"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

/** Tables this admin UI is allowed to touch. Anything else is rejected. */
const TABLES = [
  "projects", "project_sections", "project_milestones", "technologies",
  "articles", "experiments", "timeline_entries", "architecture_diagrams",
  "site_config", "project_technologies",
] as const;
type Table = (typeof TABLES)[number];

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

function assertTable(t: string): Table {
  if (!(TABLES as readonly string[]).includes(t)) throw new Error(`Table not permitted: ${t}`);
  return t as Table;
}

/** Empty string from a form means NULL, not "". Numbers and booleans are coerced. */
function clean(raw: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === "" || v === undefined) { out[k] = null; continue; }
    out[k] = v;
  }
  return out;
}

function revalidateFor(table: Table, slug?: string | null) {
  revalidatePath("/", "layout");
  const map: Partial<Record<Table, string>> = {
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

export async function saveRow(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const table = assertTable(String(formData.get("__table")));
  const id = formData.get("__id") ? String(formData.get("__id")) : null;

  const payload: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("__")) continue;
    if (key.endsWith("[]")) {
      const name = key.slice(0, -2);
      (payload[name] as string[] | undefined) ?? (payload[name] = []);
      (payload[name] as string[]).push(String(value));
      continue;
    }
    if (key.startsWith("num:")) { payload[key.slice(4)] = Number(value); continue; }
    if (key.startsWith("bool:")) { payload[key.slice(5)] = value === "on" || value === "true"; continue; }
    if (key.startsWith("json:")) {
      const name = key.slice(5);
      try { payload[name] = value ? JSON.parse(String(value)) : null; }
      catch { return { ok: false, message: `${name} is not valid JSON.` }; }
      continue;
    }
    if (key.startsWith("lines:")) {
      const name = key.slice(6);
      payload[name] = String(value).split("\n").map((l) => l.trim()).filter(Boolean);
      continue;
    }
    payload[key] = value;
  }

  // Unchecked checkboxes never reach the server, so declared booleans default to false.
  for (const b of String(formData.get("__booleans") ?? "").split(",").filter(Boolean)) {
    if (!(b in payload)) payload[b] = false;
  }

  const row = clean(payload);

  // site_config's primary key is `key`, not a uuid id — upsert on it.
  if (table === "site_config") {
    const { error } = await supabase.from(table).upsert(row, { onConflict: "key" });
    if (error) return { ok: false, message: error.message };
    revalidateFor(table);
    return { ok: true, message: "Saved." };
  }

  const { data, error } = id
    ? await supabase.from(table).update(row).eq("id", id).select("*").maybeSingle()
    : await supabase.from(table).insert(row).select("*").maybeSingle();

  if (error) return { ok: false, message: error.message };

  revalidateFor(table, (data as { slug?: string } | null)?.slug ?? null);
  return { ok: true, message: id ? "Saved." : "Created." };
}

export async function deleteRow(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const table = assertTable(String(formData.get("__table")));
  const id = String(formData.get("__id"));
  if (!id) return { ok: false, message: "Missing id." };

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidateFor(table);
  return { ok: true, message: "Deleted." };
}

/** draft → published → archived, as a single explicit transition. */
export async function setState(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const table = assertTable(String(formData.get("__table")));
  const id = String(formData.get("__id"));
  const state = String(formData.get("__state"));
  if (!["draft", "published", "archived", "hidden", "empty"].includes(state)) {
    return { ok: false, message: "Unknown state." };
  }

  const patch: Record<string, unknown> = { state };
  // Stamp published_at the first time something goes live.
  if (state === "published" && ["projects", "articles"].includes(table)) {
    const { data: existing } = await supabase.from(table).select("published_at").eq("id", id).maybeSingle();
    if (existing && !(existing as { published_at: string | null }).published_at) {
      patch.published_at = new Date().toISOString();
    }
  }

  const { error } = await supabase.from(table).update(patch).eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidateFor(table);
  return { ok: true, message: `Moved to ${state}.` };
}

/** Swap positions with the neighbour. Cheap, and correct for small ordered lists. */
export async function reorder(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const table = assertTable(String(formData.get("__table")));
  const id = String(formData.get("__id"));
  const dir = String(formData.get("__dir")) === "up" ? -1 : 1;
  const scopeCol = formData.get("__scopeCol") ? String(formData.get("__scopeCol")) : null;
  const scopeVal = formData.get("__scopeVal") ? String(formData.get("__scopeVal")) : null;

  let q = supabase.from(table).select("id, position").order("position");
  if (scopeCol && scopeVal) q = q.eq(scopeCol, scopeVal);
  const { data: rows, error } = await q;
  if (error || !rows) return { ok: false, message: error?.message ?? "Could not read order." };

  const list = rows as { id: string; position: number }[];
  const i = list.findIndex((r) => r.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return { ok: false, message: "Already at the end." };

  const [a, b] = [list[i], list[j]];
  const r1 = await supabase.from(table).update({ position: b.position }).eq("id", a.id);
  const r2 = await supabase.from(table).update({ position: a.position }).eq("id", b.id);
  if (r1.error || r2.error) return { ok: false, message: (r1.error ?? r2.error)!.message };

  revalidateFor(table);
  return { ok: true, message: "Reordered." };
}

/**
 * Every article save snapshots the previous body into article_revisions, so a
 * bad edit is recoverable. Restoring is just another save, which itself
 * snapshots — so restore is undoable too.
 */
export async function saveArticle(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const id = formData.get("__id") ? String(formData.get("__id")) : null;

  if (id) {
    const { data: before } = await supabase
      .from("articles").select("title, body_md").eq("id", id).maybeSingle();
    if (before) {
      const { error: revErr } = await supabase.from("article_revisions").insert({
        article_id: id,
        title: (before as { title: string }).title,
        body_md: (before as { body_md: string | null }).body_md,
      });
      if (revErr) return { ok: false, message: `Could not snapshot revision: ${revErr.message}` };
    }
  }
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
  return saveArticle(fd);
}

/**
 * project_technologies is a pure join table (project_id, technology_id) with
 * no `id` column, so it can't go through saveRow/deleteRow's `.eq("id", …)`.
 */
export async function addProjectTech(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const project_id = String(formData.get("project_id") ?? "");
  const technology_id = String(formData.get("technology_id") ?? "");
  if (!project_id || !technology_id) return { ok: false, message: "Pick a technology." };

  const { error } = await supabase
    .from("project_technologies")
    .upsert({ project_id, technology_id }, { onConflict: "project_id,technology_id" });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/projects");
  revalidatePath("/system");
  return { ok: true, message: "Tagged." };
}

export async function removeProjectTech(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const project_id = String(formData.get("project_id") ?? "");
  const technology_id = String(formData.get("technology_id") ?? "");

  const { error } = await supabase
    .from("project_technologies")
    .delete()
    .eq("project_id", project_id)
    .eq("technology_id", technology_id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/projects");
  revalidatePath("/system");
  return { ok: true, message: "Untagged." };
}

export async function signOut() {
  const { supabase } = await requireAdmin();
  await supabase.auth.signOut();
  redirect("/login");
}
