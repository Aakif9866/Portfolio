"use client";

import { useActionState, useState, type ReactNode } from "react";
import { deleteRow, reorder, setState, type ActionResult } from "./actions";

type Action = (fd: FormData) => Promise<ActionResult>;

/* ── field descriptors ───────────────────────────────────────────────────── */
export type Field =
  | { name: string; label: string; type: "text" | "url" | "date" | "number" }
  | { name: string; label: string; type: "textarea"; rows?: number; hint?: string }
  | { name: string; label: string; type: "markdown"; rows?: number; hint?: string }
  | { name: string; label: string; type: "json"; rows?: number; hint?: string }
  | { name: string; label: string; type: "lines"; rows?: number; hint?: string }
  | { name: string; label: string; type: "select"; options: readonly string[] }
  | { name: string; label: string; type: "checkbox" };

function encode(f: Field) {
  if (f.type === "number") return `num:${f.name}`;
  if (f.type === "checkbox") return `bool:${f.name}`;
  if (f.type === "json") return `json:${f.name}`;
  if (f.type === "lines") return `lines:${f.name}`;
  return f.name;
}

const INPUT =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] text-ink outline-none transition-colors focus:border-accent";

/* ── status banner ───────────────────────────────────────────────────────── */
function Banner({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return (
    <p
      role="status"
      className={`rounded-lg px-3.5 py-2.5 text-[13px] ${
        result.ok
          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300"
      }`}
    >
      {result.message}
    </p>
  );
}

/* ── the one editor form every screen reuses ─────────────────────────────── */
export function RowForm({
  table, fields, row, action, title, onDone,
}: {
  table: string;
  fields: Field[];
  row?: Record<string, unknown> | null;
  action: Action;
  title: string;
  onDone?: () => void;
}) {
  const [result, submit, pending] = useActionState(
    async (_prev: ActionResult | null, fd: FormData) => {
      const r = await action(fd);
      if (r.ok && onDone) onDone();
      return r;
    },
    null,
  );

  const booleans = fields.filter((f) => f.type === "checkbox").map((f) => f.name).join(",");

  return (
    <form action={submit} className="space-y-4">
      <input type="hidden" name="__table" value={table} />
      {row?.id ? <input type="hidden" name="__id" value={String(row.id)} /> : null}
      {booleans ? <input type="hidden" name="__booleans" value={booleans} /> : null}

      <p className="text-[14.5px] font-semibold">{title}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          const wide = ["textarea", "markdown", "json", "lines"].includes(f.type);
          const value = row?.[f.name];
          const asText =
            f.type === "json"
              ? value ? JSON.stringify(value, null, 2) : ""
              : f.type === "lines"
              ? Array.isArray(value) ? (value as string[]).join("\n") : ""
              : value === null || value === undefined ? "" : String(value);

          return (
            <div key={f.name} className={wide ? "sm:col-span-2" : ""}>
              <label htmlFor={f.name} className="block text-[12px] font-medium text-muted">
                {f.label}
                {"hint" in f && f.hint ? <span className="ml-2 font-normal text-faint">{f.hint}</span> : null}
              </label>

              {f.type === "select" ? (
                <select id={f.name} name={encode(f)} defaultValue={asText} className={`${INPUT} mt-1.5`}>
                  <option value="">—</option>
                  {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === "checkbox" ? (
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-[13.5px] text-ink">
                  <input type="checkbox" name={encode(f)} defaultChecked={Boolean(value)} className="h-4 w-4 accent-[var(--accent)]" />
                  Enabled
                </label>
              ) : wide ? (
                <textarea
                  id={f.name} name={encode(f)} defaultValue={asText}
                  rows={"rows" in f && f.rows ? f.rows : f.type === "markdown" ? 12 : 4}
                  spellCheck={f.type === "markdown"}
                  className={`${INPUT} mt-1.5 ${f.type === "json" || f.type === "markdown" ? "font-mono text-[12.5px]" : ""}`}
                />
              ) : (
                <input
                  id={f.name} name={encode(f)} defaultValue={asText}
                  type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "url" ? "url" : "text"}
                  step={f.type === "number" ? "1" : undefined}
                  className={`${INPUT} mt-1.5`}
                />
              )}
            </div>
          );
        })}
      </div>

      <Banner result={result} />

      <div className="flex items-center gap-2">
        <button
          type="submit" disabled={pending}
          className="rounded-lg bg-ink px-4 py-2 text-[13.5px] font-medium text-page transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {pending ? "Saving…" : row?.id ? "Save changes" : "Create"}
        </button>
      </div>
    </form>
  );
}

