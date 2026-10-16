"use client";
import Link from "next/link";

/**
 * Shown when a page's data can't be loaded (e.g. the database is unreachable
 * after retries). Deliberately generic: no query, URL or database detail.
 */
export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section role="alert" className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden spotlight px-6 text-center">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <p className="relative font-mono text-[12px] uppercase tracking-[0.2em] text-faint">Temporarily unavailable</p>
      <h1 className="relative mt-4 text-[clamp(30px,5vw,44px)] font-semibold tracking-tightest">This page couldn&apos;t load</h1>
      <p className="relative mt-4 max-w-md text-[15px] leading-relaxed text-muted">
        The content is stored in a database that didn&apos;t respond in time. Trying again usually works.
      </p>
      <div className="relative mt-8 flex gap-3">
        <button onClick={reset} className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-page transition-opacity hover:opacity-85">Try again</button>
        <Link href="/" className="rounded-full border border-line bg-card px-5 py-2.5 text-[14px] font-medium transition-colors hover:bg-raised">Back home</Link>
      </div>
    </section>
  );
}
