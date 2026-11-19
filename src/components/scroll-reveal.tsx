"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * The v1 scroll reveal, for every `.rv` element on the page: it fades and rises into place the
 * first time it scrolls into view, with siblings staggered 70ms apart (capped). One observer per
 * page instead of a component per element; works in every browser. Content is only hidden when
 * the head script has set `rv-ready` (JS on, motion allowed), so without JS it simply shows.
 */
export function ScrollReveal() {
  const pathname = usePathname();
  useEffect(() => {
    if (!document.documentElement.classList.contains("rv-ready")) return;
    const els = [...document.querySelectorAll<HTMLElement>(".rv:not(.rv-in)")];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("rv-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    for (const el of els) {
      const siblings = el.parentElement ? [...el.parentElement.children].filter((c) => c.classList.contains("rv")) : [el];
      el.style.setProperty("--rv-delay", `${Math.min(siblings.indexOf(el), 6) * 70}ms`);
      io.observe(el);
    }
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
