/**
 * Resumes are one plain-text document each, in a small Markdown-like format:
 *
 *   # Full Name
 *   email@example.com | +91 … | github.com/you | linkedin.com/in/you
 *
 *   ## Experience
 *   ### Company | Role | City | Jun 2025 – Present
 *   - What you did, with a **result**
 *
 *   ## Skills
 *   - Languages: Python, TypeScript
 *
 * `### A | B | C | D` is an entry: A bold and D right-aligned on the first line, B italic and
 * C right-aligned on the second (Jake's Resume layout). Anything that looks like a URL renders
 * as a link. `[square brackets]` mark something still to fill in.
 *
 * Stored in private_config under `resume.master` (the master profile) and `resume.v.<id>`
 * (versions). Pure functions only, unit-tested; the same parser drives the live preview,
 * the print page and the .tex export.
 */

export type Block = { type: "p"; text: string } | { type: "bullet"; text: string } | { type: "entry"; fields: string[]; bullets: string[] };
export type Section = { title: string; blocks: Block[] };
export type ResumeDoc = { name: string; contact: string[]; sections: Section[] };
export type StoredResume = { title: string; text: string; job_id?: string };

export const MAX_RESUME = 30_000;

/** `master` or `v.<12 hex>` → the private_config key. Anything else is refused. */
export function resumeKey(param: string) {
  return /^(master|v\.[a-f0-9]{12})$/.test(param) ? `resume.${param}` : null;
}

export const newVersionParam = (rand: string = crypto.randomUUID()) => `v.${rand.replace(/-/g, "").slice(0, 12)}`;

export function parseResume(text: string): ResumeDoc {
  const doc: ResumeDoc = { name: "", contact: [], sections: [] };
  let section: Section | null = null;
  let entry: Extract<Block, { type: "entry" }> | null = null;

  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) { entry = null; continue; }
    if (line.startsWith("# ")) { doc.name = line.slice(2).trim(); continue; }
    if (line.startsWith("## ")) { section = { title: line.slice(3).trim(), blocks: [] }; doc.sections.push(section); entry = null; continue; }
    if (!section) {
      // Lines between the name and the first section are the contact line(s).
      doc.contact.push(...line.split("|").map((s) => s.trim()).filter(Boolean));
      continue;
    }
    if (line.startsWith("### ")) {
      entry = { type: "entry", fields: line.slice(4).split("|").map((s) => s.trim()), bullets: [] };
      section.blocks.push(entry);
      continue;
    }
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    if (bullet) {
      if (entry) entry.bullets.push(bullet[1]);
      else section.blocks.push({ type: "bullet", text: bullet[1] });
      continue;
    }
    entry = null;
    const last = section.blocks.at(-1);
    if (last?.type === "p") last.text += ` ${line}`;
    else section.blocks.push({ type: "p", text: line });
  }
  return doc;
}

/** The `[things to fill in]` left in a resume, in order, without duplicates. */
export function placeholders(text: string) {
  return [...new Set([...text.matchAll(/\[([^\]\n]{2,80})\]/g)].map((m) => m[1]))];
}

export const isUrl = (s: string) => /^(https?:\/\/|www\.)\S+$|^[a-z0-9-]+(\.[a-z0-9-]+)+\/\S*$/i.test(s);
export const href = (s: string) => (/^https?:\/\//i.test(s) ? s : `https://${s}`);
/** "https://www.github.com/me/" → "github.com/me" for display. */
export const shortUrl = (s: string) => s.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");

/** `**bold**` is the only inline markup. Returns alternating plain / bold runs. */
export function inlineRuns(text: string): { bold: boolean; text: string }[] {
  return text.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((t) => (t.startsWith("**") && t.endsWith("**") ? { bold: true, text: t.slice(2, -2) } : { bold: false, text: t }));
}

/* ── starting point from the portfolio's own records ──────────────────────── */

type StarterInput = {
  contact: { email: string; github: string; linkedin: string | null };
  projects: { title: string; thesis: string | null; repo_url: string | null; demo_url: string | null; started_on: string | null; ended_on: string | null; tech: string[] }[];
  timeline: { kind: string; organisation: string; title: string; location: string | null; start_date: string | null; end_date: string | null; bullets: string[] | null }[];
  skills: { label: string; items: string[] }[];
};

const monthYear = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }) : null);
const range = (a: string | null, b: string | null, open = "Present") => {
  const s = monthYear(a);
  return s ? `${s} – ${monthYear(b) ?? open}` : "[Dates]";
};

/**
 * A first draft built only from published portfolio data. Nothing is invented: anything the
 * portfolio doesn't know (your full name, phone, education, summary) is a [placeholder].
 */
