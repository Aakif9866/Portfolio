"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { profile } from "@/data/profile";
import { skills } from "@/data/skills";
import { projects, getProject } from "@/data/projects";

type Line = { kind: "in" | "out"; text: string };

const commands: Record<string, (arg?: string) => string> = {
  help: () =>
    ["help          list commands", "whoami        who is this", "skills        skill categories", "projects      list projects", "project <id>  project details", "contact       how to reach me", "clear         clear the screen"].join("\n"),
  whoami: () => `${profile.name}: ${profile.role}\n${profile.intro}`,
  skills: () => skills.map((g) => `${g.title}\n  ${g.items.join(", ")}`).join("\n"),
  projects: () => projects.map((p) => `${p.slug.padEnd(32)} ${p.area}`).join("\n") + "\n\nTry: project " + projects[0].slug,
  project: (slug) => {
    const p = slug && getProject(slug);
    if (!p) return `usage: project <id>\nids: ${projects.map((x) => x.slug).join(", ")}`;
    return `${p.title}\n${p.overview}\nstack: ${p.stack.join(", ")}\npage:  /projects/${p.slug}`;
  },
  contact: () =>
    [profile.email && `email:    ${profile.email}`, profile.github && `github:   ${profile.github}`, profile.linkedin && `linkedin: ${profile.linkedin}`]
      .filter(Boolean)
      .join("\n") || "Use the contact section below.",
};

const welcome: Line[] = [{ kind: "out", text: "Type `help` to see available commands." }];

export function Terminal() {
  const [lines, setLines] = useState<Line[]>(welcome);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const screen = useRef<HTMLDivElement>(null);

  const run = (e: FormEvent) => {
    e.preventDefault();
    const raw = value.trim();
    setValue("");
    setCursor(-1);
    if (!raw) return;
    setHistory((h) => [raw, ...h]);
    const [cmd, arg] = raw.split(/\s+/);
    if (cmd === "clear") return setLines([]);
    const out = commands[cmd]?.(arg) ?? `command not found: ${cmd}. Type \`help\`.`;
    setLines((l) => [...l, { kind: "in", text: raw }, { kind: "out", text: out }]);
    requestAnimationFrame(() => screen.current?.scrollTo({ top: screen.current.scrollHeight }));
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const next = Math.max(-1, Math.min(history.length - 1, cursor + (e.key === "ArrowUp" ? 1 : -1)));
    setCursor(next);
    setValue(next === -1 ? "" : history[next]);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface font-mono text-sm" onClick={() => input.current?.focus()}>
      <div className="flex items-center gap-2 border-b border-line px-4 py-2 text-xs text-muted">
        <span className="size-2 rounded-full bg-line" />
        <span className="size-2 rounded-full bg-line" />
        <span className="size-2 rounded-full bg-accent" />
        <span className="ml-2">guest@portfolio</span>
      </div>
      <div ref={screen} role="log" aria-live="polite" className="h-72 overflow-y-auto p-4">
        {lines.map((l, i) => (
          <pre key={i} className={`whitespace-pre-wrap break-words ${l.kind === "in" ? "text-heading" : "mb-3 text-muted"}`}>
            {l.kind === "in" && <span className="text-accent">$ </span>}
            {l.text}
          </pre>
        ))}
        <form onSubmit={run} className="flex items-center gap-2">
          <label htmlFor="term-input" className="text-accent">$</label>
          <input
            id="term-input"
            ref={input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKey}
            autoComplete="off"
            spellCheck={false}
            aria-label="Terminal command"
            className="flex-1 bg-transparent text-heading outline-none"
          />
        </form>
      </div>
    </div>
  );
}
