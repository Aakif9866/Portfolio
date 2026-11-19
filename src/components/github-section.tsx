import type { GitHubSummary } from "@/lib/github";
import { fullDate } from "@/lib/dates";

/**
 * Live public GitHub data (src/lib/github.ts): profile counts and the most recently pushed
 * repositories. Rendered on the home page and About; callers leave it out entirely when GitHub
 * can't be reached, so a rate limit or outage never shows an empty or broken block.
 */
export function GitHubRepos({ gh, columns = 2 }: { gh: GitHubSummary; columns?: 2 | 3 }) {
  return (
    <>
      <a href={gh.url} target="_blank" rel="noopener" className="font-mono text-[14px] text-muted transition-colors hover:text-ink">
        @{gh.login} · {gh.publicRepos} public repos · {gh.followers} followers <span aria-hidden>↗</span>
      </a>
      {gh.repos.length > 0 && (
        <ul className={`mt-6 grid gap-4 sm:grid-cols-2 ${columns === 3 ? "lg:grid-cols-3" : ""}`}>
          {gh.repos.map((r) => (
            <li key={r.name} className="rv">
              <a href={r.url} target="_blank" rel="noopener" className="card card-hover ring-grad flex h-full flex-col rounded-2xl p-5">
                <span className="truncate font-mono text-[15px] font-medium">{r.name}</span>
                {r.description && <span className="mt-2 line-clamp-2 text-[14.5px] leading-relaxed text-muted">{r.description}</span>}
                <span className="mt-auto flex flex-wrap gap-x-3 pt-4 font-mono text-[12.5px] text-faint">
                  {r.language && <span>{r.language}</span>}
                  {r.stars > 0 && <span>★ {r.stars}</span>}
                  <span>Updated {fullDate(r.pushedAt)}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
