import Link from "next/link";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden spotlight px-6 text-center">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <p className="relative font-mono text-[12px] uppercase tracking-[0.2em] text-faint">404</p>
      <h1 className="relative mt-4 text-[clamp(30px,5vw,44px)] font-semibold tracking-tightest">
        Nothing <span className="grad-text">published</span> here
      </h1>
      <p className="relative mt-4 max-w-md text-[15px] leading-relaxed text-muted">
        Either this page never existed, or it&apos;s a draft. Drafts are invisible to anonymous
        visitors — that&apos;s row-level security doing its job, not a broken link.
      </p>
      <Link href="/" className="relative mt-8 rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-page transition-opacity hover:opacity-85">
        Back home
      </Link>
    </section>
  );
}
