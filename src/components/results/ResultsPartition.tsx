import React, { useMemo } from 'react';
import type { HierarchyRectangularNode } from 'd3-hierarchy';
import { usePartitionLayout, type HierarchyDatum } from '../../lib/hierarchy/useHierarchyLayout';

interface SlipLike {
  status: string;
  totalLegs: number;
}

interface ResultsPartitionProps {
  slips: SlipLike[];
}

interface PartitionDatum extends HierarchyDatum {
  status?: string;
}

const STATUS_ORDER = ['WON', 'LOST', 'PENDING', 'VOID'] as const;

const STATUS_COLOR: Record<string, string> = {
  WON: '#34d399',
  LOST: '#f87171',
  PENDING: '#22d3ee',
  VOID: '#94a3b8',
};

function legTypeLabel(totalLegs: number): string {
  if (totalLegs === 1) return 'Singles';
  if (totalLegs === 2) return 'Doubles';
  if (totalLegs === 3) return 'Triples';
  return '4+ Leg';
}

const W = 460;
const H = 140;

export const ResultsPartition: React.FC<ResultsPartitionProps> = ({ slips }) => {
  const data = useMemo<PartitionDatum>(() => ({
    name: 'root',
    children: STATUS_ORDER
      .map((status) => {
        const statusSlips = slips.filter((s) => s.status === status);
        const byType = new Map<string, number>();
        for (const s of statusSlips) {
          const label = legTypeLabel(s.totalLegs);
          byType.set(label, (byType.get(label) ?? 0) + 1);
        }
        return {
          name: status,
          status,
          children: Array.from(byType.entries()).map(([label, count]) => ({
            name: label,
            value: count,
          })),
        };
      })
      .filter((s) => s.children.length > 0),
  }), [slips]);

  const root = usePartitionLayout(data, W, H, 1.5);
  const nodes = root.descendants().filter((n) => n.depth > 0) as HierarchyRectangularNode<PartitionDatum>[];

  if (slips.length === 0) {
    return <p className="text-[11px] text-slate-600">No data yet — build and save parlays to see breakdown.</p>;
  }

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} role="img" aria-label="Saved slips broken down by result and leg count">
        {nodes.map((node, i) => {
          const w = node.x1 - node.x0;
          const h = node.y1 - node.y0;
          if (w < 0.5 || h < 0.5) return null;
          const status = node.depth === 1 ? node.data.status! : (node.parent?.data.status ?? '');
          const color = STATUS_COLOR[status] ?? '#64748b';
          const isStatusRow = node.depth === 1;
          const showLabel = w > 26 && h > 12;
          return (
            <g key={i} transform={`translate(${node.x0},${node.y0})`}>
              <rect
                width={w}
                height={h}
                rx={2}
                fill={color}
                fillOpacity={isStatusRow ? 0.28 : 0.14}
                stroke={color}
                strokeOpacity={0.55}
                strokeWidth={1}
              >
                <title>{node.data.name} — {node.value} slip{node.value !== 1 ? 's' : ''}</title>
              </rect>
              {showLabel && (
                <text x={4} y={h / 2 + 3} fontSize={isStatusRow ? 10 : 9} fontWeight={isStatusRow ? 700 : 500} fill="#f1f5f9" style={{ pointerEvents: 'none' }}>
                  {node.data.name} {isStatusRow ? '' : `(${node.value})`}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
        {STATUS_ORDER.filter((s) => slips.some((slip) => slip.status === s)).map((s) => (
          <span key={s} className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm" style={{ background: STATUS_COLOR[s] }} />
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ResultsPartition;
