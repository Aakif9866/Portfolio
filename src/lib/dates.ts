export const monthYear = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : null;

export const fullDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;
