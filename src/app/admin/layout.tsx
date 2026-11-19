import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "./actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { AdminNav } from "./nav";
import { QuickCapture } from "./capture";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();

  const account = (
    <div className="space-y-3">
      <p className="truncate font-mono text-[11.5px] text-faint" title={user.email ?? undefined}>{user.email}</p>
      <div className="flex items-center gap-2">
        <Link href="/" target="_blank" className="flex-1 rounded-full border border-line px-3 py-1.5 text-center text-[12.5px] text-muted transition-colors hover:bg-raised hover:text-ink">
          View site ↗
        </Link>
        <ThemeToggle />
      </div>
      <form action={signOut}>
        <button className="w-full rounded-full bg-ink px-3 py-1.5 text-[12.5px] font-medium text-page transition-opacity hover:opacity-85">Sign out</button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-page print:bg-white">
      <AdminNav account={account} />
      <div className="lg:pl-64 print:pl-0">
        <div className="mx-auto max-w-6xl px-5 py-8 print:max-w-none print:p-0">
          <QuickCapture />
          {children}
        </div>
      </div>
    </div>
  );
}
