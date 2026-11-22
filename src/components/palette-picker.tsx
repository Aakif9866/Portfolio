"use client";
import { useEffect, useRef, useState } from "react";
import { PALETTES, type PaletteId } from "@/lib/palettes";

/**
 * Colour-scheme menu in the nav. The choice is the visitor's own: it is kept in localStorage and
 * applied before paint by the script in layout.tsx; without one, the site's saved scheme is used.
 */
export function PalettePicker() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<PaletteId | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrent((document.documentElement.dataset.palette as PaletteId) ?? null);
  }, []);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  function choose(id: PaletteId) {
    document.documentElement.dataset.palette = id;
    try { localStorage.setItem("palette", id); } catch {}
    setCurrent(id);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Colour scheme"
        className="grid h-10 w-10 place-items-center rounded-full border border-line text-muted transition-colors hover:bg-raised hover:text-ink"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.8-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3Z" />
          <circle cx="7.5" cy="11.5" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="10.5" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="7.8" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      </button>
      {open && (
        <ul className="materialize absolute right-0 z-50 mt-2 w-60 rounded-xl border border-line bg-card p-1.5 shadow-2xl">
          {PALETTES.map((p) => {
            const on = p.id === current;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => choose(p.id)}
                  aria-pressed={on}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[14px] transition-colors hover:bg-raised ${on ? "bg-raised text-ink" : "text-muted"}`}
                >
                  <span aria-hidden className="h-5 w-5 shrink-0 rounded-full" style={{ background: `conic-gradient(from 210deg, ${p.swatch.join(", ")}, ${p.swatch[0]})` }} />
                  <span className="flex-1">{p.name}</span>
                  {on && <span aria-hidden className="text-accent">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
