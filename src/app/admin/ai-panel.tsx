"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Entry } from "@/lib/entries";
import { acceptNotes, aiDraftEmail, aiImprove, aiStructureLog, aiSummarize, type AiResult } from "./ai-actions";
import { BTN } from "./ui";

type Mode = "summary" | "notes" | "email";

/**
 * AI buttons for one entry, chosen by its kind. Nothing runs until a button is pressed, and a
 * suggestion only replaces your notes if you press Replace or Add below.
 */
export function AiPanel({ entry, enabled }: { entry: Entry; enabled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<(AiResult & { mode: Mode }) | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!enabled) {
    return <p className="text-[12.5px] text-faint">AI help (summaries, log structuring, writing, emails) appears here once <code className="font-mono">AI_API_KEY</code> is set.</p>;
  }

  const go = (mode: Mode, call: () => Promise<AiResult>) => start(async () => {
    setSaved(null);
    setCopied(false);
    const res = await call();
    setResult({ ...res, mode });
    if (res.ok && mode === "summary") router.refresh();
  });

  const buttons: { label: string; mode: Mode; call: () => Promise<AiResult> }[] = [
    ...(entry.url ? [{ label: "Summarise the page", mode: "summary" as const, call: () => aiSummarize(entry.id) }] : []),
    ...(entry.kind === "log" ? [{ label: "Structure log + resume bullets", mode: "notes" as const, call: () => aiStructureLog(entry.id) }] : []),
    ...(entry.body_md.trim().length >= 20 ? [{ label: "Improve writing", mode: "notes" as const, call: () => aiImprove(entry.id) }] : []),
    ...(entry.kind === "job" ? [
      { label: "Draft follow-up email", mode: "email" as const, call: () => aiDraftEmail(entry.id, "follow_up") },
      { label: "Draft thank-you email", mode: "email" as const, call: () => aiDraftEmail(entry.id, "thank_you") },
    ] : []),
  ];
  if (buttons.length === 0) return null;

  const keep = (body: string) => start(async () => {
    const res = await acceptNotes(entry.id, body);
    setSaved(res.message);
    if (res.ok) { setResult(null); router.refresh(); }
  });

  return (
    <section aria-label="AI help" className="mt-5 space-y-3 border-t border-line pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-medium text-muted">AI</span>
        {buttons.map((b) => (
          <button key={b.label} type="button" disabled={pending} onClick={() => go(b.mode, b.call)} className={BTN.secondary}>{b.label}</button>
        ))}
      </div>
      {pending && <p className="text-[12.5px] text-muted" aria-live="polite">Thinking…</p>}
      {saved && <p className="text-[12.5px] text-muted" role="status">{saved}</p>}

      {result && !pending && (result.ok ? (
        <div className="space-y-2">
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-surface p-3 font-sans text-[13.5px] leading-relaxed text-ink">{result.text}</pre>
          <div className="flex flex-wrap items-center gap-2">
            {result.mode === "notes" && (
              <>
                <button type="button" onClick={() => keep(result.text)} className={BTN.primary}>Replace notes</button>
                <button type="button" onClick={() => keep(`${entry.body_md.trimEnd()}\n\n${result.text}`)} className={BTN.secondary}>Add below notes</button>
              </>
            )}
            {result.mode === "summary" && <span className="text-[12.5px] text-muted">Saved on the entry.</span>}
            <button type="button" className={BTN.quiet} onClick={() => navigator.clipboard.writeText(result.text).then(() => setCopied(true))}>{copied ? "Copied" : "Copy"}</button>
            {result.mode !== "summary" && <button type="button" className={BTN.quiet} onClick={() => setResult(null)}>Discard</button>}
            <span className="ml-auto text-[11.5px] text-faint">
              {result.tokens.toLocaleString("en-IN")} tokens · {result.month.toLocaleString("en-IN")} of {result.cap.toLocaleString("en-IN")} this month
            </span>
          </div>
        </div>
      ) : (
        <p role="alert" className="text-[13px] text-rose-600 dark:text-rose-400">{result.message}</p>
      ))}
    </section>
  );
}
