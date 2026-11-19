import { describe, expect, it } from "vitest";
import { cleanTags, relatedPosts, tagCounts, tagSlug, youtubeEmbed, youtubeId, youtubeStart } from "@/lib/blog";

describe("youtubeId", () => {
  it("reads every common URL shape", () => {
    for (const u of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s",
      "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ?si=abc",
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
      "https://www.youtube.com/live/dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    ]) expect(youtubeId(u), u).toBe("dQw4w9WgXcQ");
  });
  it("refuses lookalikes, bad ids and non-video pages", () => {
    for (const u of ["https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ", "https://www.youtube.com/watch?v=short", "https://www.youtube.com/@channel",
      "javascript:alert(1)", "not a url", "", null]) expect(youtubeId(u), String(u)).toBeNull();
  });
  it("reads start times and builds a no-cookie embed", () => {
    expect(youtubeStart("https://youtu.be/dQw4w9WgXcQ?t=90")).toBe(90);
    expect(youtubeStart("https://youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s")).toBe(90);
    expect(youtubeStart("https://youtube.com/watch?v=dQw4w9WgXcQ")).toBe(0);
    expect(youtubeEmbed("dQw4w9WgXcQ", 90)).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=90");
  });
});

describe("tags", () => {
  it("slugs tags without collisions for C++ / C#", () => {
    expect(tagSlug("System Design")).toBe("system-design");
    expect(tagSlug("C++")).toBe("cplusplus");
    expect(tagSlug("C#")).toBe("csharp");
  });
  it("cleans duplicates and blanks, keeping the first spelling", () => {
    expect(cleanTags([" Postgres ", "postgres", "", "  ", "RLS"])).toEqual(["Postgres", "RLS"]);
    expect(cleanTags(null)).toEqual([]);
  });
  it("counts tags across posts", () => {
    expect(tagCounts([{ slug: "a", tags: ["Postgres", "RLS"] }, { slug: "b", tags: ["postgres"] }]))
      .toEqual([{ name: "Postgres", slug: "postgres", count: 2 }, { name: "RLS", slug: "rls", count: 1 }]);
  });
});

describe("relatedPosts", () => {
  const all = [
    { slug: "a", tags: ["postgres", "rls"], published_at: "2026-01-01" },
    { slug: "b", tags: ["postgres", "rls"], published_at: "2026-02-01" },
    { slug: "c", tags: ["postgres"], published_at: "2026-03-01" },
    { slug: "d", tags: ["react"], published_at: "2026-04-01" },
  ];
  it("ranks by shared tags then recency, excludes itself and unrelated posts", () => {
    expect(relatedPosts(all[0], all).map((p) => p.slug)).toEqual(["b", "c"]);
  });
  it("returns nothing for an untagged post", () => expect(relatedPosts({ slug: "x", tags: [] }, all)).toEqual([]));
});
