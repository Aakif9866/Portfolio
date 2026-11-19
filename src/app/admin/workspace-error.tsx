/** What a workspace view shows when its query fails — including before the migration is applied. */
export function WorkspaceError({ error }: { error: { code?: string; message: string } }) {
  const missing = error.code === "PGRST205" || error.code === "42P01";
  return (
    <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-[13.5px] text-rose-700 dark:text-rose-300">
      {missing ? "The workspace tables don't exist yet: the migration hasn't been applied (docs/maintenance.md §0)." : `Couldn't load entries: ${error.message}`}
    </p>
  );
}

export const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
