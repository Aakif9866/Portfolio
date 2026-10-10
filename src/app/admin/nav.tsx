"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const GROUPS: { label: string; links: { href: string; label: string }[] }[] = [
  { label: "Overview", links: [{ href: "/admin", label: "Dashboard" }] },
  {
    label: "Content",
    links: [
      { href: "/admin/projects", label: "Projects" },
      { href: "/admin/sections", label: "Case study sections" },
      { href: "/admin/diagrams", label: "Architecture diagrams" },
      { href: "/admin/milestones", label: "Milestones" },
      { href: "/admin/technologies", label: "Technologies" },
      { href: "/admin/articles", label: "Articles" },
      { href: "/admin/lab", label: "Experiments" },
      { href: "/admin/experience", label: "Experience" },
    ],
  },
  { label: "Site", links: [{ href: "/admin/settings", label: "Site config" }] },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden w-52 shrink-0 lg:block">
      <div className="sticky top-24 space-y-6">
        {GROUPS.map((g) => (
          <div key={g.label}>
            <p className="px-3 font-mono text-[10.5px] uppercase tracking-wider text-faint">{g.label}</p>
            <ul className="mt-2 space-y-0.5">
              {g.links.map((l) => {
                const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
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
  );
}
