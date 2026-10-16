import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { CaseStudyView, loadCaseStudy } from "@/components/case-study";
import { StateChip } from "../../../ui";

/**
 * Admin-only preview: the case study exactly as visitors will see it once
 * published (published sections only), loaded with the admin's own session so
 * a draft never becomes publicly reachable. Not cached, not in the sitemap.
 */
export default async function ProjectPreview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const data = await loadCaseStudy(supabase, { id, publishedOnly: false });
  if (!data) notFound();

  return (
    <div className="space-y-4">
      <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13.5px] text-amber-800 dark:text-amber-200">
        <span className="inline-flex flex-wrap items-center gap-2">
          Preview — only you can see this page. <StateChip state={data.project.state} />
          <span>Draft sections are not shown, as on the live site.</span>
        </span>
        <Link href={`/admin/projects/${id}?tab=publishing`} className="font-medium underline underline-offset-2">Back to publishing</Link>
      </div>
      <div className="-mx-5 overflow-hidden rounded-2xl border border-line [&_header]:pt-12">
        <CaseStudyView data={data} />
      </div>
    </div>
  );
}
