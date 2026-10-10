"use client";
import { useActionState } from "react";
import { addProjectTech, removeProjectTech, type ActionResult } from "../actions";
import type { Technology } from "@/lib/types";

export function TechTags({
  projectId, tagged, available,
}: { projectId: string; tagged: Technology[]; available: Technology[] }) {
  const [result, submit, pending] = useActionState(
    async (_p: ActionResult | null, fd: FormData) => addProjectTech(fd),
    null,
  );

  async function untag(technologyId: string) {
    const fd = new FormData();
    fd.set("project_id", projectId);
    fd.set("technology_id", technologyId);
    await removeProjectTech(fd);
  }

  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-faint">
        Technologies <span className="font-mono font-normal">{tagged.length}</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {tagged.length === 0 && <span className="text-[12.5px] text-faint">None tagged yet.</span>}
        {tagged.map((t) => (
          <button
            key={t.id}
            onClick={() => untag(t.id)}
            title="Remove"
            className="group inline-flex items-center gap-1.5 rounded-md border border-line bg-raised px-2 py-0.5 font-mono text-[11px] text-muted transition-colors hover:border-rose-500/40 hover:text-rose-500"
          >
            {t.name}
            <span className="text-faint group-hover:text-rose-500">×</span>
          </button>
        ))}
      </div>

      {available.length > 0 && (
        <form action={submit} className="mt-2.5 flex items-center gap-2">
          <input type="hidden" name="project_id" value={projectId} />
          <select
            name="technology_id"
            defaultValue=""
            className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-accent"
          >
            <option value="" disabled>Add technology…</option>
            {available.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button
            disabled={pending}
            className="rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted transition-colors hover:bg-raised hover:text-ink disabled:opacity-50"
          >
            {pending ? "Adding…" : "Add"}
          </button>
          {result && !result.ok && <span className="text-[12px] text-rose-500">{result.message}</span>}
        </form>
      )}
    </div>
  );
}
