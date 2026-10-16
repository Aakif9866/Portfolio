/**
 * Pure helpers behind the admin Server Actions: FormData → row, and which
 * publication changes are allowed. Kept out of the "use server" module so
 * they can be unit-tested without a request or a database.
 */
import { FIELDS, type EditableTable } from "./admin-fields";

/** Tables the admin may write through the generic actions. */
export function assertTable(t: string): EditableTable {
  if (!(t in FIELDS)) throw new Error(`Table not permitted: ${t}`);
  return t as EditableTable;
}

/**
 * FormData → row. Field names carry their type as a prefix (num:, bool:,
 * json:, lines:); keys starting with __ are control fields, not columns.
 * Empty inputs become NULL, never "" or 0.
 */
export function parseRowForm(formData: FormData): { ok: true; row: Record<string, unknown> } | { ok: false; message: string } {
  const row: Record<string, unknown> = {};
  for (const [key, raw] of formData.entries()) {
    if (key.startsWith("__")) continue;
    const value = String(raw);
    if (key.startsWith("num:")) {
      row[key.slice(4)] = value.trim() === "" ? null : Number(value);
    } else if (key.startsWith("bool:")) {
      row[key.slice(5)] = value === "on" || value === "true";
    } else if (key.startsWith("json:")) {
      const name = key.slice(5);
      try { row[name] = value.trim() ? JSON.parse(value) : null; }
      catch { return { ok: false, message: `${name === "nodes" ? "Boxes" : name === "edges" ? "Connections" : name} is not valid JSON.` }; }
    } else if (key.startsWith("lines:")) {
      row[key.slice(6)] = value.split("\n").map((l) => l.trim()).filter(Boolean);
    } else {
      row[key] = value.trim() === "" ? null : value;
    }
  }
  // Unchecked checkboxes never reach the server, so declared booleans default to false.
  for (const b of String(formData.get("__booleans") ?? "").split(",").filter(Boolean)) {
    if (!(b in row)) row[b] = false;
  }
  return { ok: true, row };
}

export type StateAction = { to: string; label: string; tone: "primary" | "neutral" };

const PUBLISHABLE = ["projects", "articles", "experiments", "timeline_entries"];

/**
 * The publication actions that make sense from the current state — the UI
 * shows only these, and the server refuses anything else.
 */
export function stateActions(table: string, state: string): StateAction[] {
  if (PUBLISHABLE.includes(table)) {
    if (state === "draft") return [{ to: "published", label: "Publish", tone: "primary" }, { to: "archived", label: "Archive", tone: "neutral" }];
    if (state === "published") return [{ to: "draft", label: "Unpublish", tone: "neutral" }, { to: "archived", label: "Archive", tone: "neutral" }];
    if (state === "archived") return [{ to: "draft", label: "Restore to draft", tone: "neutral" }];
  }
  if (table === "project_sections") {
    if (state === "draft") return [{ to: "published", label: "Publish", tone: "primary" }, { to: "hidden", label: "Hide", tone: "neutral" }];
    if (state === "published") return [{ to: "draft", label: "Unpublish", tone: "neutral" }, { to: "hidden", label: "Hide", tone: "neutral" }];
    if (state === "hidden" || state === "empty") return [{ to: "draft", label: "Restore to draft", tone: "neutral" }];
  }
  return [];
}

export const canTransition = (table: string, from: string, to: string) =>
  stateActions(table, from).some((a) => a.to === to);
