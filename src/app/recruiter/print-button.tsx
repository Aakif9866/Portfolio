"use client";

/** Prints the recruiter page; the browser's "Save as PDF" turns it into a one-page resume. */
export function PrintButton({ className }: { className?: string }) {
  return <button type="button" onClick={() => window.print()} className={className}>Download PDF</button>;
}
