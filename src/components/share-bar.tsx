"use client";
import { useState } from "react";

/**
 * Share links for an article or project: plain intent URLs (no third-party scripts or trackers), the
 * native share sheet where the browser has one, and copy-link.
 */
export function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { label: "X", href: `https://x.com/intent/post?url=${u}&text=${t}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { label: "Reddit", href: `https://www.reddit.com/submit?url=${u}&title=${t}` },
    { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
  ];
  const chip = "rounded-full border border-line px-3 py-1.5 text-[14px] text-muted transition-colors hover:bg-raised hover:text-ink";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[13px] font-semibold uppercase tracking-[0.14em] text-faint">Share</span>
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className={chip}>{l.label}</a>
      ))}
      <button
        type="button"
        className={chip}
        onClick={() => navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
