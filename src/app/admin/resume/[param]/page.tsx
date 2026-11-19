import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { aiConfig } from "@/lib/ai";
import { extractResumeBullets, resumeKey, type StoredResume } from "@/lib/resume";
import { AdminHeader, BTN } from "../../ui";
import { WorkspaceError } from "../../workspace-error";
import { ResumeEditor } from "../client";

export default async function EditResume({ params }: { params: Promise<{ param: string }> }) {
  const { supabase } = await requireAdmin();
  const { param } = await params;
  const key = resumeKey(param);
  if (!key) notFound();

  const [{ data, error }, jobs, logs] = await Promise.all([
    supabase.from("private_config").select("value").eq("key", key).maybeSingle(),
    supabase.from("entries").select("id, title").eq("kind", "job").order("updated_at", { ascending: false }).limit(200),
    supabase.from("entries").select("body_md").eq("kind", "log").ilike("body_md", "%resume bullets%").order("created_at", { ascending: false }).limit(100),
  ]);
  if (error) return <WorkspaceError error={error} />;
  if (!data) notFound();
  const resume = data.value as StoredResume;

  return (
    <div className="space-y-6">
      <AdminHeader title={resume.title} actions={<Link href="/admin/resume" className={BTN.quiet}>All resumes</Link>} />
      <ResumeEditor
        param={param}
        resume={resume}
        jobs={jobs.data ?? []}
        aiEnabled={aiConfig().enabled}
        logBullets={[...new Set((logs.data ?? []).flatMap((l) => extractResumeBullets(l.body_md)))]}
      />
    </div>
  );
}
