import { describe, expect, it } from "vitest";
import { checklist, tasks, toggleTask, validateCareer, validateSkill } from "@/lib/career";

describe("validateCareer", () => {
  it("keeps filled known fields and drops the rest", () => {
    expect(validateCareer({ "career.current_salary": " 2.4 LPA ", "career.target_salary": "", "career.hack": "x", other: "y" }))
      .toEqual({ ok: true, value: { current_salary: "2.4 LPA" } });
  });
  it("rejects over-long values", () => {
    expect(validateCareer({ "career.current_salary": "x".repeat(61) }).ok).toBe(false);
  });
});

describe("validateSkill", () => {
  it("cleans the name and keeps only set fields", () => {
    expect(validateSkill("  System   Design ", { level: "learning", want: true, note: "" }))
      .toEqual({ ok: true, key: "System Design", value: { level: "learning", want: true } });
  });
  it("an empty note means remove", () => {
    expect(validateSkill("Go", { level: "", want: false })).toEqual({ ok: true, key: "Go", value: null });
  });
  it("rejects unknown levels and bad names", () => {
    expect(validateSkill("Go", { level: "god-tier" }).ok).toBe(false);
    expect(validateSkill("  ", {}).ok).toBe(false);
  });
});

describe("milestones", () => {
  const md = "Plan:\n- [x] Read DDIA ch 1–4\n- [ ] Build a rate limiter\n  * [X] nested done\nnot a task [ ]\n1. [ ] numbered isn't GFM-task here";

  it("checklist counts task items only", () => expect(checklist(md)).toEqual({ done: 2, total: 3 }));

  it("tasks lists them in order", () => {
    expect(tasks(md)).toEqual([{ done: true, text: "Read DDIA ch 1–4" }, { done: false, text: "Build a rate limiter" }, { done: true, text: "nested done" }]);
  });

  it("toggleTask flips exactly one item and nothing else", () => {
    const once = toggleTask(md, 1);
    expect(tasks(once)[1].done).toBe(true);
    expect(once.replace("- [x] Build", "- [ ] Build")).toBe(md);
    expect(tasks(toggleTask(toggleTask(md, 2), 2))).toEqual(tasks(md));
    expect(toggleTask(md, 9)).toBe(md);
  });
});
