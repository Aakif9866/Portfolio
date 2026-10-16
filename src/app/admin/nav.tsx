"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const GROUPS: { label: string; links: { href: string; label: string }[] }[] = [
  { label: "Overview", links: [{ href: "/admin", label: "Dashboard" }] },
  {
    label: "Content",
    links: [
      { href: "/admin/projects", label: "Projects" },
      { href: "/admin/articles", label: "Articles" },
      { href: "/admin/lab", label: "Experiments" },
      { href: "/admin/experience", label: "Experience" },
    ],
  },
  {
    label: "Project builder",
    links: [
      { href: "/admin/sections", label: "Case-study sections" },
      { href: "/admin/diagrams", label: "Architecture diagrams" },
      { href: "/admin/milestones", label: "Milestones" },
      { href: "/admin/technologies", label: "Technologies" },
    ],
  },
  { label: "Settings", links: [{ href: "/admin/settings", label: "Site content & access" }] },
];

const isActive = (pathname: string, href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

export function AdminNav() {
  const pathname = usePathname();
  return (
    <>
      {/* desktop: grouped sidebar */}
      <nav aria-label="Admin" className="hidden w-52 shrink-0 lg:block">
        <div className="sticky top-24 space-y-6">
          {GROUPS.map((g) => (
            <div key={g.label}>
              <p className="px-3 font-mono text-[11px] uppercase tracking-wider text-faint">{g.label}</p>
              <ul className="mt-2 space-y-0.5">
                {g.links.map((l) => {
                  const active = isActive(pathname, l.href);
                  return (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        aria-current={active ? "page" : undefined}
                        className={`block rounded-lg px-3 py-2 text-[13.5px] transition-colors ${
                          active ? "bg-raised font-medium text-ink" : "text-muted hover:bg-raised/60 hover:text-ink"
                        }`}
                      >
                        {l.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* mobile / tablet: one scrollable row */}
      <nav aria-label="Admin" className="-mx-5 mb-6 overflow-x-auto border-b border-line px-5 pb-3 lg:hidden">
        <ul className="flex w-max gap-1.5">
          {GROUPS.flatMap((g) => g.links).map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`block whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] ${
                    active ? "border-ink bg-ink text-page" : "border-line text-muted"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
