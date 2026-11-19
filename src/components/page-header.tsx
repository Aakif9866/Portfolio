export function PageHeader({ eyebrow, title, lede }: { eyebrow: string; title: string; lede?: string }) {
  return (
    <section className="relative overflow-hidden spotlight border-b border-line pb-14 pt-32">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
      <div className="relative mx-auto max-w-6xl px-6">
        <p className="animate-fade-up font-mono text-[12px] uppercase tracking-[0.18em] text-faint">{eyebrow}</p>
        <h1 className="animate-fade-up mt-3 text-[clamp(32px,5vw,52px)] font-semibold leading-[1.05] tracking-tightest">{title}</h1>
        {lede && <p className="animate-fade-up mt-5 max-w-2xl text-[17px] leading-relaxed text-muted">{lede}</p>}
      </div>
    </section>
  );
}
