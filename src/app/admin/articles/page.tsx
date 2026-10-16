import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { saveArticle } from "../actions";
import { AdminHeader, BTN, ListFilter, NewRowPanel, RowActions, StateChip } from "../ui";
import { Revisions } from "./revisions";
import { FIELDS } from "@/lib/admin-fields";
import type { Article } from "@/lib/types";

export default async function AdminArticles({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; new?: string }> }) {
  const { q, status, new: isNew } = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: articleRows }, { data: revRows }] = await Promise.all([
    supabase.from("articles").select("*").order("position"),
    supabase.from("article_revisions").select("id,article_id,title,created_at").order("created_at", { ascending: false }),
  ]);

  const all = (articleRows ?? []) as Article[];
  const needle = q?.trim().toLowerCase();
  const articles = all.filter((a) => (!status || a.state === status) && (!needle || a.title.toLowerCase().includes(needle)));
  const revisions = (revRows ?? []) as { id: string; article_id: string; title: string; created_at: string }[];

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Articles"
        description="Technical write-ups shown under Articles. Every save keeps the previous version, so any edit can be undone from Revisions."
      />

      <NewRowPanel table="articles" fields={FIELDS.articles} action={saveArticle} label="Write a new article" defaultOpen={isNew === "1"} />
      <ListFilter q={q} status={status} statuses={["published", "draft", "archived"]} />

      {articles.length === 0 ? (
        <p className="card rounded-2xl px-6 py-10 text-center text-[14px] text-muted">
          {all.length === 0 ? "No articles yet. The public Articles page shows a friendly empty state until one is published." : "No articles match this filter."}
        </p>
      ) : (
        <ul className="space-y-3">
          {articles.map((a) => {
            const mine = revisions.filter((r) => r.article_id === a.id);
            return (
              <li key={a.id} className="card rounded-2xl p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[16px] font-semibold">{a.title}</h2>
                  <StateChip state={a.state} />
                </div>
                {a.dek && <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-muted">{a.dek}</p>}
                <p className="mt-2 text-[13px] text-muted">
                  /articles/{a.slug}{a.reading_minutes ? ` · ${a.reading_minutes} min read` : ""} · {mine.length} saved version{mine.length === 1 ? "" : "s"}
                </p>
                <div className="mt-4 space-y-3 border-t border-line pt-3.5">
                  <RowActions
                    table="articles"
                    row={a as unknown as Record<string, unknown>}
                    fields={FIELDS.articles}
                    action={saveArticle}
                    extra={
                      <>
                        <Link href={`/admin/articles/${a.id}/preview`} className={BTN.quiet}>Preview</Link>
                        {a.state === "published" && <a href={`/articles/${a.slug}`} target="_blank" rel="noopener" className={BTN.quiet}>View live ↗</a>}
                      </>
                    }
                  />
                  {mine.length > 0 && <Revisions articleId={a.id} revisions={mine} />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
