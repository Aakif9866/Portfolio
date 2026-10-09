"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { CommandPalette } from "./command-palette";

const LINKS = [
  { href: "/projects", label: "Work" },
  { href: "/system", label: "Stack" },
  { href: "/lab", label: "Lab" },
  { href: "/articles", label: "Writing" },
  { href: "/experience", label: "Experience" },
];

type Item = { label: string; href: string; group: string; hint?: string };

export function Nav({ searchItems }: { searchItems: Item[] }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/admin") || pathname === "/login") return null;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-line glass" : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-rose-500 to-violet-600 text-[11px] font-bold text-white">A</span>
          Aakif
        </Link>

        <div className="hidden items-center gap-7 text-[13.5px] md:flex">
          {LINKS.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
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
            href="https://github.com/Aakif9866"
            target="_blank"
            rel="noopener"
            className="rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-page transition-opacity hover:opacity-85"
          >
            GitHub
          </a>
        </div>
      </nav>
    </header>
  );
}
