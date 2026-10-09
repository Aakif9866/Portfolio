/** Six months with no review → flag it rather than quietly serve stale notes. */
export function staleness(lastReviewed: string | null) {
  if (!lastReviewed) return true;
  const months = (Date.now() - new Date(lastReviewed).getTime()) / 2.592e9;
  return months > 6;
}

export const monthYear = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : null;

export const fullDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;
