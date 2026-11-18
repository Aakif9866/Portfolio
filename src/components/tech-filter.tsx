"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Empty } from "./empty";

/**
 * Technology filter for /projects. The page is static (ISR) and renders every card with a
 * data-tags="|a|b|" attribute; this reads ?tech= in the browser and hides the cards that
 * don't match with one CSS rule. Links stay shareable, and the page needs no server render.
 */
type Props = { tags: string[]; counts: Record<string, number>; total: number };

export function TechFilter(props: Props) {
  return (
    <Suspense fallback={<Filter {...props} tech={null} />}>
      <WithParams {...props} />
    </Suspense>
  );
}

function WithParams(props: Props) {
  return <Filter {...props} tech={useSearchParams().get("tech")} />;
}

const cssString = (s: string) => s.replace(/["\\]/g, "\\$&");

function Filter({ tags, counts, total, tech }: Props & { tech: string | null }) {
  const known = tech !== null && tags.includes(tech);
  const shown = tech === null ? total : known ? counts[tech] : 0;
  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-[12.5px] transition-colors ${
      active ? "border-ink bg-ink text-page" : "border-line text-muted hover:border-line-strong hover:text-ink"
    }`;

  return (
    <>
      {tech !== null && (
        <style>{known ? `[data-tags]:not([data-tags*="|${cssString(tech)}|"]){display:none}` : "[data-tags]{display:none}"}</style>
      )}
      {tags.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-faint">Filter by technology</h2>
            <p className="text-[13px] text-muted" aria-live="polite">
              Showing {shown} of {total} projects{tech ? <> using <span className="font-medium text-ink">{tech}</span></> : null}
              {tech && <> · <Link href="/projects" className="text-accent underline underline-offset-2">Clear filter</Link></>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/projects" aria-current={!tech ? "page" : undefined} className={chip(!tech)}>All</Link>
            {tags.map((t) => (
              <Link key={t} href={`/projects?tech=${encodeURIComponent(t)}`} aria-current={t === tech ? "page" : undefined} className={`${chip(t === tech)} font-mono`}>
                {t}
              </Link>
            ))}
          </div>
        </div>
      )}
      {tech !== null && !known && <Empty title={`No projects use ${tech}.`} action={{ href: "/projects", label: "Show all projects" }} />}
    </>
  );
}
