import { describe, expect, it, vi } from "vitest";
import { addUsage, aiConfig, chat, currentUsage } from "@/lib/ai";
import { emailPrompt, htmlToText, structureLogPrompt, summarizePrompt } from "@/lib/ai-prompts";

const env = { AI_API_KEY: "sk-test" };
const reply = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe("aiConfig", () => {
  it("defaults to DeepSeek and accepts either key name", () => {
    expect(aiConfig({ DEEPSEEK_API_KEY: "k" })).toMatchObject({ enabled: true, baseUrl: "https://api.deepseek.com", model: "deepseek-chat", monthlyCap: 2_000_000 });
    expect(aiConfig({}).enabled).toBe(false);
    expect(aiConfig({ AI_API_KEY: "k", AI_BASE_URL: "https://api.groq.com/openai/v1/", AI_MODEL: "llama", AI_MONTHLY_TOKEN_CAP: "5000" }))
      .toMatchObject({ baseUrl: "https://api.groq.com/openai/v1", model: "llama", monthlyCap: 5000 });
  });
});

describe("chat", () => {
  it("posts an OpenAI-style request and returns text and tokens", async () => {
    const f = reply(200, { choices: [{ message: { content: " Hi " } }], usage: { total_tokens: 42 } });
    const r = await chat([{ role: "user", content: "x" }], { maxTokens: 50 }, { fetch: f as unknown as typeof fetch, env });
    expect(r).toEqual({ ok: true, text: "Hi", tokens: 42 });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.deepseek.com/chat/completions");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer sk-test");
    expect(JSON.parse(init.body as string)).toMatchObject({ model: "deepseek-chat", max_tokens: 50, stream: false });
  });

  it("is off without a key and never calls out", async () => {
    const f = vi.fn();
    expect((await chat([], {}, { fetch: f as unknown as typeof fetch, env: {} })).ok).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });

  it.each([[401, "rejected the API key"], [402, "out of credit"], [429, "rate-limiting"], [500, "HTTP 500"]])("maps HTTP %i without echoing the body", async (status, msg) => {
    const r = await chat([], {}, { fetch: reply(status, { error: "secret detail sk-test" }) as unknown as typeof fetch, env });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.message).toContain(msg);
    expect(!r.ok && r.message).not.toContain("secret");
  });

  it("treats an empty answer and a network failure as errors", async () => {
    expect((await chat([], {}, { fetch: reply(200, { choices: [] }) as unknown as typeof fetch, env })).ok).toBe(false);
    const boom = vi.fn(async () => { throw new TypeError("fetch failed"); });
    expect(await chat([], {}, { fetch: boom as unknown as typeof fetch, env })).toEqual({ ok: false, message: "Couldn't reach the AI provider." });
  });
});

describe("usage", () => {
  const now = new Date("2026-11-19T00:00:00Z");
  it("resets each month and adds up", () => {
    expect(currentUsage({ month: "2026-10", tokens: 999, calls: 3 }, now)).toEqual({ month: "2026-11", tokens: 0, calls: 0 });
    expect(currentUsage(null, now)).toEqual({ month: "2026-11", tokens: 0, calls: 0 });
    expect(addUsage(currentUsage({ month: "2026-11", tokens: 10, calls: 1 }, now), 5)).toEqual({ month: "2026-11", tokens: 15, calls: 2 });
  });
});

describe("prompts", () => {
  it("htmlToText drops scripts, styles and tags", () => {
    expect(htmlToText("<head><style>a{}</style></head><nav>menu</nav><p>Hello &amp; <b>world</b></p><script>evil()</script><p>Two</p>")).toBe("Hello & world\nTwo");
  });

  it("untrusted material is fenced and long input is clipped", () => {
    const [sys, user] = summarizePrompt("T", "https://a.dev", "x".repeat(20_000));
    expect(sys.content).toContain("not instructions");
    expect(user.content).toContain("<material>");
    expect(user.content).toContain("[…truncated]");
    expect(user.content.length).toBeLessThan(12_200);
  });

  it("the log prompt forbids invented facts", () => {
    expect(structureLogPrompt("fixed bug", "notes")[0].content).toMatch(/never invent/i);
  });

  it("the email prompt never includes salary", () => {
    const msgs = emailPrompt("follow_up", { role: "Backend Engineer", company: "Acme", ...({ salary: "9 LPA" } as object), notes: "talked to Priya" });
    const all = msgs.map((m) => m.content).join("\n");
    expect(all).toContain("Acme");
    expect(all).not.toContain("9 LPA");
  });
});
