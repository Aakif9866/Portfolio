"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/lib/journal";

/** Headings come from the server; the client only tracks which one is in view. */
export function Toc({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState<string>();

  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [headings]);

  if (!headings.length) return null;
  return (
    <nav aria-label="Table of contents" className="text-sm">
      <p className="font-mono text-xs uppercase tracking-wider text-muted">On this page</p>
      <ul className="mt-3 space-y-2 border-l border-line">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              aria-current={active === h.id ? "location" : undefined}
              className={`-ml-px block border-l py-0.5 transition-colors ${h.level === 3 ? "pl-6" : "pl-3"} ${
                active === h.id ? "border-accent text-accent" : "border-transparent text-muted hover:text-heading"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
