"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { MAX_RESUME, parseResume, placeholders, type StoredResume } from "@/lib/resume";
import { createMaster, createVersion, deleteResume, saveResume } from "../resume-actions";
import { aiTailorResume } from "../ai-actions";
import { BTN, Banner, ConfirmButton, INPUT } from "../ui";
import type { ActionResult } from "../actions";
import { ResumeView } from "./view";

type Job = { id: string; title: string };

export function StartMaster() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  return (
    <div className="space-y-2">
      <button type="button" disabled={pending} className="btn-grad rounded-lg px-4 py-2 text-[14px] font-medium disabled:opacity-60" onClick={() => start(async () => {
        const res = await createMaster();
        setResult(res);
        if (res.ok) router.push("/admin/resume/master");
      })}>
        {pending ? "Drafting…" : "Draft my master profile from the portfolio"}
      </button>
      <Banner result={result && !result.ok ? result : null} />
    </div>
  );
}

export function NewVersion({ jobs }: { jobs: Job[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  return (
    <form className="flex flex-wrap items-end gap-2" action={(fd) => start(async () => {
      const res = await createVersion(fd);
      setResult(res);
      if (res.ok && res.id) router.push(`/admin/resume/${res.id}`);
    })}>
      <label className="block min-w-[14rem] flex-1">
        <span className="block text-[13px] font-medium">For a job (optional)</span>
        <select name="job_id" defaultValue="" className={`${INPUT} mt-1.5`}>
          <option value="">No specific job</option>
          {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
      </label>
      <button type="submit" disabled={pending} className={BTN.primary}>{pending ? "Creating…" : "New version from master"}</button>
      <div className="w-full"><Banner result={result && !result.ok ? result : null} /></div>
    </form>
  );
}

export function ResumeEditor({ param, resume, jobs, aiEnabled, logBullets }: {
  param: string; resume: StoredResume; jobs: Job[]; aiEnabled: boolean; logBullets: string[];
}) {
  const router = useRouter();
  const isMaster = param === "master";
  const [text, setText] = useState(resume.text);
  const [title, setTitle] = useState(resume.title);
  const [jobId, setJobId] = useState(resume.job_id ?? "");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [tailored, setTailored] = useState<{ text: string; missing: string[]; usage: string } | null>(null);
  const [pending, start] = useTransition();
  const doc = useMemo(() => parseResume(text), [text]);
  const todo = useMemo(() => placeholders(text), [text]);
  const dirty = text !== resume.text || title !== resume.title || jobId !== (resume.job_id ?? "");

  const save = (nextText = text) => start(async () => {
    const fd = new FormData();
    fd.set("param", param);
    fd.set("title", title);
    fd.set("text", nextText);
    fd.set("job_id", jobId);
    const res = await saveResume(fd);
    setResult(res);
    if (res.ok) router.refresh();
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block min-w-[14rem] flex-1">
          <span className="block text-[13px] font-medium">Name of this version</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} disabled={isMaster} className={`${INPUT} mt-1.5`} />
        </label>
        {!isMaster && (
          <label className="block min-w-[14rem] flex-1">
            <span className="block text-[13px] font-medium">Job</span>
            <select value={jobId} onChange={(e) => setJobId(e.target.value)} className={`${INPUT} mt-1.5`}>
              <option value="">No specific job</option>
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </label>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={pending || !dirty} onClick={() => save()} className={BTN.primary}>{pending ? "Saving…" : dirty ? "Save" : "Saved"}</button>
          <Link href={`/admin/resume/${param}/print`} target="_blank" className={BTN.secondary} title={dirty ? "Save first: the PDF uses the saved version" : undefined}>PDF</Link>
          <a href={`/admin/resume/${param}/tex`} className={BTN.secondary}>.tex</a>
        </div>
      </div>
      <Banner result={result} />

      {todo.length > 0 && (
        <p className="rounded-lg border border-line bg-surface px-3.5 py-2.5 text-[13px] text-muted">
          <strong className="text-ink">{todo.length} to fill in:</strong> {todo.join(" · ")}
        </p>
      )}

      {!isMaster && aiEnabled && (
        <div className="space-y-2">
          <button type="button" disabled={pending || !jobId} className={BTN.secondary} title={jobId ? undefined : "Link a job with a pasted job description first"} onClick={() => start(async () => {
            if (dirty) { setResult({ ok: false, message: "Save your changes before tailoring." }); return; }
            const res = await aiTailorResume(param);
            if (res.ok) setTailored({ text: res.text, missing: res.missing ?? [], usage: `${res.tokens.toLocaleString("en-IN")} tokens · ${res.month.toLocaleString("en-IN")} of ${res.cap.toLocaleString("en-IN")} this month` });
            else setResult(res);
          })}>
            Tailor to the job with AI
          </button>
          {tailored && (
            <div className="space-y-2 rounded-xl border border-line p-3">
              <p className="text-[13px] font-medium">Suggested version. Check every line: it should only reorder and reword what&apos;s true.</p>
              {tailored.missing.length > 0 && <p className="text-[13px] text-muted"><strong className="text-ink">The job asks for, and this resume doesn&apos;t show:</strong> {tailored.missing.join(", ")}</p>}
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className={BTN.primary} onClick={() => { setText(tailored.text); setTailored(null); }}>Use it (then Save)</button>
                <button type="button" className={BTN.quiet} onClick={() => setTailored(null)}>Discard</button>
                <span className="ml-auto text-[11.5px] text-faint">{tailored.usage}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <label className="block">
          <span className="sr-only">Resume text</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={MAX_RESUME} spellCheck rows={34} className={`${INPUT} font-mono text-[12.5px] leading-relaxed`} />
          <span className="mt-1 block text-[12px] text-muted">
            <code className="font-mono"># Name</code> · contact line with <code className="font-mono">|</code> · <code className="font-mono">## Section</code> · <code className="font-mono">### Org | Role | Place | Dates</code> · <code className="font-mono">- bullet</code> · <code className="font-mono">**bold**</code>
          </span>
        </label>
        <div className="overflow-auto rounded-xl border border-line bg-white" aria-label="Preview">
          <ResumeView doc={doc} />
        </div>
      </div>

      {logBullets.length > 0 && (
        <details className="rounded-xl border border-line p-3">
          <summary className="cursor-pointer text-[13.5px] font-medium">Resume bullets from your logs · {logBullets.length}</summary>
          <ul className="mt-2 space-y-1.5">
            {logBullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px]">
                <button type="button" className={BTN.quiet} onClick={() => navigator.clipboard.writeText(`- ${b}`)}>Copy</button>
                <span className="pt-1.5">{b}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {!isMaster && (
        <ConfirmButton label="Delete this version" title="Delete this resume version?" body="The master profile and other versions aren't affected." confirmLabel="Delete version"
          onConfirm={() => start(async () => {
            const fd = new FormData();
            fd.set("param", param);
            const res = await deleteResume(fd);
            if (res.ok) router.push("/admin/resume"); else setResult(res);
          })} />
      )}
    </div>
  );
}

export function PrintButton() {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 print:hidden">
      <button type="button" onClick={() => window.print()} className={BTN.primary}>Print / Save as PDF</button>
      <span className="text-[12.5px] text-muted">In the print dialog choose “Save as PDF”, paper size A4 (or Letter), margins None, and turn off headers and footers.</span>
    </div>
  );
}
