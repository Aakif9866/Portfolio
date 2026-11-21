# Backend Engineering & AI Portfolio

**Live:** https://portfolio-test-branch.vercel.app

A dark-first developer portfolio focused on backend engineering, AI/ML, Generative AI and RAG systems. Built with Next.js (App Router), TypeScript and Tailwind CSS.

## Features

- **Projects:** six projects, each with a detail page (problem, step-through architecture diagram, stack, decisions, implementation, challenges).
- **Backend Engineering Showcase** (`/backend`): interactive walkthroughs of the request lifecycle, JWT auth, the database query lifecycle, caching, queues, microservices, rate limiting, load balancing and observability.
- **AI & RAG Showcase** (`/ai`): the RAG pipeline from ingestion to evaluation, plus Recall@K, Recall@1, MRR, answer correctness and faithfulness.
- **Technical Journal** (`/journal`): MDX articles with search, category filters, reading time, table of contents, related articles and build-time syntax highlighting.
- **Also:** an interactive terminal, a contact form (Formspree), dark/light themes, a scroll progress bar, SEO/Open Graph metadata, a sitemap and a custom 404 page.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Motion · Lucide · `@next/mdx` + rehype-pretty-code (Shiki)

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint
```

## Editing content

All content lives in data files. Components only render it.

| What | Where |
|---|---|
| Name, email, GitHub, LinkedIn, resume, Formspree ID, site URL | `src/data/profile.ts` |
| Skills | `src/data/skills.ts` |
| Projects (repo/demo links, challenges) | `src/data/projects.ts` |
| Experience | `src/data/experience.ts` |
| Backend concepts / RAG stages and metrics | `src/data/backend-concepts.ts`, `src/data/rag.ts` |
| Journal articles | `src/content/journal/*.mdx` (each exports a `meta` object) |
| Colour palette | `src/app/globals.css` (`--c-*` tokens), meanings in `src/lib/tone.ts` |

Empty links in `profile.ts` are hidden rather than shown as dead buttons. Put `resume.pdf` in `public/` and set `resume: "/resume.pdf"`. The contact form stays disabled, with a clear note, until `formspreeId` is set.

## Deploy

Deployed on Vercel (`npx vercel deploy --prod`).
