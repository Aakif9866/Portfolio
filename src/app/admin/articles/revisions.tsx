"use client";
import { useState } from "react";
import { restoreRevision, type ActionResult } from "../actions";
import { BTN, Banner, ConfirmButton } from "../ui";

export function Revisions({
  articleId, revisions,
}: { articleId: string; revisions: { id: string; title: string; created_at: string }[] }) {
  const [note, setNote] = useState<ActionResult | null>(null);

  async function restore(id: string) {
    const fd = new FormData();
    fd.set("__revision_id", id);
    fd.set("__article_id", articleId);
    setNote(await restoreRevision(fd));
  }

  return (
    <details className="rounded-xl border border-line bg-surface px-4 py-3">
      <summary className="cursor-pointer text-[13px] font-medium text-muted">
        Revisions — {revisions.length} earlier version{revisions.length === 1 ? "" : "s"}
      </summary>
      <div className="mt-3 space-y-3">
        <Banner result={note} />
        <ul className="divide-y divide-line">
          {revisions.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-[13.5px]">{r.title}</p>
                <p className="text-[12.5px] text-muted">
                  Saved {new Date(r.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <ConfirmButton
                label="Restore"
                className={BTN.secondary.replace("px-3.5 py-2", "px-3 py-1.5")}
                title="Restore this version?"
                body="The article's title and body go back to this version. The current version is kept as a revision first, so you can undo this."
                confirmLabel="Restore"
                destructive={false}
                onConfirm={() => restore(r.id)}
              />
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
