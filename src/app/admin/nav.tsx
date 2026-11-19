"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Admin sections, in sidebar order. Edit here to add, rename or drop a page from the menu. */
export const ADMIN_GROUPS: { label: string; links: { href: string; label: string }[] }[] = [
  { label: "Overview", links: [{ href: "/admin/site", label: "Dashboard" }, { href: "/admin", label: "Inbox" }, { href: "/admin/recap", label: "Weekly recap" }] },
  { label: "Portfolio", links: [{ href: "/admin/projects", label: "Projects" }, { href: "/admin/articles", label: "Articles" }, { href: "/admin/lab", label: "Experiments" }, { href: "/admin/experience", label: "Experience" }] },
  { label: "Project builder", links: [{ href: "/admin/sections", label: "Case-study sections" }, { href: "/admin/diagrams", label: "Architecture diagrams" }, { href: "/admin/milestones", label: "Milestones" }, { href: "/admin/technologies", label: "Technologies" }] },
  { label: "Workspace", links: [{ href: "/admin/resources", label: "Resources" }, { href: "/admin/logs", label: "Logs" }, { href: "/admin/ideas", label: "Ideas" }] },
  { label: "Career", links: [{ href: "/admin/jobs", label: "Jobs" }, { href: "/admin/career", label: "Career" }, { href: "/admin/skills", label: "Skills" }, { href: "/admin/resume", label: "Resume" }] },
  { label: "Settings", links: [{ href: "/admin/media", label: "Media" }, { href: "/admin/settings", label: "Site content & access" }] },
];

const isActive = (pathname: string, href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

/**
 * A separate, full-height sidebar on desktop; a slide-in drawer from the top bar on phones and
 * tablets. `account` (email, view site, theme, sign out) is rendered by the server layout.
 */
export function AdminNav({ account }: { account: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  const current = ADMIN_GROUPS.flatMap((g) => g.links).find((l) => isActive(pathname, l.href));

  const brand = (
    <Link href="/admin/site" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
      <span className="brand-mark">SA</span>
      Admin
    </Link>
  );

  return (
    <>
      {/* phones / tablets: top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line glass px-4 lg:hidden print:hidden">
        {brand}
        <span className="truncate px-3 text-[13.5px] text-muted">{current?.label}</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="admin-sidebar"
          aria-label="Open admin menu"
          className="grid h-10 w-10 place-items-center rounded-full border border-line text-muted hover:bg-raised hover:text-ink"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
      </div>

      {open && <button type="button" aria-label="Close admin menu" onClick={() => setOpen(false)} className="fixed inset-0 z-50 bg-black/50 lg:hidden" />}

      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-surface transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none print:hidden lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
          {brand}
          <button type="button" onClick={() => setOpen(false)} aria-label="Close admin menu" className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-raised hover:text-ink lg:hidden">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <nav aria-label="Admin" className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {ADMIN_GROUPS.map((g) => (
            <div key={g.label}>
              <p className="px-3 font-mono text-[11px] uppercase tracking-wider text-faint">{g.label}</p>
              <ul className="mt-1.5 space-y-0.5">
                {g.links.map((l) => {
                  const active = isActive(pathname, l.href);
                  return (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        aria-current={active ? "page" : undefined}
                        className={`block rounded-lg px-3 py-2 text-[14px] transition-colors ${active ? "nav-rail bg-raised font-medium text-ink" : "text-muted hover:bg-raised/60 hover:text-ink"}`}
                      >
                        {l.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-line p-4">{account}</div>
      </aside>
    </>
  );
}
