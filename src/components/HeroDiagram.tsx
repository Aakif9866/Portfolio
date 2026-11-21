// Server-rendered SVG. Packets move with native SMIL <animateMotion>, so this ships zero JS.
// Hidden under prefers-reduced-motion via the .packet class in globals.css.
// Colour = kind: green entry, blue services, amber data stores, violet AI, coral async.
const nodes = {
  client: { x: 50, y: 180, label: "client", c: "green" },
  gateway: { x: 165, y: 180, label: "gateway", c: "blue" },
  auth: { x: 285, y: 60, label: "auth", c: "blue" },
  api: { x: 285, y: 180, label: "api", c: "blue" },
  queue: { x: 285, y: 300, label: "queue", c: "coral" },
  redis: { x: 410, y: 60, label: "redis", c: "amber" },
  postgres: { x: 410, y: 140, label: "postgres", c: "amber" },
  vector: { x: 410, y: 225, label: "vector db", c: "violet" },
  worker: { x: 410, y: 300, label: "worker", c: "coral" },
  llm: { x: 525, y: 225, label: "llm", c: "violet" },
};
type Id = keyof typeof nodes;

const edges: [Id, Id][] = [
  ["client", "gateway"],
  ["gateway", "auth"],
  ["gateway", "api"],
  ["api", "redis"],
  ["api", "postgres"],
  ["api", "vector"],
  ["vector", "llm"],
  ["api", "queue"],
  ["queue", "worker"],
  ["worker", "postgres"],
];

export function HeroDiagram() {
  return (
    <svg
      viewBox="0 0 580 360"
      role="img"
      aria-label="Diagram of a client request flowing through a gateway to auth and API services, which use Redis, Postgres, a vector database with an LLM, and a queue processed by a background worker."
      className="h-auto w-full font-mono"
    >
      {edges.map(([a, b], i) => {
        const d = `M${nodes[a].x} ${nodes[a].y} L${nodes[b].x} ${nodes[b].y}`;
        return (
          <g key={`${a}-${b}`}>
            <path d={d} className="stroke-line" strokeWidth={1} fill="none" />
            <circle r={2.5} className="packet" fill={`var(--c-${nodes[b].c})`}>
              <animateMotion dur={`${2.4 + (i % 4) * 0.5}s`} begin={`-${(i * 0.37) % 2}s`} repeatCount="indefinite" path={d} />
            </circle>
          </g>
        );
      })}
      {Object.entries(nodes).map(([id, n]) => (
        <g key={id}>
          <rect x={n.x - 45} y={n.y - 15} width={90} height={30} rx={6} className="fill-surface" stroke={`var(--c-${n.c})`} strokeOpacity={0.7} />
          <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={11} fill={`var(--c-${n.c})`}>
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
