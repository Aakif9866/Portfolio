import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { parseResume, resumeKey, type StoredResume } from "@/lib/resume";
import { WorkspaceError } from "../../../workspace-error";
import { PrintButton } from "../../client";
import { ResumeView } from "../../view";

// The browser uses the page title as the PDF's default file name.
export async function generateMetadata({ params }: { params: Promise<{ param: string }> }): Promise<Metadata> {
  const { param } = await params;
  return { title: { absolute: param === "master" ? "Resume" : `Resume ${param.slice(2, 8)}` } };
}

export default async function PrintResume({ params }: { params: Promise<{ param: string }> }) {
  const { supabase } = await requireAdmin();
  const { param } = await params;
  const key = resumeKey(param);
  if (!key) notFound();
  const { data, error } = await supabase.from("private_config").select("value").eq("key", key).maybeSingle();
  if (error) return <WorkspaceError error={error} />;
  if (!data) notFound();
  return (
    <>
      <PrintButton />
      <div className="overflow-auto rounded-xl border border-line print:overflow-visible print:rounded-none print:border-0">
        <ResumeView doc={parseResume((data.value as StoredResume).text)} />
      </div>
    </>
  );
}
