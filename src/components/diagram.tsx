"use client";
import { useState } from "react";
import type { Diagram, DiagramNode } from "@/lib/types";

/**
 * Interactive architecture diagram rendered from the JSONB nodes/edges stored
 * on architecture_diagrams. Desktop gets the positioned SVG; narrow screens
 * get the same data as an ordered list, because a 900px canvas is unreadable
 * at 375px and pinch-zoom is not a design.
 */
export function ArchitectureDiagram({ diagram }: { diagram: Diagram }) {
  const [active, setActive] = useState<DiagramNode | null>(null);
  const nodes = diagram.nodes ?? [];
  const edges = diagram.edges ?? [];
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  const W = 900, H = 420, NW = 150, NH = 62;
  const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs, 0), maxX = Math.max(...xs, 1);
  const minY = Math.min(...ys, 0), maxY = Math.max(...ys, 1);
  const px = (x: number) => 40 + ((x - minX) / (maxX - minX || 1)) * (W - 80 - NW);
  const py = (y: number) => 30 + ((y - minY) / (maxY - minY || 1)) * (H - 60 - NH);

  if (nodes.length === 0) return null;

  return (
    <div className="not-prose">
      {diagram.description && <p className="mb-5 text-[14.5px] leading-relaxed text-muted">{diagram.description}</p>}

      {/* desktop canvas */}
      <div className="card hidden overflow-hidden rounded-2xl md:block">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${diagram.title} architecture diagram`}>
          <defs>
            <marker id="arw" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0 0 10 5 0 10z" fill="var(--faint)" />
            </marker>
            <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="var(--line)" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#dots)" />

          {edges.map((e, i) => {
            const a = byId[e.from], b = byId[e.to];
            if (!a || !b) return null;
            const x1 = px(a.x) + NW / 2, y1 = py(a.y) + NH / 2;
            const x2 = px(b.x) + NW / 2, y2 = py(b.y) + NH / 2;
            const lit = active && (active.id === e.from || active.id === e.to);
            return (
              <g key={i} opacity={active && !lit ? 0.18 : 1} style={{ transition: "opacity .25s" }}>
                <path
                  d={`M${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={lit ? "var(--accent)" : "var(--line-strong)"}
                  strokeWidth={lit ? 2 : 1.4}
                  markerEnd="url(#arw)"
                />
                {e.label && (
                  <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 7} textAnchor="middle" className="font-mono" fontSize="10" fill="var(--faint)">
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}

          {nodes.map((n) => {
            const on = active?.id === n.id;
            return (
              <g
                key={n.id}
                transform={`translate(${px(n.x)}, ${py(n.y)})`}
                onMouseEnter={() => setActive(n)}
                onFocus={() => setActive(n)}
                onMouseLeave={() => setActive(null)}
                tabIndex={0}
                role="button"
                aria-label={n.label}
                style={{ cursor: n.explanation ? "pointer" : "default", transition: "opacity .25s" }}
                opacity={active && !on ? 0.4 : 1}
              >
                <rect
                  width={NW} height={NH} rx="12"
                  fill="var(--card)"
                  stroke={on ? "var(--accent)" : "var(--line-strong)"}
                  strokeWidth={on ? 2 : 1}
                />
                <text x={NW / 2} y={26} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--ink)">
                  {n.label}
                </text>
                {n.tech && (
                  <text x={NW / 2} y={44} textAnchor="middle" className="font-mono" fontSize="10" fill="var(--faint)">
                    {n.tech}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div className="flex min-h-[64px] items-center border-t border-line bg-surface px-5 py-3.5">
          <p className="text-[13.5px] leading-relaxed text-muted">
            {active?.explanation ?? (active ? active.label : "Hover or tab through a node to see what it does.")}
          </p>
        </div>
      </div>

      {/* mobile: same data, linear */}
      <ol className="card divide-y divide-line overflow-hidden rounded-2xl md:hidden">
        {nodes.map((n, i) => (
          <li key={n.id} className="p-4">
            <div className="flex items-baseline gap-2.5">
              <span className="font-mono text-[11px] text-faint">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <p className="text-[14.5px] font-medium">{n.label}</p>
                {n.tech && <p className="font-mono text-[11px] text-faint">{n.tech}</p>}
                {n.explanation && <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{n.explanation}</p>}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
