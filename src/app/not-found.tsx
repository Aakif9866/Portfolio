import Link from "next/link";
import { btn } from "@/components/LinkButtons";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-start px-4 pb-28 pt-40 sm:px-6">
      <p className="font-mono text-sm text-accent">HTTP 404</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-heading md:text-6xl">Route not found</h1>
      <p className="mt-4 max-w-xl text-muted">The request reached the server, but no handler matched this path.</p>
      <pre className="mt-8 overflow-x-auto rounded-md border border-line bg-surface p-4 font-mono text-xs text-muted">
        {`router.match(path) → null\nresponse.status(404)`}
      </pre>
      <Link href="/" className={`${btn.primary} mt-8`}>Back to home</Link>
    </div>
  );
}
