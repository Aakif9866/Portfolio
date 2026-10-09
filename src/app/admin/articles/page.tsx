import { requireAdmin } from "@/lib/auth";
import { saveArticle } from "../actions";
import { NewRowPanel, RowActions, StateChip, type Field } from "../ui";
import { Revisions } from "./revisions";
import type { Article } from "@/lib/types";

const FIELDS: Field[] = [
  { name: "title", label: "Title", type: "text" },
  { name: "slug", label: "Slug", type: "text" },
  { name: "difficulty", label: "Difficulty", type: "select", options: ["intro", "working", "deep"] },
  { name: "reading_minutes", label: "Reading minutes", type: "number" },
  { name: "tested_with", label: "Tested with", type: "text", },
  { name: "last_reviewed_at", label: "Last reviewed", type: "date" },
  { name: "position", label: "Position", type: "number" },
  { name: "dek", label: "Standfirst", type: "textarea", rows: 2 },
  { name: "body_md", label: "Body", type: "markdown", rows: 18, hint: "markdown — every save snapshots the previous body" },
];

export default async function AdminArticles() {
  const { supabase } = await requireAdmin();
  const [{ data: articleRows }, { data: revRows }] = await Promise.all([
    supabase.from("articles").select("*").order("position"),
    supabase.from("article_revisions").select("id,article_id,title,created_at").order("created_at", { ascending: false }),
  ]);

  const articles = (articleRows ?? []) as Article[];
  const revisions = (revRows ?? []) as { id: string; article_id: string; title: string; created_at: string }[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">Articles</h1>
        <p className="mt-1.5 text-[13.5px] text-muted">
          {articles.length} articles, {revisions.length} stored revisions. Every save writes the
          previous body to <span className="font-mono">article_revisions</span> first, so an edit is
          always recoverable.
        </p>
      </div>

      <NewRowPanel table="articles" fields={FIELDS} action={saveArticle} label="New article" />

      {articles.length === 0 && (
        <p className="card rounded-2xl px-6 py-10 text-center text-[13.5px] text-muted">
          No articles yet. /articles shows an honest empty state until one is published.
        </p>
      )}

      <ul className="space-y-3">
        {articles.map((a) => {
          const mine = revisions.filter((r) => r.article_id === a.id);
          return (
            <li key={a.id} className="card rounded-2xl p-5">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-semibold">{a.title}</h2>
                <StateChip state={a.state} />
              </div>
              <p className="mt-1 font-mono text-[11.5px] text-faint">
                /articles/{a.slug} · pos {a.position}
                {a.difficulty && ` · ${a.difficulty}`}
                {mine.length > 0 && ` · ${mine.length} revisions`}
              </p>
              {a.dek && <p className="mt-2.5 line-clamp-2 text-[13.5px] leading-relaxed text-muted">{a.dek}</p>}
              <div className="mt-4 space-y-3 border-t border-line pt-3.5">
                <RowActions table="articles" row={a as unknown as Record<string, unknown>} fields={FIELDS} action={saveArticle} />
                {mine.length > 0 && <Revisions articleId={a.id} revisions={mine} />}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
