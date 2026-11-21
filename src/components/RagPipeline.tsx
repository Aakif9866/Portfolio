import { Plus } from "lucide-react";
import { ragStages } from "@/data/rag";
import { tone, type Tone } from "@/lib/tone";

// ingest → index → retrieve → generate → evaluate
const phase: Tone[] = ["blue", "blue", "amber", "amber", "violet", "violet", "green", "green", "coral"];

// Native <details> gives keyboard + screen-reader disclosure for free, no client JS.
export function RagPipeline() {
  return (
    <ol className="relative border-l border-line">
      {ragStages.map((s, i) => (
        <li key={s.title} style={tone(phase[i])} className="relative pb-3 pl-8 last:pb-0">
          <span aria-hidden className="absolute -left-[5px] top-5 size-[9px] rounded-full border-2 border-(--tone) bg-bg" />
          <details className="group rounded-lg border border-line bg-surface open:border-(--tone)/60">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 [&::-webkit-details-marker]:hidden">
              <span>
                <span className="font-mono text-xs text-(--tone)">{String(i + 1).padStart(2, "0")}</span>
                <span className="ml-3 font-medium text-heading">{s.title}</span>
                <span className="mt-1 block text-sm text-muted">{s.summary}</span>
              </span>
              <Plus aria-hidden className="size-4 shrink-0 text-muted transition-transform group-open:rotate-45" />
            </summary>
            <ul className="space-y-2 border-t border-line px-4 py-4 text-sm">
              {s.points.map((p) => (
                <li key={p} className="flex gap-3">
                  <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-(--tone)" />
                  {p}
                </li>
              ))}
            </ul>
          </details>
        </li>
      ))}
    </ol>
  );
}
