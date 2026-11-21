export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-6xl px-4 pt-40 sm:px-6">
      <div className="h-3 w-32 animate-pulse rounded bg-surface-2" />
      <div className="mt-6 h-10 w-2/3 animate-pulse rounded bg-surface-2" />
      <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-surface-2" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
