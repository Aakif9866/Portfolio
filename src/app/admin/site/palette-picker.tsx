"use client";
import { useState, useTransition } from "react";
import { PALETTES, type PaletteId } from "@/lib/palettes";
import { setPalette } from "../actions";

/** Colour-scheme picker on the dashboard. Applies to this page at once, then saves for the whole site. */
export function PalettePicker({ current }: { current: PaletteId }) {
  const [selected, setSelected] = useState<PaletteId>(current);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  function choose(id: PaletteId) {
    if (id === selected || pending) return;
    const previous = selected;
    setSelected(id);
    document.documentElement.dataset.palette = id; // preview instantly
    start(async () => {
      const res = await setPalette(id);
      if (!res.ok) { setSelected(previous); document.documentElement.dataset.palette = previous; }
      setMsg({ ok: res.ok, text: res.ok ? "Saved. The public site uses it from now on." : res.message });
    });
  }

  return (
    <section aria-labelledby="palette-heading" className="card rounded-2xl p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="palette-heading" className="text-[16px] font-semibold">Colour scheme</h2>
        <p role="status" className={`text-[13px] ${msg && !msg.ok ? "text-rose-500" : "text-muted"}`}>
          {pending ? "Saving…" : msg?.text ?? "Changes the highlight, glow, logo and accent across the site."}
        </p>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {PALETTES.map((p) => {
          const on = p.id === selected;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => choose(p.id)}
                aria-pressed={on}
                className={`flex w-full items-center gap-4 rounded-xl border p-3.5 text-left transition-colors ${on ? "border-accent bg-raised" : "border-line hover:bg-raised/60"}`}
              >
                <span aria-hidden className="h-12 w-12 shrink-0 rounded-[10px_14px_10px_14px]" style={{ background: `conic-gradient(from 210deg, ${p.swatch.join(", ")}, ${p.swatch[0]})` }} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[14.5px] font-semibold">{p.name}</span>
                    {on && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-[var(--on-accent)]">Active</span>}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{p.note}</span>
                  <span aria-hidden className="mt-2 flex gap-1">
                    {p.swatch.map((c) => <span key={c} className="h-1.5 flex-1 rounded-full" style={{ background: c }} />)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
