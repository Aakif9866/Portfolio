import Link from "next/link";

/** An intentional empty state: what will appear here, and somewhere useful to go instead. */
export function Empty({
  title, body, action,
}: { title: string; body?: string; action?: { href: string; label: string } }) {
  return (
    <div className="card rounded-2xl px-8 py-16 text-center">
      <p className="text-[15px] font-medium">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-muted">{body}</p>}
      {action && (
        <Link href={action.href} className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 text-[13.5px] font-medium transition-colors hover:bg-raised">
          {action.label}
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </Link>
      )}
    </div>
  );
}
