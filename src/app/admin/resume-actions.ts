"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getContact } from "@/lib/contact";
import { MAX_RESUME, newVersionParam, resumeKey, starterResume, type StoredResume } from "@/lib/resume";
import { TECH_GROUPS } from "@/lib/types";
import type { ActionResult } from "./actions";

/**
 * Resumes live in private_config (admin-only RLS): `resume.master` plus `resume.v.<id>` per
 * version. The master is drafted from published portfolio data; versions start as copies of it.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Draft the master profile from published projects, experience and technologies. Never overwrites. */
export async function createMaster(): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { data: existing } = await supabase.from("private_config").select("key").eq("key", "resume.master").maybeSingle();
  if (existing) return { ok: true, message: "Master profile already exists." };

  const [contact, projects, links, timeline, tech] = await Promise.all([
    getContact(),
    supabase.from("projects").select("id, title, thesis, repo_url, demo_url, started_on, ended_on").eq("state", "published").order("position"),
    supabase.from("project_technologies").select("project_id, technologies(name)"),
    supabase.from("timeline_entries").select("kind, organisation, title, location, start_date, end_date, bullets").eq("state", "published").order("start_date", { ascending: false }),
    supabase.from("technologies").select("name, category").order("position"),
  ]);
  const error = projects.error ?? links.error ?? timeline.error ?? tech.error;
  if (error) return { ok: false, message: `Couldn't read the portfolio: ${error.message}` };

  const techOf: Record<string, string[]> = {};
  for (const l of (links.data ?? []) as unknown as { project_id: string; technologies: { name: string } | null }[]) {
    if (l.technologies) (techOf[l.project_id] ??= []).push(l.technologies.name);
  }
  const text = starterResume({
    contact,
    projects: (projects.data ?? []).map((p) => ({ ...p, tech: techOf[p.id] ?? [] })),
    timeline: timeline.data ?? [],
    skills: TECH_GROUPS.map((g) => ({ label: g.label, items: (tech.data ?? []).filter((t) => t.category === g.key).map((t) => t.name) })),
  });

  const value: StoredResume = { title: "Master profile", text };
  const { error: saveErr } = await supabase.from("private_config").insert({ key: "resume.master", value });
  if (saveErr) return { ok: false, message: saveErr.message };
  revalidatePath("/admin/resume", "layout");
  return { ok: true, message: "Master profile drafted from your portfolio.", id: "master" };
}

/** A new version, copied from the master, optionally for one job. Returns its URL param in `id`. */
export async function createVersion(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const jobId = String(formData.get("job_id") ?? "");
  if (jobId && !UUID_RE.test(jobId)) return { ok: false, message: "Invalid job." };

  const { data: master } = await supabase.from("private_config").select("value").eq("key", "resume.master").maybeSingle();
  if (!master) return { ok: false, message: "Create the master profile first." };
  let title = "New version";
  if (jobId) {
    const { data: job } = await supabase.from("entries").select("title").eq("id", jobId).eq("kind", "job").maybeSingle();
    if (!job) return { ok: false, message: "That job no longer exists." };
    title = `For ${job.title}`.slice(0, 120);
  }

  const param = newVersionParam();
  const value: StoredResume = { title, text: (master.value as StoredResume).text, ...(jobId && { job_id: jobId }) };
  const { error } = await supabase.from("private_config").insert({ key: `resume.${param}`, value });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/resume", "layout");
  return { ok: true, message: "Version created.", id: param };
}

export async function saveResume(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const key = resumeKey(String(formData.get("param") ?? ""));
  if (!key) return { ok: false, message: "Invalid resume." };
  const title = String(formData.get("title") ?? "").trim().slice(0, 120) || "Untitled resume";
  const text = String(formData.get("text") ?? "");
  if (text.length > MAX_RESUME) return { ok: false, message: "That resume is too long to save." };
  const jobId = String(formData.get("job_id") ?? "");
  if (jobId && !UUID_RE.test(jobId)) return { ok: false, message: "Invalid job." };

  const value: StoredResume = { title, text, ...(jobId && key !== "resume.master" && { job_id: jobId }) };
  const { error } = await supabase.from("private_config").upsert({ key, value }, { onConflict: "key" });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/resume", "layout");
  return { ok: true, message: "Saved." };
}

export async function deleteResume(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const param = String(formData.get("param") ?? "");
  const key = resumeKey(param);
  if (!key || param === "master") return { ok: false, message: "The master profile can't be deleted here." };
  const { error, count } = await supabase.from("private_config").delete({ count: "exact" }).eq("key", key);
  if (error) return { ok: false, message: error.message };
  if (!count) return { ok: false, message: "Nothing was deleted. It may already be gone." };
  revalidatePath("/admin/resume", "layout");
  return { ok: true, message: "Deleted." };
}
