import type { CSSProperties } from "react";

export type Tone = "green" | "blue" | "amber" | "violet" | "coral";
export const toneCycle: Tone[] = ["green", "blue", "amber", "violet", "coral"];

/** Sets --tone for an element; descendants use text-(--tone), border-(--tone), bg-(--tone)/10 … */
export const tone = (t: Tone) => ({ "--tone": `var(--c-${t})` }) as CSSProperties;
export const toneAt = (i: number) => tone(toneCycle[i % toneCycle.length]);

// What each colour means across the site.
export const areaTone: Record<string, Tone> = {
  "Generative AI": "violet",
  "Machine Learning": "amber",
  "Full-stack": "blue",
};

export const categoryTone: Record<string, Tone> = {
  "Backend Engineering": "blue",
  "System Design": "blue",
  "AI Engineering": "violet",
  "RAG Architectures": "violet",
  "Machine Learning": "amber",
  "Database Internals": "coral",
  "Distributed Systems": "green",
  "C++ & Rust": "coral",
  Experiments: "green",
};
