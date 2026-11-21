"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, useScroll } from "motion/react";
import { ThemeToggle } from "./ThemeToggle";
import { profile } from "@/data/profile";

const links = [
  { href: "/#about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/backend", label: "Backend" },
  { href: "/ai", label: "AI & RAG" },
  { href: "/journal", label: "Journal" },
  { href: "/#contact", label: "Contact" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { scrollYProgress } = useScroll();
  const isActive = (href: string) => !href.startsWith("/#") && pathname.startsWith(href);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/85 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-mono text-sm text-heading" onClick={() => setOpen(false)}>
          <span className="text-accent">~/</span>
          {profile.name.toLowerCase().replace(/\s+/g, "-")}
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className="rounded-md px-3 py-2 text-sm text-muted transition-colors hover:text-heading aria-[current=page]:text-accent"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="grid size-9 place-items-center rounded-md border border-line text-muted md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </nav>

      {open && (
        <ul id="mobile-menu" className="border-t border-line bg-bg px-4 py-3 md:hidden">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-3 text-base text-text hover:text-accent"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Scroll progress */}
      <motion.div
        aria-hidden
        className="absolute bottom-[-1px] left-0 h-px w-full origin-left bg-accent"
        style={{ scaleX: scrollYProgress }}
      />
    </header>
  );
}
