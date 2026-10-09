"use client";
import { useState } from "react";
import { restoreRevision, type ActionResult } from "../actions";

export function Revisions({
  articleId, revisions,
}: { articleId: string; revisions: { id: string; title: string; created_at: string }[] }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<ActionResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function restore(id: string) {
    if (!confirm("Restore this revision? The current body is snapshotted first, so this is undoable.")) return;
    setBusy(id);
    const fd = new FormData();
    fd.set("__revision_id", id);
    fd.set("__article_id", articleId);
    setNote(await restoreRevision(fd));
    setBusy(null);
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <button onClick={() => setOpen((v) => !v)} className="text-[12.5px] font-medium text-muted hover:text-ink" aria-expanded={open}>
        {open ? "Hide" : "Show"} {revisions.length} revision{revisions.length === 1 ? "" : "s"}
      </button>

      {note && (
        <p className={`mt-3 rounded-lg px-3 py-2 text-[12.5px] ${note.ok ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "bg-rose-500/10 text-rose-600 dark:text-rose-300"}`}>
          {note.message}
        </p>
      )}

      {open && (
        <ul className="mt-3 divide-y divide-line">
          {revisions.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-[13px]">{r.title}</p>
                <p className="font-mono text-[11px] text-faint">
                  {new Date(r.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <button
                onClick={() => restore(r.id)}
                disabled={busy === r.id}
                className="shrink-0 rounded-md border border-line px-2.5 py-1 text-[11.5px] text-muted transition-colors hover:bg-raised hover:text-ink disabled:opacity-50"
              >
                {busy === r.id ? "Restoring…" : "Restore"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
