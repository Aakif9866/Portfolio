import { supabasePublic } from "./supabase/server";
import type { Project, Technology } from "./types";

/** Tech names keyed by project id, in one round trip instead of N. */
export async function techByProject(projectIds: string[]) {
  if (projectIds.length === 0) return {} as Record<string, string[]>;
  const sb = supabasePublic();
  const { data } = await sb
    .from("project_technologies")
    .select("project_id, technologies(name)")
    .in("project_id", projectIds);

  const map: Record<string, string[]> = {};
  for (const row of (data ?? []) as unknown as { project_id: string; technologies: { name: string } | null }[]) {
    if (!row.technologies) continue;
    (map[row.project_id] ??= []).push(row.technologies.name);
  }
  return map;
}

export async function publishedProjects() {
  const sb = supabasePublic();
  const { data } = await sb
    .from("projects")
    .select("*")
    .eq("state", "published")
    .order("position", { ascending: true });
  return (data ?? []) as Project[];
}

export async function allTechnologies() {
  const sb = supabasePublic();
  const { data } = await sb
    .from("technologies")
    .select("*")
    .order("category")
    .order("position", { ascending: true });
  return (data ?? []) as Technology[];
}
