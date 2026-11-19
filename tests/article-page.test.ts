/**
 * Renders the public article page with stubbed data (no database): the companion video
 * embeds, tags link to tag pages, related posts and share links appear, and the JSON-LD is
 * valid and can't break out of its <script>.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const base = { topic_id: null, topics: null, difficulty: null, reading_minutes: null, state: "published", last_reviewed_at: null, tested_with: null, position: 0, updated_at: "2026-11-19T00:00:00Z", cover_image_url: null };
const posts = [
  { ...base, id: "1", slug: "rls-video", title: "RLS in 10 minutes </script>", dek: "Watch then read.", body_md: "## One\n\ntext\n\nhttps://youtu.be/aaaaaaaaaaa", published_at: "2026-11-19T00:00:00Z", tags: ["Postgres", "Security"], video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { ...base, id: "2", slug: "pooling", title: "Connection pooling", dek: null, body_md: "x", published_at: "2026-11-01T00:00:00Z", tags: ["postgres"], video_url: null },
  { ...base, id: "3", slug: "css", title: "CSS", dek: null, body_md: "x", published_at: "2026-10-01T00:00:00Z", tags: ["css"], video_url: null },
];
vi.mock("@/lib/queries", () => ({ publishedArticles: async () => posts }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));

const { default: ArticlePage, generateMetadata } = await import("@/app/articles/[slug]/page");
const render = async (slug: string) => renderToStaticMarkup(await ArticlePage({ params: Promise.resolve({ slug }) }));

describe("article page", () => {
  it("embeds the companion video and the in-text video", async () => {
    const html = await render("rls-video");
    expect(html).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(html).toContain("youtube-nocookie.com/embed/aaaaaaaaaaa");
  });

  it("links tags, shows related posts by shared tag, and share links", async () => {
    const html = await render("rls-video");
    expect(html).toContain('href="/articles/tag/postgres"');
    expect(html).toContain('href="/articles/pooling"'); // related (shares postgres) and previous
    expect(html).not.toMatch(/Related[\s\S]*href="\/articles\/css"/);
    expect(html).toContain("linkedin.com/sharing/share-offsite/?url=https%3A%2F%2F");
  });

  it("emits valid BlogPosting JSON-LD with the video, escaped for <script>", async () => {
    const html = await render("rls-video");
    const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)![1];
    expect(json).not.toContain("</script>");
    const ld = JSON.parse(json);
    expect(ld).toMatchObject({ "@type": "BlogPosting", headline: "RLS in 10 minutes </script>", keywords: "Postgres, Security", video: { embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" } });
  });

  it("uses the video thumbnail for sharing, and the generated card without one", async () => {
    const withVideo = await generateMetadata({ params: Promise.resolve({ slug: "rls-video" }) });
    expect(JSON.stringify(withVideo.openGraph)).toContain("i.ytimg.com/vi/dQw4w9WgXcQ");
    const plain = await generateMetadata({ params: Promise.resolve({ slug: "css" }) });
    expect(JSON.stringify(plain.openGraph)).toContain("/articles/css/og");
  });

  it("404s for an unknown slug", async () => {
    await expect(render("nope")).rejects.toThrow("NOT_FOUND");
  });
});
