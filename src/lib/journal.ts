import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import GithubSlugger from "github-slugger";

export type PostMeta = {
  title: string;
  summary: string;
  date: string; // YYYY-MM-DD
  category: string;
  tags: string[];
  placeholder?: boolean;
};
export type Heading = { id: string; text: string; level: 2 | 3 };
export type Post = PostMeta & { slug: string; readingTime: number; headings: Heading[] };

const dir = path.join(process.cwd(), "src/content/journal");

function analyse(raw: string) {
  // Ignore code fences and the `export const meta` block when counting / finding headings.
  const body = raw.replace(/```[\s\S]*?```/g, "").replace(/^export const meta[\s\S]*?\n};?\n/m, "");
  const slugger = new GithubSlugger(); // same slug algorithm rehype-slug uses
  const headings: Heading[] = [];
  for (const m of body.matchAll(/^(#{2,3})\s+(.+)$/gm)) {
    const text = m[2].trim();
    headings.push({ id: slugger.slug(text), text, level: m[1].length as 2 | 3 });
  }
  const words = raw.split(/\s+/).filter(Boolean).length;
  return { headings, readingTime: Math.max(1, Math.round(words / 220)) };
}

export async function getPosts(): Promise<Post[]> {
  "use cache";
  const files = (await readdir(dir)).filter((f) => f.endsWith(".mdx"));
  const posts = await Promise.all(
    files.map(async (file) => {
      const slug = file.replace(/\.mdx$/, "");
      const [{ meta }, raw] = await Promise.all([
        import(`@/content/journal/${slug}.mdx`) as Promise<{ meta: PostMeta }>,
        readFile(path.join(dir, file), "utf8"),
      ]);
      return { ...meta, slug, ...analyse(raw) };
    }),
  );
  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPost(slug: string) {
  return (await getPosts()).find((p) => p.slug === slug);
}

export function relatedPosts(post: Post, all: Post[], n = 3) {
  const score = (p: Post) => (p.category === post.category ? 2 : 0) + p.tags.filter((t) => post.tags.includes(t)).length;
  return all
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({ p, s: score(p) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((x) => x.p);
}

export const journalCategories = [
  "Backend Engineering",
  "System Design",
  "AI Engineering",
  "RAG Architectures",
  "Machine Learning",
  "Database Internals",
  "Distributed Systems",
  "C++ & Rust",
  "Experiments",
];
