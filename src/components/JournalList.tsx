"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import type { Post } from "@/lib/journal";
import { categoryTone, tone } from "@/lib/tone";

export function JournalList({ posts, categories }: { posts: Post[]; categories: string[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const shown = posts.filter(
    (p) =>
      (!category || p.category === category) &&
      (!q || [p.title, p.summary, p.category, ...p.tags].some((s) => s.toLowerCase().includes(q))),
  );

  const chip = "shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors";
  return (
    <div>
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles"
          aria-label="Search articles"
          className="w-full rounded-md border border-line bg-surface py-2.5 pl-9 pr-3 text-heading placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>

      <div role="group" aria-label="Filter by category" className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
        {[null, ...categories].map((c) => (
          <button
            key={c ?? "all"}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            style={c ? tone(categoryTone[c] ?? "green") : undefined}
            className={`${chip} ${category === c ? "border-(--tone) bg-(--tone)/10 text-(--tone)" : "border-line text-muted hover:border-(--tone)/50 hover:text-heading"}`}
          >
            {c ?? "All"}
          </button>
        ))}
      </div>

      <p className="mt-8 font-mono text-xs text-muted" aria-live="polite">
        {shown.length} {shown.length === 1 ? "article" : "articles"}
      </p>
      <ul className="mt-2">
        {shown.map((p) => <PostRow key={p.slug} post={p} />)}
      </ul>
      {shown.length === 0 && <p className="py-12 text-muted">No articles match that search yet.</p>}
    </div>
  );
}

export function PostRow({ post: p }: { post: Post }) {
  return (
    <li style={tone(categoryTone[p.category] ?? "green")} className="border-t border-line">
      <Link href={`/journal/${p.slug}`} className="group grid gap-2 py-6 md:grid-cols-[160px_1fr]">
        <span className="font-mono text-xs text-muted">
          {p.date} · {p.readingTime} min
        </span>
        <span>
          <span className="font-mono text-xs uppercase tracking-wider text-(--tone)">{p.category}</span>
          {p.placeholder && <span className="ml-2 font-mono text-xs text-muted">[sample placeholder]</span>}
          <span className="mt-1 block text-lg font-medium text-heading group-hover:text-(--tone)">{p.title}</span>
          <span className="mt-1 block text-sm text-muted">{p.summary}</span>
        </span>
      </Link>
    </li>
  );
}
