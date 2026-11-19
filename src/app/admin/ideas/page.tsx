import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { IDEA_COLUMNS, ideaColumn, type Entry } from "@/lib/entries";
import { ENTRY_STATUS } from "@/lib/labels";
import { AdminHeader } from "../ui";
import { StartProjectButton, StatusPicker } from "../workspace-ui";
import { WorkspaceError } from "../workspace-error";

/**
 * Ideas board: Someday → Next → Active → Dropped. Moving a card is one click on its status.
 * "Start project" turns an idea into a draft project (private until you publish it).
 */
export default async function Ideas() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("entries").select("*").eq("kind", "idea")
    .order("pinned", { ascending: false }).order("updated_at", { ascending: false }).limit(300);
  const ideas = (data ?? []) as Entry[];

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Ideas"
        description={<>Projects, experiments and things to try someday. Type <code className="font-mono text-[12.5px]">idea: …</code> in the capture box. New ideas start in Someday.</>}
      />
      {error ? <WorkspaceError error={error} /> : ideas.length === 0 ? (
        <p className="card rounded-2xl px-6 py-12 text-center text-[14px] text-muted">No ideas yet. Try “idea: a CLI that benchmarks pgvector indexes” in the box above.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {IDEA_COLUMNS.map((col) => {
            const cards = ideas.filter((i) => ideaColumn(i.status) === col);
            return (
              <section key={col} aria-labelledby={`col-${col}`} className={`rounded-2xl border border-line bg-surface p-3 ${col === "dropped" ? "opacity-80" : ""}`}>
                <h2 id={`col-${col}`} className="mb-3 flex items-baseline justify-between px-1 text-[13.5px] font-semibold">
                  {ENTRY_STATUS.idea[col].label} <span className="font-normal text-faint">{cards.length}</span>
                </h2>
                <ul className="space-y-2.5">
                  {cards.map((i) => {
                    const projectId = typeof i.meta?.project_id === "string" ? i.meta.project_id : undefined;
                    return (
                      <li key={i.id} className="card rounded-xl p-3">
                        <Link href={`/admin?e=${i.id}`} className="block text-[14px] font-medium text-ink hover:text-accent">{i.title || i.url}</Link>
                        {i.body_md && <p className="mt-1 line-clamp-3 text-[12.5px] text-muted">{i.body_md}</p>}
                        {i.tags.length > 0 && <p className="mt-1 font-mono text-[11px] text-faint">{i.tags.map((t) => `#${t}`).join(" ")}</p>}
                        <div className="mt-2.5 space-y-2">
                          <StatusPicker id={i.id} kind="idea" status={ideaColumn(i.status)} only={IDEA_COLUMNS.filter((c) => c !== col)} />
                          {col !== "dropped" && <StartProjectButton id={i.id} projectId={projectId} />}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
