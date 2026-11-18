export function PageHeader({ eyebrow, title, lede }: { eyebrow: string; title: string; lede?: string }) {
  return (
    <section className="relative overflow-hidden border-b border-line pb-10 pt-28">
      <div className="relative mx-auto max-w-6xl px-6">
        <p className="animate-fade-up font-mono text-[12px] uppercase tracking-[0.18em] text-faint">{eyebrow}</p>
        <h1 className="animate-fade-up mt-3 text-[clamp(32px,5vw,52px)] font-semibold leading-[1.05] tracking-tightest">{title}</h1>
        {lede && <p className="animate-fade-up mt-5 max-w-2xl text-[17px] leading-relaxed text-muted">{lede}</p>}
      </div>
    </section>
  );
}
