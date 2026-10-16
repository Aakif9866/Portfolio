"use client";
import { useActionState, useState } from "react";
import { addProjectTech, removeProjectTech, type ActionResult } from "../actions";
import { TECH_GROUPS, type Technology } from "@/lib/types";
import { BTN, Banner, INPUT } from "../ui";

export function TechTags({
  projectId, tagged, available,
}: { projectId: string; tagged: Technology[]; available: Technology[] }) {
  const [note, setNote] = useState<ActionResult | null>(null);
  const [result, submit, pending] = useActionState(
    async (_p: ActionResult | null, fd: FormData) => { setNote(null); return addProjectTech(fd); },
    null,
  );

  async function untag(t: Technology) {
    const fd = new FormData();
    fd.set("project_id", projectId);
    fd.set("technology_id", t.id);
    setNote(await removeProjectTech(fd));
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[13px] font-medium">Tagged ({tagged.length})</h3>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {tagged.length === 0 && <span className="text-[13.5px] text-muted">None yet. Add the technologies this project was built with.</span>}
          {tagged.map((t) => (
            <span key={t.id} className="inline-flex items-center gap-1 rounded-lg border border-line bg-raised py-1 pl-2.5 pr-1 font-mono text-[12.5px]">
              {t.name}
              <button type="button" onClick={() => untag(t)} aria-label={`Remove ${t.name}`} className="grid h-5 w-5 place-items-center rounded text-faint transition-colors hover:bg-rose-500/10 hover:text-rose-500">×</button>
            </span>
          ))}
        </div>
      </div>

      {available.length > 0 && (
        <form action={submit} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="project_id" value={projectId} />
          <div>
            <label htmlFor="add-tech" className="block text-[13px] font-medium">Add a technology</label>
            <select id="add-tech" name="technology_id" defaultValue="" required className={`${INPUT} mt-1.5 w-64`}>
              <option value="" disabled>Choose…</option>
              {TECH_GROUPS.map((g) => {
                const items = available.filter((t) => t.category === g.key);
                return items.length ? (
                  <optgroup key={g.key} label={g.label}>
                    {items.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </optgroup>
                ) : null;
              })}
            </select>
          </div>
          <button disabled={pending} className={BTN.secondary}>{pending ? "Adding…" : "Add"}</button>
        </form>
      )}
      <p className="text-[12.5px] text-muted">Missing one? Add it under <a href="/admin/technologies" className="text-accent hover:underline">Technologies</a> first.</p>
      <Banner result={note ?? result} />
    </div>
  );
}
