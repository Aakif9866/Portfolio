import { requireAdmin } from "@/lib/auth";
import { SKILLS_KEY, type Skills } from "@/lib/career";
import { normalizeTag } from "@/lib/entries";
import { TECH_GROUPS, type Technology } from "@/lib/types";
import { AdminHeader } from "../ui";
import { WorkspaceError } from "../workspace-error";
import { AddSkill, SkillRow } from "../career/client";

/**
 * Skills: your public tech list (the `technologies` table, unchanged) with a private level
 * and "want to learn" flag on top, plus skills that aren't public yet. Resource counts come
 * from tags: a resource tagged #kafka counts toward Kafka.
 */
export default async function SkillsPage() {
  const { supabase } = await requireAdmin();
  const [techRes, config, links] = await Promise.all([
    supabase.from("technologies").select("id, name, category, position").order("position"),
    supabase.from("private_config").select("value").eq("key", SKILLS_KEY).maybeSingle(),
    supabase.from("entries").select("tags").eq("kind", "link"),
  ]);
  const error = techRes.error ?? config.error ?? links.error;
  const tech = (techRes.data ?? []) as Pick<Technology, "id" | "name" | "category">[];
  const skills = (config.data?.value ?? {}) as Skills;

  const tagCount: Record<string, number> = {};
  for (const l of links.data ?? []) for (const t of l.tags ?? []) tagCount[t] = (tagCount[t] ?? 0) + 1;
  const relatedTo = (name: string) => tagCount[normalizeTag(name)] ?? 0;

  const techNames = new Set(tech.map((t) => t.name));
  const extra = Object.keys(skills).filter((n) => !techNames.has(n)).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-8">
      <AdminHeader title="Skills" description="Levels and “want to learn” are private. The public Tech Stack page doesn't change." />
      {error ? <WorkspaceError error={error} /> : (
        <>
          <section aria-labelledby="extra-h" className="card space-y-3 rounded-2xl p-5">
            <h2 id="extra-h" className="text-[15px] font-semibold">Not on your public list</h2>
            <AddSkill />
            {extra.length > 0 && (
              <ul className="divide-y divide-line">{extra.map((n) => <SkillRow key={n} name={n} note={skills[n]} related={relatedTo(n)} />)}</ul>
            )}
          </section>

          {TECH_GROUPS.map((g) => {
            const items = tech.filter((t) => t.category === g.key);
            if (items.length === 0) return null;
            return (
              <section key={g.key} aria-labelledby={`sk-${g.key}`} className="space-y-1">
                <h2 id={`sk-${g.key}`} className="text-[14px] font-semibold">{g.label}</h2>
                <ul className="divide-y divide-line rounded-2xl border border-line bg-card px-4">
                  {items.map((t) => <SkillRow key={t.id} name={t.name} note={skills[t.name]} related={relatedTo(t.name)} />)}
                </ul>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
