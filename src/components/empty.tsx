export function Empty({ what }: { what: string }) {
  return (
    <div className="card rounded-2xl px-8 py-16 text-center">
      <p className="text-[15px] font-medium">No {what} published yet.</p>
      <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-muted">
        This page is wired to the database and renders whatever is published. Nothing is hard-coded,
        so it is empty rather than faked.
      </p>
    </div>
  );
}
