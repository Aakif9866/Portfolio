/**
 * The hero's moving picture: how this site actually serves a page, drawn as a small
 * pipeline (visitor → cache → server → Postgres + RLS) with a request travelling down and
 * the response coming back up. Pure SVG + CSS (no JavaScript); only transforms and
 * opacity animate, so it's cheap to draw. Static for prefers-reduced-motion.
 */
const NODES = [
  { title: "visitor", sub: "GET /projects" },
  { title: "edge cache", sub: "static · refreshed every 5 min" },
  { title: "next.js server", sub: "requireAdmin() on writes" },
  { title: "postgres", sub: "RLS: published rows only" },
];
const GAP = 92; // vertical distance between node centres
const W = 264;

export function HeroSystem() {
  const h = GAP * (NODES.length - 1) + 56;
  return (
    <figure aria-label="How this site serves a page: visitor, edge cache, Next.js server, Postgres with row-level security" className="hero-system">
      <svg viewBox={`0 0 ${W} ${h}`} width={W} height={h} role="img" aria-hidden>
        <defs>
          {/* userSpaceOnUse: a vertical line has zero width, so a bounding-box gradient would not render */}
          <linearGradient id="hs-line" gradientUnits="userSpaceOnUse" x1="0" y1="28" x2="0" y2={h - 28}>
            <stop offset="0" stopColor="#30d158" />
            <stop offset=".4" stopColor="#40c8e0" />
            <stop offset=".7" stopColor="#64d2ff" />
            <stop offset="1" stopColor="#0a84ff" />
          </linearGradient>
          <radialGradient id="hs-req"><stop offset="0" stopColor="#fff" /><stop offset=".35" stopColor="#30d158" /><stop offset="1" stopColor="#30d158" stopOpacity="0" /></radialGradient>
          <radialGradient id="hs-res"><stop offset="0" stopColor="#fff" /><stop offset=".35" stopColor="#64d2ff" /><stop offset="1" stopColor="#64d2ff" stopOpacity="0" /></radialGradient>
        </defs>
        {/* the wire */}
        <line x1="22" y1="28" x2="22" y2={h - 28} stroke="url(#hs-line)" strokeWidth="1.5" strokeOpacity=".55" />
        {NODES.map((n, i) => (
          <g key={n.title} transform={`translate(0 ${i * GAP})`}>
            <circle className="hs-node" style={{ animationDelay: `${i * 0.54}s` }} cx="22" cy="28" r="6" />
            <text x="42" y="25" className="hs-title">{n.title}</text>
            <text x="42" y="43" className="hs-sub">{n.sub}</text>
          </g>
        ))}
        {/* request travels down, response travels back up */}
        <g className="hs-pulse hs-down"><circle cx="22" cy="28" r="9" fill="url(#hs-req)" /></g>
        <g className="hs-pulse hs-up"><circle cx="22" cy={h - 28} r="9" fill="url(#hs-res)" /></g>
      </svg>
    </figure>
  );
}
