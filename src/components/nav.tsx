"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { CommandPalette } from "./command-palette";
import { NAV } from "@/lib/labels";
import type { Contact } from "@/lib/contact";

type Item = { label: string; href: string; group: string; hint?: string };

export function Nav({ searchItems, contact }: { searchItems: Item[]; contact: Contact }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on navigation and on Escape.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (pathname.startsWith("/admin") || pathname === "/login") return null;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open ? "border-b border-line glass" : "border-b border-transparent"
      }`}
    >
      <nav aria-label="Main" className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-rose-500 to-violet-600 text-[11px] font-bold text-white">A</span>
          Aakif
        </Link>

        <div className="hidden items-center gap-6 text-[13.5px] md:flex">
          {NAV.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`ul transition-colors ${active ? "text-ink" : "text-muted hover:text-ink"}`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <CommandPalette items={searchItems} />
          <ThemeToggle />
          <a
            href={contact.github}
            target="_blank"
            rel="noopener"
            className="hidden rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-page transition-opacity hover:opacity-85 sm:inline-flex"
          >
            GitHub
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition-colors hover:bg-raised hover:text-ink md:hidden"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-line px-6 pb-6 pt-2 md:hidden">
          <ul className="divide-y divide-line">
            {NAV.map((l) => {
              const active = pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-between py-3.5 text-[16px] ${active ? "font-medium text-ink" : "text-muted"}`}
                  >
                    {l.label}
                    <svg className="h-3.5 w-3.5 text-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={`mailto:${contact.email}`} className="rounded-full bg-ink px-4 py-2 text-[13.5px] font-medium text-page">Email me</a>
            <a href={contact.github} target="_blank" rel="noopener" className="rounded-full border border-line bg-card px-4 py-2 text-[13.5px] font-medium">GitHub</a>
            {contact.linkedin && (
              <a href={contact.linkedin} target="_blank" rel="noopener" className="rounded-full border border-line bg-card px-4 py-2 text-[13.5px] font-medium">LinkedIn</a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
