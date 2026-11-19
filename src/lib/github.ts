/**
 * Read-only GitHub data for the home and About pages: public profile counts and recently
 * pushed repositories. Works without a token (60 requests/hour per IP; responses are cached
 * for an hour). Build machines share IPs, so an optional read-only GITHUB_TOKEN (server-only,
 * never NEXT_PUBLIC_) raises that to 5,000/hour and keeps the section from dropping out.
 *
 * Non-essential, like the visit count: any failure (rate limit, timeout, renamed account)
 * returns null and the section is left out. It never fails the page, and it is not a
 * database query, so it doesn't go through fetchOrThrow.
 */

export type GitHubRepo = {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  url: string;
  pushedAt: string;
};

export type GitHubSummary = { login: string; url: string; publicRepos: number; followers: number; repos: GitHubRepo[] };

/** "https://github.com/Aakif9866/" → "Aakif9866"; null for anything that isn't a GitHub profile URL. */
export function githubLogin(profileUrl: string): string | null {
  try {
    const u = new URL(profileUrl);
    if (u.hostname !== "github.com" && u.hostname !== "www.github.com") return null;
    const [login, ...rest] = u.pathname.split("/").filter(Boolean);
    return login && rest.length === 0 && /^[A-Za-z0-9-]{1,39}$/.test(login) ? login : null;
  } catch {
    return null;
  }
}

/** Own (non-fork, non-archived) repos, most recently pushed first. */
export function pickRepos(raw: unknown, limit = 6): GitHubRepo[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r) => r && !r.fork && !r.archived && typeof r.name === "string")
    .sort((a, b) => String(b.pushed_at).localeCompare(String(a.pushed_at)))
    .slice(0, limit)
    .map((r) => ({
      name: r.name,
      description: r.description || null,
      language: r.language || null,
      stars: Number(r.stargazers_count) || 0,
      url: r.html_url,
      pushedAt: r.pushed_at,
    }));
}

async function get(path: string): Promise<unknown> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28", "user-agent": "portfolio-site",
      ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
    signal: AbortSignal.timeout(5000),
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  return res.json();
}

export async function getGitHub(profileUrl: string): Promise<GitHubSummary | null> {
  const login = githubLogin(profileUrl);
  if (!login) return null;
  try {
    const [user, repos] = (await Promise.all([
      get(`/users/${login}`),
      get(`/users/${login}/repos?sort=pushed&per_page=30&type=owner`),
    ])) as [Record<string, unknown>, unknown];
    return {
      login,
      url: `https://github.com/${login}`,
      publicRepos: Number(user.public_repos) || 0,
      followers: Number(user.followers) || 0,
      repos: pickRepos(repos),
    };
  } catch {
    return null;
  }
}
