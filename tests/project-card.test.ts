/** The shareable project card: a 1200×600 PNG for a published project, 404 otherwise, and what it says. */
import { afterEach, expect, it, vi } from "vitest";
import { stackChips } from "@/lib/project-card";

vi.mock("@/lib/supabase/server", () => ({ supabasePublic: () => ({}) }));
vi.mock("@/components/case-study", () => ({
  loadCaseStudy: async (_sb: unknown, by: { slug: string }) => !["pulseiq", "nocard"].includes(by.slug) ? null : {
    project: { slug: by.slug, title: "PulseIQ", thesis: "Real-time health metrics.", summary: null, status: "active", hero_image_url: null, repo_url: "https://github.com/x/pulseiq", demo_url: "https://pulseiq.dev",
      card_enabled: by.slug === "pulseiq", card_used_for: "Clinics watching vitals live.", card_features: ["Row-level security", "Live charts"] },
    tech: [{ id: "1", name: "React", category: "frontend" }, { id: "2", name: "FastAPI", category: "backend" }],
    sections: [{ kind: "overview", body_md: "- **Row-level security** on every table\n- Charts: live" }],
  },
}));
const { GET } = await import("@/app/projects/[slug]/card/route");
afterEach(() => vi.unstubAllGlobals());

it("renders a 1200×600 PNG, saying there is no landing page when no image loads", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
  const res = await GET(new Request("http://x/projects/pulseiq/card"), { params: Promise.resolve({ slug: "pulseiq" }) });
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toBe("image/png");
  const view = new DataView(await res.arrayBuffer());
  expect([view.getUint32(16), view.getUint32(20)]).toEqual([1200, 600]);
});

it("404s for an unpublished or unknown project, and when the card is switched off", async () => {
  for (const slug of ["nope", "nocard"]) {
    const res = await GET(new Request(`http://x/projects/${slug}/card`), { params: Promise.resolve({ slug }) });
    expect(res.status, slug).toBe(404);
  }
});

it("colours each stack chip by its technology's category", () => {
  expect(stackChips([{ name: "React", category: "frontend" }, { name: "Odd", category: "other" }])).toEqual([
    { label: "React", color: "#38bdf8" }, { label: "Odd", color: "#a1a1aa" },
  ]);
});
