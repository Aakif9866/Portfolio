import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./form";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden spotlight px-6">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[380px] w-[700px] -translate-x-1/2">
        <div className="aurora h-full w-full rounded-full bg-[conic-gradient(from_200deg,#0a84ff,#64d2ff,#30d158,#40c8e0,#0a84ff)]" />
      </div>

      <div className="relative w-full max-w-[400px]">
        <div className="glass rounded-3xl border border-line p-8 sm:p-10">
          <div className="text-center">
            <span className="brand-mark h-11! w-11! text-[15px]!">SA</span>
            <h1 className="mt-5 text-[28px] font-semibold leading-tight tracking-[-0.02em]">Sign in</h1>
            <p className="mt-1.5 text-[15px] text-muted">Admin access to the portfolio.</p>
          </div>

          {error === "not_authorised" && (
            <p role="alert" className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[14px] text-rose-600 dark:text-rose-300">
              This account isn&apos;t allowed into the admin area.
            </p>
          )}

          <LoginForm next={next ?? "/admin/site"} />
        </div>

        <Link href="/" className="mt-6 flex items-center justify-center gap-1.5 text-[14px] text-muted transition-colors hover:text-ink">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
          Back to site
        </Link>
      </div>
    </div>
  );
}
