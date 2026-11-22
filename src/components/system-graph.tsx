/**
 * Small architecture graphs for the page headers: raised boxes, with packets
 * travelling along the wires (SVG <animateMotion>, no JavaScript). Colour = kind of component,
 * taken from the selected colour scheme. Static and
 * packet-free for prefers-reduced-motion (globals.css, .system-graph).
 */
type Tone = 1 | 2 | 3 | 4 | 5;
type Node = [x: number, y: number, label: string, tone: Tone];
type Graph = { label: string; nodes: Record<string, Node>; edges: [string, string][] };

// 1 entry · 2 service · 3 data · 4 AI · 5 async — values in globals.css (.system-graph)
const TONE: Record<Tone, string> = { 1: "var(--sg-1)", 2: "var(--sg-2)", 3: "var(--sg-3)", 4: "var(--sg-4)", 5: "var(--sg-5)" };

export const GRAPHS = {
  about: {
    label: "An agent loop: a goal goes to a planner, which calls search, code and SQL tools, observes the results, checks memory and guardrails, then replies.",
    nodes: {
      you: [60, 170, "goal", 1], planner: [185, 170, "planner", 4],
      search: [320, 70, "search", 2], code: [320, 170, "code", 2], sql: [320, 270, "sql", 3],
      observe: [450, 170, "observe", 4], memory: [450, 70, "memory", 3],
      guard: [450, 270, "guardrails", 5], reply: [560, 270, "reply", 1],
    },
    edges: [["you", "planner"], ["planner", "search"], ["planner", "code"], ["planner", "sql"], ["search", "observe"], ["code", "observe"], ["sql", "observe"], ["observe", "memory"], ["memory", "planner"], ["observe", "guard"], ["guard", "reply"]],
  },
  projects: {
    label: "A delivery pipeline: a commit runs CI with lint, tests and type checks, then builds, deploys a preview and promotes it to production.",
    nodes: {
      commit: [55, 165, "commit", 1], ci: [170, 165, "ci", 2],
      lint: [290, 75, "lint", 3], tests: [290, 165, "tests", 3], types: [290, 255, "types", 3],
      build: [410, 165, "build", 2], preview: [530, 100, "preview", 5], prod: [530, 230, "prod", 1],
    },
    edges: [["commit", "ci"], ["ci", "lint"], ["ci", "tests"], ["ci", "types"], ["lint", "build"], ["tests", "build"], ["types", "build"], ["build", "preview"], ["preview", "prod"]],
  },
  lab: {
    label: "An experiment: a hypothesis splits traffic into two variants, metrics compare them, and the result is kept or dropped.",
    nodes: {
      hyp: [75, 165, "hypothesis", 1], split: [200, 165, "split", 2],
      a: [330, 90, "variant a", 3], b: [330, 240, "variant b", 4],
      metrics: [455, 165, "p95 · cost", 2], keep: [555, 95, "keep", 1], drop: [555, 235, "drop", 5],
    },
    edges: [["hyp", "split"], ["split", "a"], ["split", "b"], ["a", "metrics"], ["b", "metrics"], ["metrics", "keep"], ["metrics", "drop"]],
  },
  articles: {
    label: "A retrieval pipeline: documents are chunked, embedded and stored in a vector database; a question is matched by a retriever and answered by an LLM.",
    nodes: {
      docs: [55, 95, "docs", 1], chunk: [170, 95, "chunk", 2], embed: [290, 95, "embed", 4], vector: [420, 95, "vector db", 3],
      q: [55, 240, "question", 1], retriever: [290, 240, "retriever", 2], llm: [420, 240, "llm", 4], answer: [540, 240, "answer", 1],
    },
    edges: [["docs", "chunk"], ["chunk", "embed"], ["embed", "vector"], ["q", "retriever"], ["vector", "retriever"], ["retriever", "llm"], ["llm", "answer"]],
  },
  experience: {
    label: "An event-driven system: a producer writes to a log, three consumers process events into Postgres and object storage, failures go to a dead-letter queue.",
    nodes: {
      producer: [60, 165, "producer", 1], log: [185, 165, "event log", 5], dlq: [185, 275, "dlq", 5],
      c1: [320, 70, "consumer", 2], c2: [320, 165, "consumer", 2], c3: [320, 260, "consumer", 2],
      pg: [455, 115, "postgres", 3], s3: [455, 260, "object store", 3], api: [560, 115, "api", 2],
    },
    edges: [["producer", "log"], ["log", "dlq"], ["log", "c1"], ["log", "c2"], ["log", "c3"], ["c1", "pg"], ["c2", "pg"], ["c3", "s3"], ["pg", "api"]],
  },
  system: {
    label: "A client request through a gateway to auth and the API, which uses Redis, Postgres, a vector database with an LLM, and a queue drained by a worker.",
    nodes: {
      client: [60, 180, "client", 1], gateway: [175, 180, "gateway", 2], auth: [295, 60, "auth", 2], api: [295, 180, "api", 2],
      queue: [295, 300, "queue", 5], redis: [420, 60, "redis", 3], postgres: [420, 140, "postgres", 3],
      vector: [420, 225, "vector db", 4], worker: [420, 300, "worker", 5], llm: [540, 225, "llm", 4],
    },
    edges: [["client", "gateway"], ["gateway", "auth"], ["gateway", "api"], ["api", "redis"], ["api", "postgres"], ["api", "vector"], ["vector", "llm"], ["api", "queue"], ["queue", "worker"], ["worker", "postgres"]],
  },
} satisfies Record<string, Graph>;

export function SystemGraph({ name }: { name: keyof typeof GRAPHS }) {
  const g: Graph = GRAPHS[name];
  return (
    <figure className="system-graph" aria-label={g.label}>
      <div className="sg-plane">
        <svg viewBox="0 0 600 340" role="img" aria-hidden>
          {g.edges.map(([a, b], i) => {
            const [ax, ay] = g.nodes[a], [bx, by, , t] = g.nodes[b];
            const d = `M${ax} ${ay} L${bx} ${by}`;
            const motion = <animateMotion dur={`${2.4 + (i % 4) * 0.5}s`} begin={`-${((i * 0.37) % 2).toFixed(2)}s`} repeatCount="indefinite" path={d} />;
            return (
              <g key={`${a}-${b}`}>
                <path d={d} fill="none" stroke={TONE[t]} strokeOpacity={0.3} strokeWidth={1.2} />
                <g className="sg-packet">
                  <circle r={7} fill={TONE[t]} fillOpacity={0.22}>{motion}</circle>
                  <circle r={2.6} fill={TONE[t]}>{motion}</circle>
                </g>
              </g>
            );
          })}
          {Object.entries(g.nodes).map(([id, [x, y, label, t]]) => {
            const w = label.length * 9.2 + 30;
            return (
              <g key={id}>
                {/* extruded side, then the face: reads as a raised block */}
                <rect x={x - w / 2 + 3} y={y - 13} width={w} height={34} rx={7} fill={TONE[t]} fillOpacity={0.28} />
                <rect x={x - w / 2} y={y - 17} width={w} height={34} rx={7} fill="var(--card)" stroke={TONE[t]} strokeOpacity={0.8} strokeWidth={1.2} />
                <text x={x} y={y + 5} textAnchor="middle" className="sg-label" fill={TONE[t]}>{label}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </figure>
  );
}
