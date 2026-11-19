import { requireAdmin } from "@/lib/auth";
import { parseResume, resumeKey, resumeToTex, type StoredResume } from "@/lib/resume";

/** The saved resume as a .tex file in Jake's Resume structure, to compile on Overleaf. */
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ param: string }> }) {
  const { supabase } = await requireAdmin();
  const { param } = await params;
  const key = resumeKey(param);
  if (!key) return new Response("Not found", { status: 404 });
  const { data, error } = await supabase.from("private_config").select("value").eq("key", key).maybeSingle();
  if (error) return new Response("Couldn't read the resume.", { status: 500 });
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(resumeToTex(parseResume((data.value as StoredResume).text)), {
    headers: {
      "content-type": "application/x-tex; charset=utf-8",
      "content-disposition": `attachment; filename="resume-${param.replace(/\W/g, "")}.tex"`,
      "cache-control": "no-store",
    },
  });
}
