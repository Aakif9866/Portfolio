/** Shown the instant an admin link is clicked, while the page's data loads. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse space-y-6">
      <div className="h-8 w-56 rounded-lg bg-raised" />
      <div className="h-4 w-80 max-w-full rounded bg-raised" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-28 rounded-2xl border border-line bg-card" />)}
      </div>
    </div>
  );
}
