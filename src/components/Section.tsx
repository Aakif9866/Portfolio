import type { ReactNode } from "react";
import { tone as toneVar, type Tone } from "@/lib/tone";

type Props = { id: string; index: string; label: string; title: string; intro?: string; tone?: Tone; children: ReactNode };

export function Section({ id, index, label, title, intro, tone = "green", children }: Props) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} style={toneVar(tone)} className="border-t border-line py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-muted">
          <span aria-hidden className="h-px w-6 bg-(--tone)" />
          <span><span className="text-(--tone)">{index}</span> / {label}</span>
        </p>
        <h2 id={`${id}-title`} className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-heading md:text-4xl">
          {title}
        </h2>
        {intro && <p className="mt-4 max-w-2xl text-muted">{intro}</p>}
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

export function PageHeader({ label, title, intro, tone = "green" }: { label: string; title: string; intro: string; tone?: Tone }) {
  return (
    <header style={toneVar(tone)} className="mx-auto max-w-6xl px-4 pb-12 pt-32 sm:px-6 md:pt-40">
      <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-(--tone)"><span aria-hidden className="h-px w-6 bg-(--tone)" />{label}</p>
      <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-heading md:text-6xl">{title}</h1>
      <p className="mt-6 max-w-2xl text-lg text-muted">{intro}</p>
    </header>
  );
}
