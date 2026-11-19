import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "./actions";
import { AdminNav } from "./nav";
import { QuickCapture } from "./capture";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();

  const email = user.email ?? "";
  const account = (
    <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
      <span aria-hidden className="brand-mark h-8! w-8! shrink-0 rounded-full! text-[13px]!">{email.charAt(0).toUpperCase() || "A"}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-medium leading-tight">Admin</span>
        <span className="block truncate text-[12px] text-faint" title={email}>{email}</span>
      </span>
      <form action={signOut}>
        <button aria-label="Sign out" title="Sign out" className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-raised hover:text-ink">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3" /></svg>
        </button>
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
