import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "./actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { AdminNav } from "./nav";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();

  return (
    <div className="min-h-screen bg-page">
      <header className="sticky top-0 z-40 border-b border-line glass">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2 text-[14.5px] font-semibold tracking-tight">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-rose-500 to-violet-600 text-[11px] font-bold text-white">A</span>
              Admin
            </Link>
            <span className="hidden font-mono text-[11.5px] text-faint sm:inline">{user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" target="_blank" className="rounded-full border border-line px-3.5 py-1.5 text-[12.5px] text-muted transition-colors hover:bg-raised hover:text-ink">
              View site
            </Link>
            <ThemeToggle />
            <form action={signOut}>
              <button className="rounded-full bg-ink px-3.5 py-1.5 text-[12.5px] font-medium text-page transition-opacity hover:opacity-85">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-5 py-8">
        <AdminNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
