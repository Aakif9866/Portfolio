/**
 * What an anonymous visitor can and can't reach. Admin journeys need a test account
 * and aren't covered here.
 */
import { expect, test, type Page } from "@playwright/test";
import { NAV } from "../../src/lib/labels";

const PUBLIC = ["/", ...NAV.map((i) => i.href), "/recruiter"];

async function expectRendered(page: Page, path: string) {
  const res = await page.goto(path);
  expect(res?.status(), path).toBe(200);
  await expect(page.locator("h1").first(), path).toBeVisible();
  await expect(page.getByText("This page couldn't load"), path).toHaveCount(0);
}

test("every public page renders", async ({ page }) => {
  for (const path of PUBLIC) await expectRendered(page, path);
});

test("published projects and articles open; unknown slugs are 404", async ({ page }) => {
  for (const list of ["/projects", "/articles"]) {
    await page.goto(list);
    const hrefs = await page.locator(`main a[href^="${list}/"]`).evaluateAll((as) =>
      [...new Set(as.map((a) => a.getAttribute("href")!))]);
    for (const href of hrefs) await expectRendered(page, href);
    const res = await page.goto(`${list}/definitely-not-a-real-slug`);
    expect(res?.status()).toBe(404);
  }
});

test("admin pages redirect to login when signed out", async ({ page }) => {
  for (const path of ["/admin", "/admin/jobs", "/admin/resume", "/admin/export"]) {
    await page.goto(path);
    await expect(page, path).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path)}`));
  }
});

test("the RSS feed is valid XML with absolute links", async ({ page, request }) => {
  const res = await request.get("/feed.xml");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toMatch(/xml/);
  const xml = await res.text();
  const feed = await page.evaluate((text) => {
    const doc = new DOMParser().parseFromString(text, "application/xml");
    return {
      error: doc.querySelector("parsererror")?.textContent ?? null,
      root: doc.documentElement.nodeName,
      // RSS <link> only (no namespace), not <atom:link href=…/>.
      links: [...doc.querySelectorAll("channel > link, item > link")]
        .filter((l) => !l.namespaceURI).map((l) => l.textContent ?? ""),
    };
  }, xml);
  expect(feed.error).toBeNull();
  expect(feed.root).toBe("rss");
  for (const link of feed.links) expect(link).toMatch(/^https?:\/\//);
});

test("no public page scrolls sideways at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const path of PUBLIC) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBe(0);
  }
});

test("robots.txt hides the admin and points to a sitemap listing public pages", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/Disallow: \/admin/);
  expect(robots).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const xml = await res.text();
  for (const path of ["/articles", "/projects", "/about"]) expect(xml).toContain(`${path}</loc>`);
  expect(xml).not.toContain("/admin");
});
