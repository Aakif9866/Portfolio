import { experience } from "@/data/experience";
import { toneAt } from "@/lib/tone";

export function Timeline() {
  return (
    <ol className="space-y-10">
      {experience.map((r, i) => (
        <li key={i} style={toneAt(i + 1)} className="grid gap-4 border-t-2 border-t-(--tone)/50 pt-6 md:grid-cols-[200px_1fr]">
          <p className="font-mono text-xs text-muted">
            {r.start} — {r.end}
          </p>
          <div>
            <h3 className="font-semibold text-heading">
              {r.position} <span className="text-muted">· {r.company}</span>
              {r.placeholder && (
                <span className="ml-3 rounded border border-line px-1.5 py-0.5 align-middle font-mono text-[10px] uppercase tracking-wider text-muted">
                  placeholder
                </span>
              )}
            </h3>
            <ul className="mt-3 space-y-1.5 text-sm">
              {[...r.responsibilities, ...r.achievements].map((t) => (
                <li key={t} className="flex gap-3">
                  <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-(--tone)" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-4 font-mono text-xs text-muted">{r.technologies.join(" · ")}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
