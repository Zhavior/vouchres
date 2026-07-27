import React, { useMemo } from 'react';
import type { HierarchyCircularNode } from 'd3-hierarchy';
import { usePackLayout, type HierarchyDatum } from '../../lib/hierarchy/useHierarchyLayout';
import type { Vouch } from '../../types';

interface VouchPackProps {
  vouches: Vouch[];
  onSelectVouch?: (vouch: Vouch) => void;
}

interface PackDatum extends HierarchyDatum {
  vouch?: Vouch;
  depth1?: boolean;
}

const STATUS_COLOR: Record<Vouch['status'], string> = {
  PENDING: '#00F0FF',
  WON: '#00FF94',
  LOST: '#fb7185',
  VOID: 'rgba(255,255,255,0.35)',
};

const W = 760;
const H = 480;

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const VouchPack: React.FC<VouchPackProps> = ({ vouches, onSelectVouch }) => {
  const data = useMemo<PackDatum>(() => {
    const bySport = new Map<string, Map<string, Vouch[]>>();
    for (const v of vouches) {
      const sport = v.sport || 'Other';
      const market = v.market || 'Other';
      if (!bySport.has(sport)) bySport.set(sport, new Map());
      const byMarket = bySport.get(sport)!;
      if (!byMarket.has(market)) byMarket.set(market, []);
      byMarket.get(market)!.push(v);
    }
    return {
      name: 'root',
      children: Array.from(bySport.entries()).map(([sport, byMarket]) => ({
        name: sport,
        depth1: true,
        children: Array.from(byMarket.entries()).map(([market, vs]) => ({
          name: market,
          children: vs.map((v) => ({
            name: v.playerOrTeam || v.gameName,
            value: Math.max(1, (v.vouchedCount ?? 0) + 1),
            vouch: v,
          })),
        })),
      })),
    };
  }, [vouches]);

  const root = usePackLayout(data, W, H, 4);
  const nodes = root.descendants() as HierarchyCircularNode<PackDatum>[];

  if (vouches.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[hsl(var(--ve-border)/0.35)] bg-[hsl(var(--ve-bg-panel)/0.6)] p-3">
      <div className="mb-2 flex flex-wrap items-center gap-3 px-2 text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--ve-text-muted))]">
        <span>Your ledger, grouped by sport → market</span>
        <span className="ml-auto flex items-center gap-3 normal-case tracking-normal">
          {(['PENDING', 'WON', 'LOST', 'VOID'] as const).map((s) => (
            <span key={s} className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[s] }} />
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </span>
          ))}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} role="img" aria-label="Saved vouches, packed by sport and market">
        {nodes.map((node, i) => {
          if (node.depth === 0) return null;
          const d = node.data;
          const isLeaf = !d.children || d.children.length === 0;
          if (!isLeaf) {
            return (
              <circle
                key={i}
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill="none"
                stroke={node.depth === 1 ? 'rgba(0,240,255,0.35)' : 'rgba(255,255,255,0.18)'}
                strokeWidth={node.depth === 1 ? 1.5 : 1}
                strokeDasharray={node.depth === 1 ? undefined : '3 3'}
              />
            );
          }
          const vouch = d.vouch;
          if (!vouch) return null;
          const color = STATUS_COLOR[vouch.status] ?? STATUS_COLOR.PENDING;
          return (
            <g
              key={i}
              transform={`translate(${node.x},${node.y})`}
              onClick={() => onSelectVouch?.(vouch)}
              style={{ cursor: onSelectVouch ? 'pointer' : 'default' }}
            >
              <circle r={node.r} fill={color} fillOpacity={0.22} stroke={color} strokeOpacity={0.7} strokeWidth={1.5}>
                <title>{vouch.playerOrTeam || vouch.gameName} — {vouch.market} · {vouch.status}</title>
              </circle>
              {node.r > 14 && (
                <text textAnchor="middle" dy={4} fontSize={Math.min(11, node.r / 2)} fontWeight={700} fill="#f8fafc" style={{ pointerEvents: 'none' }}>
                  {initialsOf(vouch.playerOrTeam || vouch.gameName)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default VouchPack;
