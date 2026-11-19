/** The shareable project card: a 1200×600 PNG for a published project, 404 otherwise, and what it says. */
import { afterEach, expect, it, vi } from "vitest";
import { focusAreas, keyFeatures } from "@/lib/project-card";

vi.mock("@/lib/supabase/server", () => ({ supabasePublic: () => ({}) }));
vi.mock("@/components/case-study", () => ({
  loadCaseStudy: async (_sb: unknown, by: { slug: string }) => by.slug !== "pulseiq" ? null : {
    project: { slug: "pulseiq", title: "PulseIQ", thesis: "Real-time health metrics.", summary: null, status: "active", hero_image_url: null, repo_url: "https://github.com/x/pulseiq", demo_url: "https://pulseiq.dev" },
    tech: [{ id: "1", name: "React", category: "frontend" }, { id: "2", name: "FastAPI", category: "backend" }],
    sections: [{ kind: "overview", body_md: "- **Row-level security** on every table\n- Charts: live" }],
  },
}));
const { GET } = await import("@/app/projects/[slug]/card/route");
afterEach(() => vi.unstubAllGlobals());

it("renders a 1200×600 PNG, falling back to a drawn home page when the screenshot fails", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
  const res = await GET(new Request("http://x/projects/pulseiq/card"), { params: Promise.resolve({ slug: "pulseiq" }) });
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toBe("image/png");
  const view = new DataView(await res.arrayBuffer());
  expect([view.getUint32(16), view.getUint32(20)]).toEqual([1200, 600]);
});

it("404s for an unpublished or unknown project", async () => {
  const res = await GET(new Request("http://x/projects/nope/card"), { params: Promise.resolve({ slug: "nope" }) });
  expect(res.status).toBe(404);
});

it("derives focus areas from the stack, adding Security when the write-up covers it", () => {
  const tech = [{ category: "backend" }, { category: "ai" }, { category: "frontend" }, { category: "language" }];
  expect(focusAreas(tech, "plain").map((f) => f.label)).toEqual(["Frontend", "Backend", "AI / ML"]);
  expect(focusAreas(tech, "uses RLS policies").map((f) => f.label)).toEqual(["Frontend", "Backend", "Security", "AI / ML"]);
});

it("takes key features from bullet points, best sections first, as short plain text", () => {
  expect(keyFeatures([
    { kind: "lessons", body_md: "- Lesson one is long enough" },
    { kind: "results", body_md: "- **p95 under 200 ms** — measured\n- [Live sync](https://x) across tabs\n- short" },
  ])).toEqual(["p95 under 200 ms", "Live sync across tabs", "Lesson one is long enough"]);
});
