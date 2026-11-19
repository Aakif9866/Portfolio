/** The shareable project card renders a 1200×630 PNG for a published project and 404s otherwise (stubbed data). */
import { expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ supabasePublic: () => ({}) }));
vi.mock("@/components/case-study", () => ({
  loadCaseStudy: async (_sb: unknown, by: { slug: string }) => by.slug !== "pulseiq" ? null : {
    project: { slug: "pulseiq", title: "PulseIQ", thesis: "Real-time health metrics.", summary: null, status: "active", role: "Solo developer", started_on: "2025-01-01", ended_on: null, repo_url: "https://github.com/x/pulseiq", demo_url: "https://pulseiq.dev" },
    tech: Array.from({ length: 9 }, (_, i) => ({ id: `${i}`, name: `Tech ${i}`, color: i % 2 ? "#38bdf8" : null })),
  },
}));
const { GET } = await import("@/app/projects/[slug]/card/route");

it("renders a 1200×630 PNG card", async () => {
  const res = await GET(new Request("http://x/projects/pulseiq/card"), { params: Promise.resolve({ slug: "pulseiq" }) });
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toBe("image/png");
  const view = new DataView(await res.arrayBuffer());
  expect([view.getUint32(16), view.getUint32(20)]).toEqual([1200, 630]);
});

it("404s for an unpublished or unknown project", async () => {
  const res = await GET(new Request("http://x/projects/nope/card"), { params: Promise.resolve({ slug: "nope" }) });
  expect(res.status).toBe(404);
});
