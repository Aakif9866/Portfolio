"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { JOB_FIELDS, type Entry, type StatusChange } from "@/lib/entries";
import { ENTRY_KIND, ENTRY_STATUS } from "@/lib/labels";
import { deleteEntry, saveEntry, togglePin } from "./workspace-actions";
import { BTN, Banner, ConfirmButton, INPUT } from "./ui";
import type { ActionResult } from "./actions";

/** Edit one entry. Every field is optional except a title or a link. */
export function EntryEditor({ entry, closeHref }: { entry: Entry; closeHref: string }) {
  const router = useRouter();
  const [kind, setKind] = useState(entry.kind);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  const statuses = ENTRY_STATUS[kind];
  const image = typeof entry.meta?.image === "string" ? entry.meta.image : null;
  const description = typeof entry.meta?.description === "string" ? entry.meta.description : null;

  return (
    <form
      className="space-y-4"
      action={(fd) => start(async () => {
        const res = await saveEntry(fd);
        setResult(res);
        if (res.ok) router.refresh();
      })}
    >
      <input type="hidden" name="id" value={entry.id} />
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold">Edit entry</h2>
        <Link href={closeHref} scroll={false} className={BTN.quiet}>Close</Link>
      </div>

      {(image || description) && (
        <div className="flex gap-3 rounded-xl border border-line bg-surface p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote link preview image */}
          {image && <img src={image} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" referrerPolicy="no-referrer" />}
          {description && <p className="line-clamp-3 text-[13px] leading-relaxed text-muted">{description}</p>}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kind">
          <select name="kind" value={kind} onChange={(e) => setKind(e.target.value)} className={INPUT}>
            {Object.entries(ENTRY_KIND).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>
        <Field label="Status">
          {/* Keyed by kind so switching kind resets to a status that exists for it. */}
          <select key={kind} name="status" defaultValue={kind === entry.kind ? entry.status ?? "" : ""} disabled={!statuses} className={INPUT}>
            <option value="">{statuses ? "—" : "Not used for this kind"}</option>
            {statuses && Object.entries(statuses).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Title">
        <input name="title" defaultValue={entry.title} maxLength={300} className={INPUT} />
      </Field>
      <Field label="Link">
        <input name="url" type="url" defaultValue={entry.url ?? ""} placeholder="https://…" className={INPUT} />
      </Field>
      {kind === "job" && <JobFields meta={entry.meta} history={entry.meta?.history} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tags" help="Separated by spaces or commas.">
          <input name="tags" defaultValue={entry.tags.join(" ")} className={`${INPUT} font-mono text-[13px]`} />
        </Field>
        <Field label={kind === "job" ? "Follow up on" : "Due date"} help="Optional.">
          <input name="due_on" type="date" defaultValue={entry.due_on ?? ""} className={INPUT} />
        </Field>
      </div>
      <Field label="Notes" help={kind === "job" ? "Interview notes, recruiter conversations, anything. Markdown." : "Markdown."}>
        <textarea name="body_md" defaultValue={entry.body_md} rows={10} spellCheck className={`${INPUT} font-mono text-[13px]`} />
      </Field>
      <label className="flex items-center gap-2 text-[14px]">
        <input type="checkbox" name="pinned" defaultChecked={entry.pinned} className="h-4 w-4 accent-[var(--accent)]" />
        Pin to the top
      </label>

      <Banner result={result} />
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <button type="submit" disabled={pending} className={BTN.primary}>{pending ? "Saving…" : "Save"}</button>
        <ConfirmButton
          label="Delete"
          title="Delete this entry?"
          body="It's removed from your workspace. Exports you've already downloaded keep a copy."
          confirmLabel="Delete entry"
          onConfirm={() => start(async () => {
            const fd = new FormData();
            fd.set("id", entry.id);
            const res = await deleteEntry(fd);
            if (res.ok) router.push(closeHref, { scroll: false });
            else setResult(res);
          })}
        />
      </div>
      <p className="text-[12px] text-faint">
        Created {new Date(entry.created_at).toLocaleString("en-GB")} · updated {new Date(entry.updated_at).toLocaleString("en-GB")}
      </p>
    </form>
  );
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-medium text-ink">{label}</span>
      <span className="mt-1.5 block">{children}</span>
      {help && <span className="mt-1 block text-[12px] text-muted">{help}</span>}
    </label>
  );
}

/** Star toggle on each inbox row. */
export function PinButton({ id, pinned }: { id: string; pinned: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={pinned}
      aria-label={pinned ? "Unpin" : "Pin to the top"}
      title={pinned ? "Unpin" : "Pin to the top"}
      onClick={() => start(async () => {
        const fd = new FormData();
        fd.set("id", id);
        fd.set("pinned", String(!pinned));
        await togglePin(fd);
        router.refresh();
      })}
      className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md transition-colors hover:bg-raised ${pinned ? "text-accent" : "text-faint"}`}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill={pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
      </svg>
    </button>
  );
}

/** Company, role and the rest for a job. All optional; stored in the entry's meta. */
function JobFields({ meta, history }: { meta: Record<string, unknown>; history: unknown }) {
  const val = (k: string) => (typeof meta?.[k] === "string" ? (meta[k] as string) : "");
  const short = JOB_FIELDS.filter((f) => f.key !== "jd");
  const changes = Array.isArray(history) ? (history as StatusChange[]) : [];
  return (
    <fieldset className="space-y-4 rounded-xl border border-line p-3">
      <legend className="px-1 text-[12.5px] font-medium text-muted">Job details</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {short.map((f) => (
          <Field key={f.key} label={f.label}>
            <input name={`job.${f.key}`} type={f.key === "applied_on" ? "date" : "text"} defaultValue={val(f.key)} maxLength={f.max} className={INPUT} />
          </Field>
        ))}
      </div>
      <Field label="Job description" help="Paste it here so it's still around when the posting disappears.">
        <textarea name="job.jd" defaultValue={val("jd")} rows={6} maxLength={20000} className={`${INPUT} text-[13px]`} />
      </Field>
      {changes.length > 0 && (
        <div>
          <p className="text-[12.5px] font-medium text-muted">History</p>
          <ol className="mt-1 space-y-0.5 text-[12.5px] text-faint">
            {changes.map((c, i) => (
              <li key={i}>{new Date(c.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })} · {c.status ? ENTRY_STATUS.job[c.status]?.label ?? c.status : "No status"}</li>
            ))}
          </ol>
        </div>
      )}
    </fieldset>
  );
}
