"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ENTRY_STATUS } from "@/lib/labels";
import { setEntryStatus, startProject } from "./workspace-actions";
import { BTN } from "./ui";

/** A row of status buttons for one entry: one click to change, click the current one to clear it. */
export function StatusPicker({ id, kind, status, only }: { id: string; kind: string; status: string | null; only?: string[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const options = Object.entries(ENTRY_STATUS[kind] ?? {}).filter(([k]) => !only || only.includes(k));

  const set = (next: string | null) => start(async () => {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("status", next ?? "");
    const res = await setEntryStatus(fd);
    if (res.ok) { setError(null); router.refresh(); } else setError(res.message);
  });

  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Status">
      {options.map(([k, v]) => (
        <button
          key={k}
          type="button"
          disabled={pending}
          aria-pressed={status === k}
          onClick={() => set(status === k ? null : k)}
          className={`rounded-full border px-2.5 py-0.5 text-[12px] transition-colors disabled:opacity-60 ${
            status === k ? "border-ink bg-ink text-page" : "border-line text-muted hover:border-line-strong hover:text-ink"
          }`}
        >
          {v.label}
        </button>
      ))}
      {error && <span role="alert" className="text-[12px] text-rose-600 dark:text-rose-400">{error}</span>}
    </div>
  );
}

/** Idea → draft project, then open its workspace. */
export function StartProjectButton({ id, projectId }: { id: string; projectId?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (projectId) {
    return <a href={`/admin/projects/${projectId}`} className={BTN.quiet}>Open project</a>;
  }
  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        disabled={pending}
        className={BTN.quiet}
        title="Creates a draft project. Nothing is public until you publish it."
        onClick={() => start(async () => {
          const fd = new FormData();
          fd.set("id", id);
          const res = await startProject(fd);
          if (res.ok && res.id) router.push(`/admin/projects/${res.id}`);
          else setError(res.message);
        })}
      >
        {pending ? "Creating…" : "Start project"}
      </button>
      {error && <span role="alert" className="text-[12px] text-rose-600 dark:text-rose-400">{error}</span>}
    </span>
  );
}
