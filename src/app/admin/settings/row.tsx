"use client";
import { useActionState } from "react";
import type { ActionResult } from "../actions";

type Row = { key: string; value: string | null; label: string | null; description: string | null };

export function SiteConfigRow({ row, action }: { row: Row; action: (fd: FormData) => Promise<ActionResult> }) {
  const [result, submit, pending] = useActionState(
    async (_p: ActionResult | null, fd: FormData) => action(fd),
    null,
  );

  const long = (row.value ?? "").length > 90;

  return (
    <form action={submit} className="card rounded-xl p-4">
      {/* site_config is keyed on `key`, not an id — upsert by primary key. */}
      <input type="hidden" name="__table" value="site_config" />
      <input type="hidden" name="key" value={row.key} />

      <label htmlFor={row.key} className="block text-[13px] font-medium">
        {row.label ?? row.key}
        <span className="ml-2 font-mono text-[11px] font-normal text-faint">{row.key}</span>
      </label>
      {row.description && <p className="mt-1 text-[12px] text-muted">{row.description}</p>}

      {long ? (
        <textarea id={row.key} name="value" defaultValue={row.value ?? ""} rows={6}
          className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-[12.5px] text-ink outline-none focus:border-accent" />
      ) : (
        <input id={row.key} name="value" defaultValue={row.value ?? ""}
          className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] text-ink outline-none focus:border-accent" />
      )}

      <div className="mt-3 flex items-center gap-3">
        <button disabled={pending} className="rounded-lg bg-ink px-3.5 py-1.5 text-[12.5px] font-medium text-page transition-opacity hover:opacity-85 disabled:opacity-50">
          {pending ? "Saving…" : "Save"}
        </button>
        {result && (
          <span className={`text-[12.5px] ${result.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {result.message}
          </span>
        )}
      </div>
    </form>
  );
}
