import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataUnavailableError, fetchOrThrow, isTransient } from "@/lib/db";

const ok = <T,>(data: T) => ({ data, error: null, count: null });
const fail = (code: string, message = "x") => ({ data: null, error: { code, message } });
const fast = { backoffMs: 1, timeoutMs: 1000 };

afterEach(() => vi.restoreAllMocks());

describe("fetchOrThrow", () => {
  it("returns a successful empty result as-is — a genuine empty state is not an error", async () => {
    const r = await fetchOrThrow("projects", async () => ok([] as unknown[]), fast);
    expect(r.data).toEqual([]);
  });

  it("returns null data from a single-row lookup (a real 'not found')", async () => {
    const r = await fetchOrThrow("project", async () => ok(null), fast);
    expect(r.data).toBeNull();
  });

  it("retries a transient failure and succeeds", async () => {
    // same success | failure union that supabase-js responses use
    type Res = { data: number[]; error: null } | { data: null; error: { code: string; message: string } };
    const run = vi.fn<() => Promise<Res>>()
      .mockResolvedValueOnce(fail("", "TypeError: fetch failed")).mockResolvedValueOnce(ok([1]));
    const r = await fetchOrThrow("projects", run, fast);
    expect(r.data).toEqual([1]);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("treats a thrown network/abort error like a failed response", async () => {
    const run = vi.fn<() => Promise<{ data: number[] | null; error: null }>>()
      .mockRejectedValueOnce(new DOMException("timed out", "TimeoutError")).mockResolvedValueOnce(ok([1]));
    expect((await fetchOrThrow("projects", run, fast)).data).toEqual([1]);
  });

  it("gives up after a bounded number of attempts and throws instead of returning empty data", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const run = vi.fn().mockResolvedValue(fail("", "TypeError: fetch failed"));
    await expect(fetchOrThrow("projects", run, { ...fast, attempts: 3 })).rejects.toBeInstanceOf(DataUnavailableError);
    expect(run).toHaveBeenCalledTimes(3);
  });

  it("does not retry a real query error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const run = vi.fn().mockResolvedValue(fail("42P01", 'relation "public.projects" does not exist'));
    await expect(fetchOrThrow("projects", run, fast)).rejects.toThrow("Couldn't load projects from the database.");
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("passes a timeout signal to every attempt", async () => {
    const run = vi.fn(async (s: AbortSignal) => { expect(s).toBeInstanceOf(AbortSignal); return ok(1); });
    await fetchOrThrow("x", run, fast);
    expect(run).toHaveBeenCalledOnce();
  });

  it("never leaks database detail in the error or the log", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const secret = 'permission denied for table admin_allowlist at https://abc.supabase.co?apikey=sb_secret_123';
    const err = await fetchOrThrow("projects", async () => fail("42501", secret), fast).catch((e) => e);
    expect(err.message).toBe("Couldn't load projects from the database.");
    const line = String(log.mock.calls[0][0]);
    expect(line).not.toContain("supabase.co");
    expect(line).not.toContain("sb_secret");
    expect(line).not.toContain("admin_allowlist");
    expect(JSON.parse(line)).toEqual({ level: "error", event: "db.unavailable", what: "projects", code: "42501", attempts: 1 });
  });
});

describe("isTransient", () => {
  it.each([
    ["", true], ["23", true], ["20", true], ["ECONNRESET", true], ["UND_ERR_CONNECT_TIMEOUT", true],
    ["PGRST000", true], ["PGRST003", true], ["08006", true], ["57014", true], ["53300", true], ["40001", true],
    ["PGRST116", false], ["PGRST204", false], ["42P01", false], ["42501", false], ["23505", false],
  ])("code %j → %s", (code, expected) => {
    expect(isTransient({ code })).toBe(expected);
  });
});

/** Every query on a public page must go through fetchOrThrow (which is where .abortSignal is added). */
describe("public pages", () => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) { if (!p.includes(join("app", "admin"))) walk(p); }
      else if (/\.tsx?$/.test(f)) files.push(p);
    }
  };
  walk(join(__dirname, "..", "src"));
  // auth.ts runs only behind /admin; visits.ts recordVisit is a background write that must never fail a page
  const exempt = ["auth.ts", "visits.ts", join("supabase", "server.ts"), "db.ts"];
  const publicFiles = files.filter((f) => !exempt.some((e) => f.endsWith(e)));

  it.each(publicFiles.filter((f) => readFileSync(f, "utf8").includes(".from(\"")).map((f) => [f.split("src")[1], f]))(
    "%s routes every query through fetchOrThrow",
    (_name, file) => {
      const src = readFileSync(file, "utf8");
      expect((src.match(/\.abortSignal\(/g) ?? []).length).toBe((src.match(/\.from\("/g) ?? []).length);
    },
  );
});
