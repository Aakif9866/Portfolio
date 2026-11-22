import type { ReactNode } from "react";

/** `visual`: an optional picture for the empty space right of the title (wide screens only). */
export function PageHeader({ eyebrow, title, lede, visual }: { eyebrow: string; title: string; lede?: string; visual?: ReactNode }) {
  return (
    <section className="relative overflow-hidden spotlight border-b border-line pb-14 pt-32">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
      <div className="relative mx-auto max-w-6xl px-6">
        <p className="font-mono text-[13px] uppercase tracking-[0.18em] text-faint">{eyebrow}</p>
        <h1 className="mt-3 text-[clamp(34px,5.4vw,58px)] font-semibold leading-[1.05] tracking-tightest">{title}</h1>
        {lede && <p className="mt-5 max-w-2xl text-[18px] leading-relaxed text-muted">{lede}</p>}
      </div>
      {/* below the 64px nav, centred vertically, right-aligned to the content column */}
      {visual && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-16 hidden xl:block">
          <div className="mx-auto flex h-full max-w-6xl items-center justify-end px-6">{visual}</div>
        </div>
      )}
    </section>
  );
}