/* ── collapsible "new row" panel ─────────────────────────────────────────── */
export function NewRowPanel(props: { table: string; fields: Field[]; action: Action; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card rounded-2xl p-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="text-[14px] font-semibold">{props.label}</span>
        <span className="text-[18px] leading-none text-faint">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="mt-5 border-t border-line pt-5">
          <RowForm {...props} title={props.label} onDone={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

/* ── per-row controls: expand to edit, publish, reorder, delete ──────────── */
export function RowActions({
  table, row, fields, action, scope, states = ["draft", "published", "archived"], extra,
}: {
  table: string;
  row: Record<string, unknown>;
  fields: Field[];
  action: Action;
  scope?: { col: string; val: string };
  states?: readonly string[];
  extra?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<ActionResult | null>(null);

  async function run(fn: Action, fd: FormData) {
    setNote(await fn(fd));
  }

  function fd(entries: Record<string, string>) {
    const f = new FormData();
    f.set("__table", table);
    f.set("__id", String(row.id));
    Object.entries(entries).forEach(([k, v]) => f.set(k, v));
    if (scope) { f.set("__scopeCol", scope.col); f.set("__scopeVal", scope.val); }
    return f;
  }

  const current = String(row.state ?? "");

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {states.filter((s) => s !== current).map((s) => (
          <button
            key={s}
            onClick={() => run(setState, fd({ __state: s }))}
            className="rounded-md border border-line px-2 py-1 font-mono text-[10.5px] uppercase tracking-wider text-muted transition-colors hover:bg-raised hover:text-ink"
          >
            → {s}
          </button>
        ))}
        <button onClick={() => run(reorder, fd({ __dir: "up" }))} aria-label="Move up" className="rounded-md border border-line px-2 py-1 text-[11px] text-muted transition-colors hover:bg-raised hover:text-ink">↑</button>
        <button onClick={() => run(reorder, fd({ __dir: "down" }))} aria-label="Move down" className="rounded-md border border-line px-2 py-1 text-[11px] text-muted transition-colors hover:bg-raised hover:text-ink">↓</button>
        <button onClick={() => setOpen((v) => !v)} className="rounded-md border border-line px-2 py-1 text-[11.5px] text-muted transition-colors hover:bg-raised hover:text-ink">
          {open ? "Close" : "Edit"}
        </button>
        <button
          onClick={() => {
            if (!confirm(`Delete “${row.title ?? row.name ?? row.id}”? This cannot be undone.`)) return;
            run(deleteRow, fd({}));
          }}
          className="rounded-md border border-rose-500/30 px-2 py-1 text-[11.5px] text-rose-600 transition-colors hover:bg-rose-500/10 dark:text-rose-400"
        >
          Delete
        </button>
        {extra}
      </div>

      {note && <div className="mt-2"><Banner result={note} /></div>}

      {open && (
        <div className="mt-4 rounded-xl border border-line bg-surface p-5">
          <RowForm table={table} fields={fields} row={row} action={action} title="Edit" />
        </div>
      )}
    </>
  );
}

export function StateChip({ state }: { state: string }) {
  const tone: Record<string, string> = {
    published: "#34d399", draft: "#fbbf24", archived: "#8a8a93", hidden: "#8a8a93", empty: "#5f5f6d",
  };
  const c = tone[state] ?? "#8a8a93";
  return (
    <span className="rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider" style={{ color: c, background: `${c}1a` }}>
      {state}
    </span>
  );
}
