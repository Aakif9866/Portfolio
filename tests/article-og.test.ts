/** The generated share card renders a PNG for a published post and 404s otherwise (stubbed data). */
import { expect, it, vi } from "vitest";

vi.mock("@/lib/queries", () => ({
  publishedArticles: async () => [{ slug: "rls", title: "Row-level security, explained", dek: "Why the database decides.", tags: ["Postgres"], video_url: "https://youtu.be/dQw4w9WgXcQ" }],
}));
const { GET } = await import("@/app/articles/[slug]/og/route");

it("renders a 1200×630 PNG card", async () => {
  const res = await GET(new Request("http://x/articles/rls/og"), { params: Promise.resolve({ slug: "rls" }) });
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toBe("image/png");
  const png = new Uint8Array(await res.arrayBuffer());
  expect([...png.slice(1, 4)].map((c) => String.fromCharCode(c)).join("")).toBe("PNG");
  const view = new DataView(png.buffer);
  expect([view.getUint32(16), view.getUint32(20)]).toEqual([1200, 630]);
});

it("404s for an unknown post", async () => {
  const res = await GET(new Request("http://x/articles/nope/og"), { params: Promise.resolve({ slug: "nope" }) });
  expect(res.status).toBe(404);
});
