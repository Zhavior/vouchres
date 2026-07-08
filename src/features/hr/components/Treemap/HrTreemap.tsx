import React, { useMemo } from 'react';
import type { HierarchyRectangularNode } from 'd3-hierarchy';
import { useTreemapLayout, type HierarchyDatum } from '../../../../lib/hierarchy/useHierarchyLayout';
import type { HrBuckets } from '../../hooks/useHrBoardViewModel';
import type { HrWatchRow } from '../../types/hrWatch';
import type { HrCardResult } from '../Cards/HrPlayerCard';

interface HrTreemapProps {
  buckets: HrBuckets;
  onSelectPlayer: (player: HrWatchRow) => void;
  getHrResult?: (playerId: string | number | null) => HrCardResult;
}

interface HrLeafDatum extends HierarchyDatum {
  row?: HrWatchRow;
}

const TIER_COLOR: Record<string, string> = {
  Elite: '#fbbf24',
  Strong: '#34d399',
  Watch: '#60a5fa',
  Sleepers: '#c084fc',
};

const TIER_ORDER: Array<keyof HrBuckets> = ['Elite', 'Strong', 'Watch', 'Sleepers'];

const W = 1200;
const H = 640;

function fitsFullName(name: string, w: number, h: number): boolean {
  return h > 26 && w > name.length * 6.2 + 10;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const HrTreemap: React.FC<HrTreemapProps> = ({ buckets, onSelectPlayer, getHrResult }) => {
  const data = useMemo<HrLeafDatum>(() => ({
    name: 'root',
    children: TIER_ORDER
      .map((tier) => ({
        name: tier,
        children: buckets[tier].map((row) => ({
          name: row.playerName,
          value: Math.max(1, Math.round(row.hrScore)),
          row,
        })),
      }))
      .filter((tier) => tier.children.length > 0),
  }), [buckets]);

  const root = useTreemapLayout(data, W, H, 3);
  const leaves = root.leaves() as HierarchyRectangularNode<HrLeafDatum>[];

  if (leaves.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-white/[0.06] bg-black/20 py-24 text-sm text-zinc-500">
        No players to map for the current filters.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-2">
      <div className="mb-2 flex flex-wrap items-center gap-3 px-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
        {TIER_ORDER.filter((t) => buckets[t].length > 0).map((tier) => (
          <span key={tier} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: TIER_COLOR[tier] }} />
            {tier}
          </span>
        ))}
        <span className="ml-auto normal-case tracking-normal text-zinc-600">Tile size = HR score</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} role="img" aria-label="HR candidates treemap, sized by HR score">
        {leaves.map((leaf) => {
          const w = leaf.x1 - leaf.x0;
          const h = leaf.y1 - leaf.y0;
          const row = leaf.data.row;
          if (!row || w < 1 || h < 1) return null;
          const tierName = (leaf.parent?.data.name as string) ?? '';
          const color = TIER_COLOR[tierName] ?? '#94a3b8';
          const result = getHrResult?.(row.playerId) ?? null;
          const showFull = fitsFullName(row.playerName, w, h);
          const showLabel = w > 30 && h > 18;
          return (
            <g
              key={row.stableId}
              transform={`translate(${leaf.x0},${leaf.y0})`}
              onClick={() => onSelectPlayer(row)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                width={w}
                height={h}
                rx={4}
                fill={color}
                fillOpacity={result === 'hit' ? 0.55 : 0.16}
                stroke={color}
                strokeOpacity={0.65}
                strokeWidth={1}
              >
                <title>
                  {row.playerName} — {tierName} · HR score {Math.round(row.hrScore)}
                  {result === 'hit' ? ' · Confirmed HR' : result === 'no-hr' ? ' · Graded: no HR' : ''}
                </title>
              </rect>
              {showLabel && (
                <text x={6} y={16} fontSize={11} fontWeight={700} fill="#f8fafc" style={{ pointerEvents: 'none' }}>
                  {showFull ? row.playerName : initialsOf(row.playerName)}
                </text>
              )}
              {h > 34 && w > 34 && (
                <text x={6} y={h - 8} fontSize={10} fill="rgba(255,255,255,0.65)" style={{ pointerEvents: 'none' }}>
                  {Math.round(row.hrScore)}{result === 'hit' ? ' 💥' : ''}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default HrTreemap;
