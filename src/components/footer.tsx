"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/labels";
import type { Contact } from "@/lib/contact";

export function Footer({ visits, contact }: { visits: number; contact: Contact }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname === "/login") return null;
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-wrap items-start justify-between gap-10">
          <div className="max-w-xs">
            <p className="text-[15px] font-semibold">Aakif</p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
              Software engineer — backend systems, AI agent infrastructure and full-stack products.
            </p>
          </div>
          <nav aria-label="Footer" className="flex gap-14 text-[13.5px]">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Explore</p>
              <ul className="mt-3 space-y-2 text-muted">
                {NAV.map((l) => (
                  <li key={l.href}><Link href={l.href} className="ul hover:text-ink">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Contact</p>
              <ul className="mt-3 space-y-2 text-muted">
                <li><a href={`mailto:${contact.email}`} className="ul hover:text-ink">Email</a></li>
                <li><a href={contact.github} target="_blank" rel="noopener" className="ul hover:text-ink">GitHub</a></li>
                {contact.linkedin && (
                  <li><a href={contact.linkedin} target="_blank" rel="noopener" className="ul hover:text-ink">LinkedIn</a></li>
                )}
                <li><Link href="/login" className="ul hover:text-ink">Admin sign in</Link></li>
              </ul>
            </div>
          </nav>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-[12.5px] text-faint">
          <p>© {new Date().getFullYear()} Aakif. Built with Next.js, Supabase and Tailwind CSS.</p>
          <p className="font-mono">{visits.toLocaleString()} page views</p>
        </div>
      </div>
    </footer>
  );
}
