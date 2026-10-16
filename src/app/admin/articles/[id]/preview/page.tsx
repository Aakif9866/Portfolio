import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { Markdown } from "@/components/markdown";
import { StateChip } from "../../../ui";
import type { Article } from "@/lib/types";

/** Admin-only preview of an article, read with the admin's own session. */
export default async function ArticlePreview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("articles").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const a = data as Article;

  return (
    <div className="space-y-6">
      <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13.5px] text-amber-800 dark:text-amber-200">
        <span className="inline-flex items-center gap-2">Preview — only you can see this page. <StateChip state={a.state} /></span>
        <Link href="/admin/articles" className="font-medium underline underline-offset-2">Back to articles</Link>
      </div>
      <article className="card mx-auto max-w-3xl rounded-2xl p-6 sm:p-10">
        <h1 className="text-[clamp(28px,4vw,40px)] font-semibold leading-tight tracking-tightest">{a.title}</h1>
        {a.dek && <p className="mt-4 text-[17px] leading-relaxed text-muted">{a.dek}</p>}
        <div className="mt-8 border-t border-line pt-8">
          {a.body_md ? <Markdown>{a.body_md}</Markdown> : <p className="text-[14px] text-muted">This article has no body yet.</p>}
        </div>
      </article>
    </div>
  );
}
