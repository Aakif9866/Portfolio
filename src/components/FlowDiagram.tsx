"use client";

import { useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Step } from "@/data/projects";

/** Step-through flow: click a node, use the buttons, or ←/→ while focused. */
export function FlowDiagram({ steps, label }: { steps: Step[]; label: string }) {
  const [active, setActive] = useState(0);
  const go = (i: number) => setActive(Math.max(0, Math.min(steps.length - 1, i)));
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(active + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(active - 1); }
  };

  return (
    <div role="group" aria-label={label} onKeyDown={onKey} className="rounded-lg border border-line bg-surface p-4 sm:p-6">
      <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2 sm:contents">
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-current={i === active ? "step" : undefined}
              className={`w-full rounded-md border px-3 py-2 text-left font-mono text-xs transition-colors sm:w-auto ${
                i === active
                  ? "border-(--tone) bg-(--tone)/10 text-(--tone)"
                  : i < active
                    ? "border-(--tone)/40 text-heading"
                    : "border-line text-muted hover:text-heading"
              }`}
            >
              <span className="mr-2 opacity-60">{String(i + 1).padStart(2, "0")}</span>
              {s.label}
            </button>
            {i < steps.length - 1 && (
              <span aria-hidden className={`hidden h-px w-4 sm:block ${i < active ? "bg-(--tone)" : "bg-line"}`} />
            )}
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-start sm:justify-between">
        <p aria-live="polite" className="max-w-2xl text-sm leading-relaxed">
          <span className="font-mono text-(--tone)">{steps[active].label}: </span>
          {steps[active].detail}
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => go(active - 1)}
            disabled={active === 0}
            aria-label="Previous step"
            className="grid size-9 place-items-center rounded-md border border-line text-muted hover:text-heading disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => go(active + 1)}
            disabled={active === steps.length - 1}
            aria-label="Next step"
            className="grid size-9 place-items-center rounded-md border border-line text-muted hover:text-heading disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
