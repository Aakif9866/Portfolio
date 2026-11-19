import { describe, expect, it } from "vitest";
import { githubLogin, pickRepos } from "@/lib/github";

describe("githubLogin", () => {
  it("reads the login from a profile URL", () => {
    expect(githubLogin("https://github.com/Aakif9866")).toBe("Aakif9866");
    expect(githubLogin("https://www.github.com/Aakif9866/")).toBe("Aakif9866");
  });
  it("refuses anything that isn't a profile URL", () => {
    for (const u of ["https://github.com/", "https://github.com/a/repo", "https://gitlab.com/a", "not a url", "https://github.com/a..b"]) {
      expect(githubLogin(u), u).toBeNull();
    }
  });
});

describe("pickRepos", () => {
  const repo = (name: string, pushed_at: string, extra = {}) =>
    ({ name, pushed_at, description: "", language: null, stargazers_count: 0, html_url: `https://github.com/x/${name}`, fork: false, archived: false, ...extra });

  it("keeps own active repos, newest push first, capped", () => {
    const out = pickRepos([
      repo("old", "2025-01-01T00:00:00Z"),
      repo("forked", "2026-11-01T00:00:00Z", { fork: true }),
      repo("archived", "2026-11-02T00:00:00Z", { archived: true }),
      repo("new", "2026-10-01T00:00:00Z", { stargazers_count: 3, language: "TypeScript" }),
    ], 6);
    expect(out.map((r) => r.name)).toEqual(["new", "old"]);
    expect(out[0]).toMatchObject({ stars: 3, language: "TypeScript", description: null });
  });
  it("returns [] for a non-array (an API error body)", () => expect(pickRepos({ message: "rate limited" })).toEqual([]));
});
