"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { deleteRow, reorder, setState, type ActionResult } from "./actions";
import type { Field, Option } from "@/lib/admin-fields";
import { stateActions } from "@/lib/form";
import { PUBLISH_STATE, statusLabel } from "@/lib/labels";

type Action = (fd: FormData) => Promise<ActionResult>;

export const INPUT =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-[14px] text-ink outline-none transition-colors placeholder:text-faint focus:border-accent aria-[invalid=true]:border-rose-500";

export const BTN = {
  primary: "inline-flex items-center justify-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13.5px] font-medium text-page transition-opacity hover:opacity-85 disabled:opacity-50",
  secondary: "inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-card px-3.5 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-raised disabled:opacity-50",
  quiet: "inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-muted transition-colors hover:bg-raised hover:text-ink disabled:opacity-50",
  danger: "inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 px-3 py-1.5 text-[13px] text-rose-600 transition-colors hover:bg-rose-500/10 dark:text-rose-400 disabled:opacity-50",
};

function encode(f: Field) {
  if (f.type === "number") return `num:${f.name}`;
  if (f.type === "checkbox") return `bool:${f.name}`;
  if (f.type === "json") return `json:${f.name}`;
  if (f.type === "lines") return `lines:${f.name}`;
  return f.name;
}

/* ── page header ─────────────────────────────────────────────────────────── */
export function AdminHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* ── status banner ───────────────────────────────────────────────────────── */
export function Banner({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return (
    <p
      role={result.ok ? "status" : "alert"}
      className={`rounded-lg px-3.5 py-2.5 text-[13.5px] ${
        result.ok
          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
      }`}
    >
      {result.message}
    </p>
  );
}

export function StateChip({ state }: { state: string }) {
  const s = PUBLISH_STATE[state];
  const c = s?.tone ?? "#8a8a93";
  return (
    <span title={s?.help} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium" style={{ color: c, background: `${c}1a` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      {statusLabel(PUBLISH_STATE, state)}
    </span>
  );
}

/* ── one input ───────────────────────────────────────────────────────────── */
function FieldInput({ f, value, projects }: { f: Field; value: unknown; projects?: Option[] }) {
  const id = useId();
  const helpId = `${id}-help`;
  const asText =
    f.type === "json" ? (value ? JSON.stringify(value, null, 2) : "")
    : f.type === "lines" ? (Array.isArray(value) ? (value as string[]).join("\n") : "")
    : value === null || value === undefined ? "" : String(value);
  const common = { id, name: encode(f), "aria-describedby": f.help ? helpId : undefined };
  const options = f.type === "project" ? projects ?? [] : f.options ?? [];

  if (f.type === "checkbox") {
    return (
      <div>
        <label className="flex cursor-pointer items-start gap-2.5 text-[14px] text-ink">
          <input type="checkbox" {...common} defaultChecked={Boolean(value)} className="mt-0.5 h-4 w-4 accent-[var(--accent)]" />
          <span>
            {f.label}
            {f.help && <span id={helpId} className="mt-0.5 block text-[12.5px] text-muted">{f.help}</span>}
          </span>
        </label>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-medium text-ink">
        {f.label}
        {f.required && <span className="ml-0.5 text-rose-500" aria-hidden>*</span>}
      </label>
      {f.type === "select" || f.type === "project" ? (
        <select {...common} defaultValue={asText} required={f.required} className={`${INPUT} mt-1.5`}>
          <option value="">{f.required ? "Choose…" : "—"}</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : ["textarea", "markdown", "json", "lines"].includes(f.type) ? (
        <textarea
          {...common}
          defaultValue={asText}
          required={f.required}
          placeholder={f.placeholder}
          rows={f.rows ?? (f.type === "markdown" ? 12 : 4)}
          spellCheck={f.type === "markdown" || f.type === "textarea"}
          className={`${INPUT} mt-1.5 ${f.type === "json" || f.type === "markdown" ? "font-mono text-[13px]" : ""}`}
        />
      ) : (
        <input
          {...common}
          defaultValue={asText}
          required={f.required}
          placeholder={f.placeholder}
          type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "url" ? "url" : "text"}
          step={f.type === "number" ? "1" : undefined}
          pattern={f.type === "slug" ? "[a-z0-9]+(-[a-z0-9]+)*" : undefined}
          title={f.type === "slug" ? "Lowercase letters, numbers and single hyphens" : undefined}
          className={`${INPUT} mt-1.5 ${f.type === "slug" ? "font-mono text-[13px]" : ""}`}
        />
      )}
      {f.help && <p id={helpId} className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{f.help}</p>}
    </div>
  );
}

const WIDE = ["textarea", "markdown", "json", "lines"];

/* ── the one editor form every screen reuses ─────────────────────────────── */
export function RowForm({
  table, fields, row, action, title, fixed, projects, onDone, submitLabel,
}: {
  table: string;
  fields: Field[];
  row?: Record<string, unknown> | null;
  action: Action;
  title?: string;
  /** Values set by context (e.g. the project being edited) — sent hidden, not shown. */
  fixed?: Record<string, string>;
  projects?: Option[];
  onDone?: (r: ActionResult) => void;
  submitLabel?: string;
}) {
  const [dirty, setDirty] = useState(false);
  const [result, submit, pending] = useActionState(async (_prev: ActionResult | null, fd: FormData) => {
    const r = await action(fd);
    if (r.ok) {
      setDirty(false);
      onDone?.(r);
    }
    return r;
  }, null);

  // Warn before leaving the page with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const shown = fields.filter((f) => !(fixed && f.name in fixed));
  const essential = shown.filter((f) => !f.advanced);
  const advanced = shown.filter((f) => f.advanced);
  const booleans = fields.filter((f) => f.type === "checkbox").map((f) => f.name).join(",");

  const grid = (list: Field[]) => (
    <div className="grid gap-5 sm:grid-cols-2">
      {list.map((f) => (
        <div key={f.name} className={WIDE.includes(f.type) || f.type === "checkbox" ? "sm:col-span-2" : ""}>
          <FieldInput f={f} value={row?.[f.name]} projects={projects} />
        </div>
      ))}
    </div>
  );

  return (
    <form action={submit} onInput={() => { setDirty(true); }} className="space-y-5">
      <input type="hidden" name="__table" value={table} />
      {row?.id ? <input type="hidden" name="__id" value={String(row.id)} /> : null}
      {booleans ? <input type="hidden" name="__booleans" value={booleans} /> : null}
      {fixed && Object.entries(fixed).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}

      {title && <p className="text-[15px] font-semibold">{title}</p>}
      {grid(essential)}

      {advanced.length > 0 && (
        <details className="rounded-xl border border-line bg-surface px-4 py-3">
          <summary className="cursor-pointer text-[13px] font-medium text-muted">Advanced settings</summary>
          <div className="mt-4">{grid(advanced)}</div>
        </details>
      )}

      {/* a success message goes stale once you edit again; an error stays until fixed */}
      <Banner result={result && (!result.ok || !dirty) ? result : null} />

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={BTN.primary}>
          {pending ? "Saving…" : submitLabel ?? (row?.id ? "Save changes" : "Create")}
        </button>
        {dirty && !pending && <span className="text-[12.5px] text-amber-600 dark:text-amber-400">Unsaved changes</span>}
      </div>
    </form>
  );
}

/* ── collapsible "add new" panel ─────────────────────────────────────────── */
export function NewRowPanel({
  label, defaultOpen = false, openHref, ...form
}: Omit<Parameters<typeof RowForm>[0], "title" | "onDone"> & {
  label: string;
  defaultOpen?: boolean;
  /** After creating, go to `${openHref}/${id}` (e.g. the project workspace). */
  openHref?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const router = useRouter();
  return (
    <div className="card rounded-2xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2 text-[14px] font-semibold">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-ink text-[13px] leading-none text-page">{open ? "−" : "+"}</span>
          {label}
        </span>
      </button>
      {open && (
        <div className="border-t border-line px-5 py-5">
          <RowForm
            {...form}
            submitLabel="Create"
            onDone={(r) => {
              if (r.ok && openHref && r.id) router.push(`${openHref}/${r.id}`);
              else setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ── confirm dialog (native <dialog>: focus trap, Esc, inert background) ── */
export function ConfirmButton({
  label, title, body, confirmLabel, onConfirm, className = BTN.danger, destructive = true,
}: { label: string; title: string; body: string; confirmLabel: string; onConfirm: () => void; className?: string; destructive?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className={className}>{label}</button>
      <dialog
        ref={ref}
        className="m-auto w-[min(92vw,420px)] rounded-2xl border border-line-strong bg-card p-0 text-ink shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
        onClick={(e) => e.target === ref.current && ref.current?.close()}
      >
        <div className="p-6">
          <h2 className="text-[16px] font-semibold">{title}</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">{body}</p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" autoFocus onClick={() => ref.current?.close()} className={BTN.secondary}>Cancel</button>
            <button
              type="button"
              onClick={() => { ref.current?.close(); onConfirm(); }}
              className={destructive ? "inline-flex items-center rounded-lg bg-rose-600 px-4 py-2 text-[13.5px] font-medium text-white transition-opacity hover:opacity-90" : BTN.primary}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

/* ── per-row controls: contextual publish actions, edit, reorder, delete ─── */
export function RowActions({
  table, row, fields, action, scope, fixed, projects, extra, editLabel = "Edit", reorderable = true,
}: {
  table: string;
  row: Record<string, unknown>;
  fields: Field[];
  action: Action;
  scope?: { col: string; val: string };
  fixed?: Record<string, string>;
  projects?: Option[];
  extra?: ReactNode;
  editLabel?: string;
  reorderable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<ActionResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function run(key: string, fn: Action, entries: Record<string, string>) {
    setBusy(key);
    const f = new FormData();
    f.set("__table", table);
    f.set("__id", String(row.id));
    Object.entries(entries).forEach(([k, v]) => f.set(k, v));
    if (scope) { f.set("__scopeCol", scope.col); f.set("__scopeVal", scope.val); }
    setNote(await fn(f));
    setBusy(null);
  }

  const name = String(row.title ?? row.name ?? row.heading ?? "this item");
  const transitions = row.state ? stateActions(table, String(row.state)) : [];

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {transitions.map((t) => (
          <button
            key={t.to}
            type="button"
            disabled={busy !== null}
            onClick={() => run(t.to, setState, { __state: t.to })}
            className={t.tone === "primary" ? BTN.primary.replace("px-4 py-2", "px-3 py-1.5") : BTN.secondary.replace("px-3.5 py-2", "px-3 py-1.5")}
          >
            {busy === t.to ? "Working…" : t.label}
          </button>
        ))}
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={BTN.secondary.replace("px-3.5 py-2", "px-3 py-1.5")}>
          {open ? "Close editor" : editLabel}
        </button>
        {extra}
        <span className="ml-auto flex items-center gap-1">
          {reorderable && (
            <>
              <button type="button" disabled={busy !== null} onClick={() => run("up", reorder, { __dir: "up" })} aria-label={`Move ${name} up`} className={BTN.quiet}>↑</button>
              <button type="button" disabled={busy !== null} onClick={() => run("down", reorder, { __dir: "down" })} aria-label={`Move ${name} down`} className={BTN.quiet}>↓</button>
            </>
          )}
          <ConfirmButton
            label="Delete"
            title={`Delete “${name}”?`}
            body="This permanently removes it from the database. It cannot be undone. To hide it instead, use Unpublish or Archive."
            confirmLabel="Delete permanently"
            onConfirm={() => run("delete", deleteRow, {})}
          />
        </span>
      </div>

      {note && <div className="mt-3"><Banner result={note} /></div>}

      {open && (
        <div className="mt-4 rounded-xl border border-line bg-surface p-5">
          <RowForm table={table} fields={fields} row={row} action={action} fixed={fixed} projects={projects} />
        </div>
      )}
    </>
  );
}

/* ── publish controls on their own (project workspace → Publishing) ──────── */
export function StateButtons({ table, id, state, onDeleted }: { table: string; id: string; state: string; onDeleted?: string }) {
  const [note, setNote] = useState<ActionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function run(fn: Action, entries: Record<string, string>) {
    setBusy(true);
    const f = new FormData();
    f.set("__table", table);
    f.set("__id", id);
    Object.entries(entries).forEach(([k, v]) => f.set(k, v));
    const r = await fn(f);
    setBusy(false);
    if (r.ok && fn === deleteRow && onDeleted) router.push(onDeleted);
    else setNote(r);
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {stateActions(table, state).map((t) => (
          <button key={t.to} type="button" disabled={busy} onClick={() => run(setState, { __state: t.to })} className={t.tone === "primary" ? BTN.primary : BTN.secondary}>
            {t.label}
          </button>
        ))}
      </div>
      <Banner result={note} />
      {onDeleted && (
        <div className="rounded-xl border border-rose-500/25 p-4">
          <p className="text-[13.5px] font-medium">Delete permanently</p>
          <p className="mt-1 text-[13px] text-muted">Removes it from the database for good. Prefer Archive if you might want it back.</p>
          <div className="mt-3">
            <ConfirmButton
              label="Delete…"
              title="Delete permanently?"
              body="This removes it from the database and cannot be undone. Archive keeps it out of public view without losing anything."
              confirmLabel="Delete permanently"
              onConfirm={() => run(deleteRow, {})}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── list filter: search + status, as a plain GET form (works without JS) ── */
export function ListFilter({ q, status, statuses }: { q?: string; status?: string; statuses: string[] }) {
  return (
    <form className="flex flex-wrap items-center gap-2" role="search">
      <label className="sr-only" htmlFor="admin-q">Search</label>
      <input id="admin-q" name="q" defaultValue={q} placeholder="Search by title…" className={`${INPUT} w-56`} />
      <label className="sr-only" htmlFor="admin-status">Status</label>
      <select id="admin-status" name="status" defaultValue={status ?? ""} className={`${INPUT} w-40`}>
        <option value="">All statuses</option>
        {statuses.map((s) => <option key={s} value={s}>{statusLabel(PUBLISH_STATE, s)}</option>)}
      </select>
      <button className={BTN.secondary}>Filter</button>
      {(q || status) && <Link href="?" className={BTN.quiet}>Clear</Link>}
    </form>
  );
}
