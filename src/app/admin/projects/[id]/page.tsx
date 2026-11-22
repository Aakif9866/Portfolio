import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { saveRow } from "../../actions";
import { AdminHeader, BTN, NewRowPanel, RowActions, RowForm, StateButtons, StateChip } from "../../ui";
import { TechTags } from "../tech-tags";
import { projectChecks } from "../../checks";
import { FIELDS } from "@/lib/admin-fields";
import { PUBLISH_STATE } from "@/lib/labels";
import { ArchitectureDiagram } from "@/components/diagram";
import { SECTION_LABEL, SECTION_ORDER } from "@/lib/types";
import type { Diagram, Milestone, Project, ProjectSection, Technology } from "@/lib/types";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "case-study", label: "Case study" },
  { key: "technologies", label: "Technologies" },
  { key: "architecture", label: "Architecture" },
  { key: "milestones", label: "Milestones" },
  { key: "publishing", label: "Publishing" },
] as const;

const byCanonical = (a: ProjectSection, b: ProjectSection) =>
  SECTION_ORDER.indexOf(a.kind as never) - SECTION_ORDER.indexOf(b.kind as never) || a.position - b.position;

export default async function ProjectWorkspace({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const [{ id }, { tab: rawTab }] = await Promise.all([params, searchParams]);
  const tab = TABS.some((t) => t.key === rawTab) ? rawTab! : "overview";
  const { supabase } = await requireAdmin();

  const { data: projectRow } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (!projectRow) notFound();
  const project = projectRow as Project;

  const [sectionsRes, diagramsRes, milestonesRes, linksRes, techRes] = await Promise.all([
    supabase.from("project_sections").select("*").eq("project_id", id),
    supabase.from("architecture_diagrams").select("*").eq("project_id", id).order("position"),
    supabase.from("project_milestones").select("*").eq("project_id", id).order("position"),
    supabase.from("project_technologies").select("technology_id").eq("project_id", id),
    supabase.from("technologies").select("*").order("category").order("position"),
  ]);
  const sections = ((sectionsRes.data ?? []) as ProjectSection[]).sort(byCanonical);
  const diagrams = (diagramsRes.data ?? []) as Diagram[];
  const milestones = (milestonesRes.data ?? []) as Milestone[];
  const taggedIds = new Set(((linksRes.data ?? []) as { technology_id: string }[]).map((l) => l.technology_id));
  const allTech = (techRes.data ?? []) as Technology[];
  const checks = projectChecks(project, sections, taggedIds.size, diagrams.length);
  const fixed = { project_id: id };
  const base = `/admin/projects/${id}`;

  const counts: Record<string, string> = {
    "case-study": `${sections.filter((s) => s.state === "published").length}/${sections.length}`,
    technologies: String(taggedIds.size),
    architecture: String(diagrams.length),
    milestones: String(milestones.length),
    publishing: `${checks.filter((c) => c.done).length}/${checks.length}`,
  };

  return (
    <div className="space-y-6">
      <Link href="/admin/projects" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">← All projects</Link>

      <AdminHeader
        title={project.title}
        description={<span className="inline-flex flex-wrap items-center gap-2"><StateChip state={project.state} /> {PUBLISH_STATE[project.state]?.help}</span>}
        actions={
          <>
            <Link href={`${base}/preview`} className={BTN.secondary}>Preview</Link>
            {project.state === "published" && <a href={`/projects/${project.slug}`} target="_blank" rel="noopener" className={BTN.secondary}>View live ↗</a>}
          </>
        }
      />

      <nav aria-label="Project sections" className="-mx-1 overflow-x-auto border-b border-line">
        <ul className="flex w-max gap-1 px-1">
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <li key={t.key}>
                <Link
                  href={`${base}?tab=${t.key}`}
                  aria-current={active ? "page" : undefined}
                  className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[14px] transition-colors ${
                    active ? "border-accent font-medium text-ink" : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  {t.label}
                  {counts[t.key] && <span className="rounded-full bg-raised px-1.5 text-[11.5px] text-muted">{counts[t.key]}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {tab === "overview" && (
        <section className="card rounded-2xl p-5 sm:p-6">
          <RowForm table="projects" fields={FIELDS.projects} row={project as unknown as Record<string, unknown>} action={saveRow} />
        </section>
      )}

      {tab === "case-study" && (
        <div className="space-y-5">
          <p className="text-[14px] leading-relaxed text-muted">
            Sections always appear on the case study in the order below, whatever order you add them in.
            Only <strong className="font-medium text-ink">published</strong> sections are shown publicly.
          </p>
          <div className="card grid gap-px overflow-hidden rounded-2xl bg-line sm:grid-cols-2 lg:grid-cols-3">
            {SECTION_ORDER.map((k) => {
              const s = sections.find((x) => x.kind === k);
              return (
                <div key={k} className="flex items-center justify-between gap-2 bg-card px-4 py-2.5 text-[13.5px]">
                  <span className={s ? "text-ink" : "text-muted"}>{SECTION_LABEL[k]}</span>
                  {s ? <StateChip state={s.state} /> : <span className="text-[12px] text-faint">Not added</span>}
                </div>
              );
            })}
          </div>
          <NewRowPanel table="project_sections" fields={FIELDS.project_sections} fixed={fixed} action={saveRow} label="Add a section" />
          {sections.length === 0 ? (
            <p className="card rounded-2xl px-6 py-8 text-center text-[14px] text-muted">No sections yet — the case study shows only its header until you add one.</p>
          ) : (
            <ul className="space-y-3">
              {sections.map((s) => (
                <li key={s.id} className="card rounded-2xl p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-semibold">{s.heading ?? SECTION_LABEL[s.kind] ?? s.kind}</h3>
                    {s.heading && <span className="text-[12.5px] text-muted">({SECTION_LABEL[s.kind]})</span>}
                    <StateChip state={s.state} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-muted">{s.body_md?.trim() || "No content yet."}</p>
                  <div className="mt-4 border-t border-line pt-3.5">
                    <RowActions
                      table="project_sections"
                      row={{ ...s, title: s.heading ?? SECTION_LABEL[s.kind] } as unknown as Record<string, unknown>}
                      fields={FIELDS.project_sections}
                      fixed={fixed}
                      action={saveRow}
                      scope={{ col: "project_id", val: id }}
                      reorderable={false}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "technologies" && (
        <section className="card rounded-2xl p-5 sm:p-6">
          <TechTags
            projectId={id}
            tagged={allTech.filter((t) => taggedIds.has(t.id))}
            available={allTech.filter((t) => !taggedIds.has(t.id))}
          />
        </section>
      )}

      {tab === "architecture" && (
        <div className="space-y-5">
          <p className="text-[14px] leading-relaxed text-muted">
            Diagrams appear under the Architecture section of the case study. A screenshot link is enough on
            its own; the interactive boxes (under Advanced settings) are optional.
          </p>
          <NewRowPanel table="architecture_diagrams" fields={FIELDS.architecture_diagrams} fixed={fixed} action={saveRow} label="Add a diagram" />
          {diagrams.length === 0 ? (
            <p className="card rounded-2xl px-6 py-8 text-center text-[14px] text-muted">No diagrams yet.</p>
          ) : (
            <ul className="space-y-4">
              {diagrams.map((d) => (
                <li key={d.id} className="card rounded-2xl p-5">
                  <h3 className="text-[15px] font-semibold">{d.title}</h3>
                  <div className="mt-4"><ArchitectureDiagram diagram={d} /></div>
                  <div className="mt-4 border-t border-line pt-3.5">
                    <RowActions table="architecture_diagrams" row={d as unknown as Record<string, unknown>} fields={FIELDS.architecture_diagrams} fixed={fixed} action={saveRow} scope={{ col: "project_id", val: id }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "milestones" && (
        <div className="space-y-5">
          <p className="text-[14px] leading-relaxed text-muted">Dated moments shown as a timeline at the end of the case study. They appear as soon as they&apos;re saved.</p>
          <NewRowPanel table="project_milestones" fields={FIELDS.project_milestones} fixed={fixed} action={saveRow} label="Add a milestone" />
          {milestones.length === 0 ? (
            <p className="card rounded-2xl px-6 py-8 text-center text-[14px] text-muted">No milestones yet.</p>
          ) : (
            <ul className="space-y-3">
              {milestones.map((m) => (
                <li key={m.id} className="card rounded-2xl p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-semibold">{m.title}</h3>
                    <span className="rounded-md bg-raised px-2 py-0.5 text-[12px] text-muted">{m.label}</span>
                    <span className="text-[13px] text-muted">{m.occurred_on ? new Date(m.occurred_on).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "No date"}</span>
                  </div>
                  <div className="mt-4 border-t border-line pt-3.5">
                    <RowActions table="project_milestones" row={m as unknown as Record<string, unknown>} fields={FIELDS.project_milestones} fixed={fixed} action={saveRow} scope={{ col: "project_id", val: id }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "publishing" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="card rounded-2xl p-5 sm:p-6">
            <h2 className="text-[15px] font-semibold">Status</h2>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-[14px] text-muted">
              <StateChip state={project.state} /> {PUBLISH_STATE[project.state]?.help}.
            </p>
            <ul className="mt-4 space-y-1.5 text-[13px] text-muted">
              <li><strong className="font-medium text-ink">Draft</strong> — not visible on public pages.</li>
              <li><strong className="font-medium text-ink">Published</strong> — visible on public pages within a few seconds.</li>
              <li><strong className="font-medium text-ink">Archived</strong> — kept for reference; not shown publicly.</li>
            </ul>
            <div className="mt-5">
              <StateButtons table="projects" id={id} state={project.state} onDeleted="/admin/projects" />
            </div>
          </section>
          <section className="card rounded-2xl p-5 sm:p-6">
            <h2 className="text-[15px] font-semibold">Checklist</h2>
            <p className="mt-1 text-[13px] text-muted">Suggestions for a strong case study. None of these block publishing.</p>
            <ul className="mt-4 divide-y divide-line">
              {checks.map((c) => (
                <li key={c.label} className="flex items-start gap-3 py-2.5">
                  <span aria-hidden className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] ${c.done ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-raised text-faint"}`}>{c.done ? "✓" : ""}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px]">{c.label}<span className="sr-only">{c.done ? " — done" : " — not done"}</span></p>
                    {!c.done && <p className="text-[12.5px] text-muted">{c.hint}</p>}
                  </div>
                  {!c.done && <Link href={`${base}?tab=${c.tab}`} className="shrink-0 text-[13px] text-accent hover:underline">Fix</Link>}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
