import { describe, expect, it } from "vitest";
import { FIELDS, validateRow } from "@/lib/admin-fields";
import { assertTable, canTransition, parseRowForm, stateActions } from "@/lib/form";
import { isSiteKey } from "@/lib/site-content";

const form = (entries: [string, string][]) => {
  const fd = new FormData();
  for (const [k, v] of entries) fd.append(k, v);
  return fd;
};

describe("parseRowForm", () => {
  it("drops control fields; empty inputs become null, including numbers", () => {
    const r = parseRowForm(form([["__table", "projects"], ["title", "T"], ["summary", "  "], ["num:position", ""]]));
    expect(r).toEqual({ ok: true, row: { title: "T", summary: null, position: null } });
  });

  it("coerces typed prefixes and defaults unchecked boxes to false", () => {
    const r = parseRowForm(form([["__booleans", "featured,remote"], ["bool:remote", "on"], ["num:team_size", "3"], ["lines:tags", "a\n\n b "], ["json:nodes", "[]"]]));
    expect(r).toEqual({ ok: true, row: { remote: true, featured: false, team_size: 3, tags: ["a", "b"], nodes: [] } });
  });

  it("reports malformed JSON with the field's display name", () => {
    expect(parseRowForm(form([["json:nodes", "{bad"]]))).toEqual({ ok: false, message: "Boxes is not valid JSON." });
  });
});

describe("validateRow — explicit allowlist", () => {
  it.each(["state", "published_at", "id", "created_at", "updated_at"])("refuses to write %s through a generic save", (col) => {
    expect(validateRow("projects", { title: "T", [col]: "x" }, false)).toMatch(/cannot be changed/);
  });

  it("refuses tables outside the admin's list", () => {
    expect(() => assertTable("admin_allowlist")).toThrow();
    expect(() => assertTable("article_revisions")).toThrow();
    expect(assertTable("projects")).toBe("projects");
  });
});

describe("validateRow — values", () => {
  const project = { title: "P", thesis: "t", status: "active", slug: "my-project" };

  it("accepts a valid new project", () => expect(validateRow("projects", project, true)).toBeNull());
  it("requires required fields on create", () => expect(validateRow("projects", { ...project, thesis: null }, true)).toBe("One-line summary is required."));
  it("lets an update send only some fields", () => expect(validateRow("projects", { summary: "x" }, false)).toBeNull());
  it("rejects clearing a required field on update", () => expect(validateRow("projects", { title: null }, false)).toBe("Project name is required."));

  it.each(["My Project", "my--project", "-x", "x_y", "ÄBC"])("rejects slug %j", (slug) =>
    expect(validateRow("projects", { ...project, slug }, true)).toMatch(/lowercase/));

  it.each(["github.com/x", "javascript:alert(1)", "ftp://x"])("rejects link %j", (repo_url) =>
    expect(validateRow("projects", { ...project, repo_url }, true)).toMatch(/http/));

  it("rejects unknown select values", () => expect(validateRow("projects", { ...project, status: "done" }, true)).toMatch(/not one of the options/));
  it("rejects bad dates and end-before-start", () => {
    expect(validateRow("projects", { ...project, started_on: "2024-13-40" }, true)).toMatch(/valid date/);
    expect(validateRow("projects", { ...project, started_on: "2024-05-01", ended_on: "2024-01-01" }, true)).toMatch(/before the start/);
  });
  it("requires a real project for sections", () =>
    expect(validateRow("project_sections", { project_id: "not-a-uuid", kind: "overview" }, true)).toBe("Choose a project."));
  it("requires diagram boxes to be a list", () =>
    expect(validateRow("architecture_diagrams", { nodes: { a: 1 } }, false)).toMatch(/JSON list/));
  it("requires whole numbers", () => expect(validateRow("projects", { team_size: 1.5 }, false)).toMatch(/whole number/));

  it("every field definition has a label", () => {
    for (const fields of Object.values(FIELDS)) for (const f of fields) expect(f.label.length).toBeGreaterThan(0);
  });
});

describe("publication transitions", () => {
  it("offers only actions valid for the current state", () => {
    expect(stateActions("projects", "draft").map((a) => a.label)).toEqual(["Publish", "Archive"]);
    expect(stateActions("projects", "published").map((a) => a.label)).toEqual(["Unpublish", "Archive"]);
    expect(stateActions("projects", "archived").map((a) => a.label)).toEqual(["Restore to draft"]);
    expect(stateActions("project_sections", "hidden").map((a) => a.to)).toEqual(["draft"]);
    expect(stateActions("technologies", "published")).toEqual([]);
  });

  it("refuses transitions the UI does not offer", () => {
    expect(canTransition("projects", "archived", "published")).toBe(false);
    expect(canTransition("projects", "draft", "hidden")).toBe(false);
    expect(canTransition("project_sections", "draft", "archived")).toBe(false);
    expect(canTransition("articles", "draft", "published")).toBe(true);
  });
});

describe("site settings", () => {
  it("only lets the admin edit keys the site reads", () => {
    expect(isSiteKey("about_md")).toBe(true);
    expect(isSiteKey("social.linkedin")).toBe(true);
    expect(isSiteKey("visit_count")).toBe(false);
    expect(isSiteKey("hero.lines")).toBe(false);
  });
});