export function starterResume({ contact, projects, timeline, skills }: StarterInput) {
  const out: string[] = ["# [Your full name]", [contact.email, "[Phone]", shortUrl(contact.github), contact.linkedin && shortUrl(contact.linkedin)].filter(Boolean).join(" | "), ""];
  out.push("## Summary", "[One or two lines: what you build and what you're looking for]", "");

  const work = timeline.filter((t) => t.kind === "work");
  out.push("## Experience");
  if (work.length === 0) out.push("### [Company] | [Role] | [City] | [Start] – [End]", "- [What you did, and what changed because of it]");
  for (const w of work) {
    out.push(`### ${w.organisation} | ${w.title} | ${w.location ?? "[City]"} | ${range(w.start_date, w.end_date)}`);
    out.push(...(w.bullets?.length ? w.bullets.map((b) => `- ${b}`) : ["- [What you did, and what changed because of it]"]));
    out.push("");
  }
  out.push("");

  out.push("## Projects");
  for (const p of projects) {
    const link = p.repo_url ?? p.demo_url;
    out.push(`### ${p.title} | ${p.tech.slice(0, 5).join(", ") || "[Tech]"} | ${link ? shortUrl(link) : ""} | ${p.started_on ? range(p.started_on, p.ended_on) : ""}`.replace(/( \| )+$/, ""));
    out.push(`- ${p.thesis ?? "[What it does and the hardest problem you solved]"}`, "");
  }
  if (projects.length === 0) out.push("### [Project] | [Tech] | [Link] | [Dates]", "- [What it does]", "");

  const edu = timeline.filter((t) => t.kind === "education");
  out.push("## Education");
  if (edu.length === 0) out.push("### [College] | [Degree] | [City] | [Start] – [End]");
  for (const e of edu) out.push(`### ${e.organisation} | ${e.title} | ${e.location ?? "[City]"} | ${range(e.start_date, e.end_date, "Expected")}`);
  out.push("");

  out.push("## Skills", ...skills.filter((s) => s.items.length).map((s) => `- ${s.label}: ${s.items.join(", ")}`));
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

/** Bullets under a "## Resume bullets" heading in a log (what W4's Structure button writes). */
export function extractResumeBullets(md: string) {
  const m = md.match(/^##\s*Resume bullets\s*\n([\s\S]*?)(?=^##\s|(?![\s\S]))/im);
  if (!m) return [];
  return m[1].split("\n").map((l) => l.match(/^\s*[-*]\s+(.*)$/)?.[1]?.trim()).filter((b): b is string => !!b && b !== "—" && b !== "-");
}

/* ── LaTeX (Jake's Resume structure, for Overleaf) ────────────────────────── */

export function texEscape(s: string) {
  // Backslashes go through a placeholder so the braces of \textbackslash{} aren't escaped too.
  return s
    .replace(/\\/g, "\u0000")
    .replace(/([&%$#_{}])/g, "\\$1")
    .replace(/\u0000/g, "\\textbackslash{}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/–|—/g, "--");
}

const texInline = (s: string) => inlineRuns(s).map((r) => (r.bold ? `\\textbf{${texEscape(r.text)}}` : texEscape(r.text))).join("");
const texField = (s: string) => (isUrl(s) ? `\\href{${href(s).replace(/([%#\\])/g, "\\$1")}}{\\underline{${texEscape(shortUrl(s))}}}` : texInline(s));

const PREAMBLE = String.raw`%-------------------------
% Resume in LaTeX, following the structure of Jake's Resume (MIT): https://github.com/jakegut/resume
% Generated by the portfolio workspace. Compile with pdfLaTeX (Overleaf's default).
%-------------------------
\documentclass[letterpaper,11pt]{article}
\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\input{glyphtounicode}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}
\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1in}
\addtolength{\topmargin}{-.5in}
\addtolength{\textheight}{1.0in}
\urlstyle{same}
\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}
\titleformat{\section}{\vspace{-4pt}\scshape\raggedright\large}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]
\pdfgentounicode=1

\newcommand{\resumeItem}[1]{\item\small{{#1 \vspace{-2pt}}}}
\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & #4 \\
      \textit{\small#2} & \textit{\small #3} \\
    \end{tabular*}\vspace{-7pt}
}
\newcommand{\resumeSubItem}[1]{\resumeItem{#1}\vspace{-4pt}}
\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}
\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}
`;

export function resumeToTex(doc: ResumeDoc) {
  const out = [PREAMBLE, "\\begin{document}", "", "\\begin{center}", `    \\textbf{\\Huge \\scshape ${texEscape(doc.name || "Your Name")}} \\\\ \\vspace{1pt}`];
  if (doc.contact.length) out.push(`    \\small ${doc.contact.map(texField).join(" $|$ ")}`);
  out.push("\\end{center}", "");

  for (const s of doc.sections) {
    out.push(`\\section{${texEscape(s.title)}}`);
    const entries = s.blocks.filter((b) => b.type === "entry");
    const loose = s.blocks.filter((b) => b.type !== "entry");
    if (loose.length) {
      out.push("  \\begin{itemize}[leftmargin=0.15in, label={}]", "    \\small{\\item{");
      out.push(loose.map((b) => {
        const text = (b as { text: string }).text;
        const kv = b.type === "bullet" ? text.match(/^([^:]{1,40}):\s*(.+)$/) : null;
        return `     ${kv ? `\\textbf{${texEscape(kv[1])}}{: ${texInline(kv[2])}}` : texInline(text)} \\\\`;
      }).join("\n"));
      out.push("    }}", "  \\end{itemize}");
    }
    if (entries.length) {
      out.push("  \\resumeSubHeadingListStart");
      for (const e of entries as Extract<Block, { type: "entry" }>[]) {
        const [a = "", b = "", c = "", d = ""] = e.fields;
        out.push(`    \\resumeSubheading{${texField(a)}}{${texField(b)}}{${texField(c)}}{${texField(d)}}`);
        if (e.bullets.length) {
          out.push("      \\resumeItemListStart", ...e.bullets.map((x) => `        \\resumeItem{${texInline(x)}}`), "      \\resumeItemListEnd");
        }
      }
      out.push("  \\resumeSubHeadingListEnd");
    }
    out.push("");
  }
  out.push("\\end{document}", "");
  return out.join("\n");
}
