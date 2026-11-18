import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./form";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">

      <div className="relative w-full max-w-sm">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-[14px] text-muted transition-colors hover:text-ink">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
          Back to site
        </Link>

        <div className="card rounded-2xl p-7">
          <span className="brand-mark">SA</span>
          <h1 className="mt-5 text-[22px] font-semibold tracking-tight">Admin sign in</h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
            Single-account area. Authorisation is enforced by an allowlist table in Postgres, so a
            valid session alone is not enough.
          </p>

          {error === "not_authorised" && (
            <p className="mt-5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-[13px] text-rose-600 dark:text-rose-300">
              That account is authenticated but not on the admin allowlist.
            </p>
          )}

          <LoginForm next={next ?? "/admin"} />
        </div>

        <p className="mt-5 text-center text-[12px] text-faint">
          There is no public registration. By design.
        </p>
      </div>
    </div>
  );
}
