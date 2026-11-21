"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { concepts } from "@/data/backend-concepts";
import { FlowDiagram } from "./FlowDiagram";
import { toneAt } from "@/lib/tone";

/** WAI-ARIA tabs: one tab per backend concept, arrow keys move between tabs. */
export function ConceptExplorer() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const c = concepts[active];

  const onKey = (e: KeyboardEvent) => {
    const delta = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const next = (active + delta + concepts.length) % concepts.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <div
        role="tablist"
        aria-label="Backend concepts"
        aria-orientation="vertical"
        onKeyDown={onKey}
        className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
      >
        {concepts.map((k, i) => (
          <button
            key={k.id}
            ref={(el) => { tabs.current[i] = el; }}
            role="tab"
            id={`tab-${k.id}`}
            aria-selected={i === active}
            aria-controls={`panel-${k.id}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            style={toneAt(i)}
            className="shrink-0 rounded-md border-l-2 border-transparent px-3 py-2 text-left text-sm text-muted transition-colors hover:text-heading aria-selected:border-(--tone) aria-selected:bg-(--tone)/10 aria-selected:text-heading"
          >
            <span className="mr-2 font-mono text-xs text-(--tone)">{String(i + 1).padStart(2, "0")}</span>
            {k.title}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${c.id}`} aria-labelledby={`tab-${c.id}`} style={toneAt(active)} className="min-w-0">
        <h3 className="text-2xl font-semibold text-heading">{c.title}</h3>
        <p className="mt-2 text-muted">{c.summary}</p>
        <div className="mt-6">
          <FlowDiagram key={c.id} steps={c.steps} label={c.title} />
        </div>
        <p className="mt-6 border-l-2 border-(--tone) pl-4 text-sm">
          <span className="font-mono text-xs uppercase tracking-wider text-(--tone)">Takeaway </span>
          {c.takeaway}
        </p>
      </div>
    </div>
  );
}
