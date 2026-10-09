"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Item = { label: string; href: string; group: string; hint?: string };

export function CommandPalette({ items }: { items: Item[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = needle
      ? items.filter((i) => (i.label + i.group + (i.hint ?? "")).toLowerCase().includes(needle))
      : items;
    return list.slice(0, 9);
  }, [q, items]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
      if (e.key === "Enter" && results[cursor]) {
        e.preventDefault();
        setOpen(false);
        router.push(results[cursor].href);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, cursor, router]);

  useEffect(() => { setCursor(0); }, [q]);
  useEffect(() => { if (!open) setQ(""); }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] text-faint transition-colors hover:text-muted lg:flex"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        Search
        <kbd className="ml-1 rounded border border-line bg-raised px-1.5 py-px font-mono text-[10.5px]">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[14vh]" role="dialog" aria-modal="true" aria-label="Search the site">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm animate-fade-up" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-line-strong glass ring-grad animate-fade-up">
            <div className="flex items-center gap-3 border-b border-line px-4">
              <svg className="h-4 w-4 shrink-0 text-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Jump to a project, article or page…"
                className="w-full bg-transparent py-3.5 text-[15px] text-ink outline-none placeholder:text-faint"
              />
              <kbd className="shrink-0 rounded border border-line bg-raised px-1.5 py-px font-mono text-[10.5px] text-faint">esc</kbd>
            </div>
            <ul className="max-h-[52vh] overflow-y-auto p-2">
              {results.length === 0 && <li className="px-3 py-6 text-center text-[13.5px] text-faint">Nothing matches “{q}”.</li>}
              {results.map((r, i) => (
                <li key={r.href + r.label}>
                  <button
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => { setOpen(false); router.push(r.href); }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${i === cursor ? "bg-raised" : ""}`}
                  >
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint w-16 shrink-0">{r.group}</span>
                    <span className="flex-1 truncate text-[14px] text-ink">{r.label}</span>
                    {r.hint && <span className="shrink-0 text-[12px] text-faint">{r.hint}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
