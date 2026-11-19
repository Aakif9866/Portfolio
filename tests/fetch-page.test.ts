/**
 * fetchPage must re-check every redirect hop: a public URL that 302s to the cloud metadata
 * address must not be followed. fetch is stubbed and the hosts are IP literals, so this
 * runs offline (no DNS).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPage } from "@/lib/fetch-page";

const html = () => new Response("<title>ok</title>", { headers: { "content-type": "text/html" } });
const redirect = (to: string) => new Response(null, { status: 302, headers: { location: to } });

afterEach(() => vi.unstubAllGlobals());

describe("fetchPage", () => {
  it("follows a redirect to another public address", async () => {
    const f = vi.fn().mockResolvedValueOnce(redirect("/next")).mockResolvedValueOnce(html());
    vi.stubGlobal("fetch", f);
    expect(await fetchPage("https://93.184.216.34/start")).toEqual({ html: "<title>ok</title>", url: "https://93.184.216.34/next" });
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("refuses a redirect to a private address without requesting it", async () => {
    const f = vi.fn().mockResolvedValueOnce(redirect("http://169.254.169.254/latest/meta-data/"));
    vi.stubGlobal("fetch", f);
    expect(await fetchPage("https://93.184.216.34/start")).toBeNull();
    expect(f).toHaveBeenCalledTimes(1);
    // fetch must not follow redirects on its own, or the check above never sees the hop.
    expect(f.mock.calls[0][1].redirect).toBe("manual");
  });

  it("gives up after too many redirects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => redirect("/again")));
    expect(await fetchPage("https://93.184.216.34/start")).toBeNull();
  });
});
