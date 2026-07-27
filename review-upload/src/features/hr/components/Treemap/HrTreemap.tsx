import React, { useMemo, useState } from 'react';
import type { HierarchyRectangularNode } from 'd3-hierarchy';
import { Shield, UserRound } from 'lucide-react';
import { useTreemapLayout, type HierarchyDatum } from '../../../../lib/hierarchy/useHierarchyLayout';
import type { HrBuckets } from '../../hooks/useHrBoardViewModel';
import type { HrWatchRow } from '../../types/hrWatch';
import type { HrCardResult } from '../Cards/HrPlayerCard';
import { buildHrTeamMapGroups, flattenHrMapRows, type HrTeamMapGroup } from './hrMapModel';

interface HrTreemapProps {
  buckets: HrBuckets;
  onSelectPlayer: (player: HrWatchRow) => void;
  getHrResult?: (playerId: string | number | null) => HrCardResult;
}

interface HrLeafDatum extends HierarchyDatum {
  row?: HrWatchRow;
  group?: HrTeamMapGroup;
  tier?: string;
}

type MapMode = 'players' | 'teams';

const TIER_COLOR: Record<string, string> = {
  Elite: '#fbbf24',
  Strong: '#34d399',
  Watch: '#60a5fa',
  Sleepers: '#c084fc',
};

const TIER_ORDER: Array<keyof HrBuckets> = ['Elite', 'Strong', 'Watch', 'Sleepers'];
const W = 1200;
const H = 640;

function fitsFullName(name: string, width: number, height: number): boolean {
  return height > 26 && width > name.length * 6.2 + 10;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const HrTreemap: React.FC<HrTreemapProps> = ({ buckets, onSelectPlayer, getHrResult }) => {
  const [mapMode, setMapMode] = useState<MapMode>('players');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const rows = useMemo(() => flattenHrMapRows(buckets), [buckets]);
  const teamGroups = useMemo(() => buildHrTeamMapGroups(rows), [rows]);

  const data = useMemo<HrLeafDatum>(() => {
    if (mapMode === 'teams') {
      return {
        name: 'root',
        children: teamGroups.map((group) => ({
          name: group.team,
          value: Math.max(1, Math.round(group.totalScore)),
          group,
        })),
      };
    }

    return {
      name: 'root',
      children: TIER_ORDER
        .map((tier) => ({
          name: tier,
          children: buckets[tier].map((row) => ({
            name: row.playerName,
            value: Math.max(1, Math.round(row.hrScore)),
            row,
            tier,
          })),
        }))
        .filter((tier) => tier.children.length > 0),
    };
  }, [buckets, mapMode, teamGroups]);

  const root = useTreemapLayout(data, W, H, 4);
  const leaves = root.leaves() as HierarchyRectangularNode<HrLeafDatum>[];
  const hitCount = rows.filter((row) => getHrResult?.(row.playerId) === 'hit').length;
  const noHrCount = rows.filter((row) => getHrResult?.(row.playerId) === 'no-hr').length;
  const activeTeam = teamGroups.find((group) => group.team === selectedTeam) ?? null;
  const resultSummary = hitCount > 0
    ? `${hitCount} verified HR${hitCount === 1 ? '' : 's'}`
    : noHrCount > 0
      ? '0 verified HRs'
      : 'Results pending';

  if (leaves.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-white/[0.06] bg-black/20 py-24 text-sm text-zinc-500">
        No players to map for the current filters.
      </div>
    );
  }

  return (
    <section className="z8-hr-map overflow-hidden rounded-2xl border border-white/[0.08] bg-[#050a0d] shadow-[0_24px_80px_rgba(0,0,0,0.28)]" aria-label="HR signal map">
      <header className="flex flex-col gap-3 border-b border-white/[0.07] bg-white/[0.025] px-4 py-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-400">Visual intelligence</p>
          <h2 className="mt-0.5 text-base font-black uppercase tracking-tight text-white">HR Signal Map</h2>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-black/40 p-1 sm:ml-auto" role="group" aria-label="Map by players or teams">
          <button
            type="button"
            onClick={() => setMapMode('players')}
            aria-pressed={mapMode === 'players'}
            className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-[10px] font-black uppercase tracking-[0.14em] transition-colors ${mapMode === 'players' ? 'bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/30' : 'text-zinc-300 hover:text-white'}`}
          >
            <UserRound size={14} /> Players
          </button>
          <button
            type="button"
            onClick={() => setMapMode('teams')}
            aria-pressed={mapMode === 'teams'}
            className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-[10px] font-black uppercase tracking-[0.14em] transition-colors ${mapMode === 'teams' ? 'bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/30' : 'text-zinc-300 hover:text-white'}`}
          >
            <Shield size={14} /> Teams
          </button>
        </div>

        <div className={`rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] ${hitCount > 0 ? 'border-orange-400/40 bg-orange-400/10 text-orange-200' : 'border-white/[0.09] bg-black/25 text-zinc-300'}`}>
          {resultSummary}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/[0.06] px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-300">
        {mapMode === 'players' ? TIER_ORDER.filter((tier) => buckets[tier].length > 0).map((tier) => (
          <span key={tier} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: TIER_COLOR[tier] }} />
            {tier}
          </span>
        )) : (
          <span>{teamGroups.length} teams on the current board</span>
        )}
        <span className="ml-auto normal-case tracking-normal text-zinc-400">
          {mapMode === 'players' ? 'Tile size = HR score' : 'Tile size = combined team signal strength'}
        </span>
      </div>

      <div className="overflow-x-auto p-2 sm:p-3" aria-label="Scroll horizontally to explore the full map on smaller screens">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="block min-w-[720px]" textRendering="geometricPrecision" role="img" aria-label={mapMode === 'players' ? 'HR candidates mapped by HR score' : 'Teams mapped by combined HR candidate strength'}>
          <defs>
            <filter id="hr-hit-glow" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#fb923c" floodOpacity="0.7" />
            </filter>
            <linearGradient id="hr-hit-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fdba74" />
              <stop offset="48%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#9a3412" />
            </linearGradient>
          </defs>

          {leaves.map((leaf) => {
            const width = leaf.x1 - leaf.x0;
            const height = leaf.y1 - leaf.y0;
            if (width < 1 || height < 1) return null;

            if (mapMode === 'teams' && leaf.data.group) {
              const group = leaf.data.group;
              const hits = group.rows.filter((row) => getHrResult?.(row.playerId) === 'hit');
              const hasHit = hits.length > 0;
              const isSelected = selectedTeam === group.team;
              const canShowDetails = width > 125 && height > 78;

              return (
                <g
                  key={group.team}
                  transform={`translate(${leaf.x0},${leaf.y0})`}
                  onClick={() => setSelectedTeam(group.team)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') setSelectedTeam(group.team);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${group.team}, ${group.rows.length} HR candidates${hasHit ? `, ${hits.length} verified home runs` : ''}`}
                  style={{ cursor: 'pointer', outline: 'none' }}
                >
                  <rect
                    width={width}
                    height={height}
                    rx={8}
                    fill={hasHit ? 'url(#hr-hit-fill)' : '#00f0ff'}
                    fillOpacity={hasHit ? 0.92 : isSelected ? 0.25 : 0.12}
                    stroke={hasHit ? '#ffedd5' : isSelected ? '#67e8f9' : '#22d3ee'}
                    strokeOpacity={hasHit || isSelected ? 0.95 : 0.5}
                    strokeWidth={hasHit ? 4 : isSelected ? 3 : 1.5}
                    filter={hasHit ? 'url(#hr-hit-glow)' : undefined}
                    className={hasHit ? 'z8-hr-map-hit' : undefined}
                  >
                    <title>{group.team} — {group.rows.length} candidates · average HR score {Math.round(group.averageScore)}{hasHit ? ` · ${hits.length} confirmed HR` : ''}</title>
                  </rect>

                  {group.logoUrl && width > 75 && height > 62 ? (
                    <image href={group.logoUrl} x={10} y={10} width={Math.min(48, height * 0.28)} height={Math.min(48, height * 0.28)} preserveAspectRatio="xMidYMid meet" />
                  ) : null}
                  <text className="z8-hr-map__svg-label" x={group.logoUrl && width > 75 && height > 62 ? 68 : 12} y={30} fontSize={Math.min(22, Math.max(13, width / 10))} fontWeight={900} fill="#ffffff">
                    {group.team}
                  </text>
                  {canShowDetails && (
                    <>
                      <text className="z8-hr-map__svg-label" x={12} y={57} fontSize={12} fontWeight={800} fill="#e2e8f0">{group.rows.length} CANDIDATES · AVG {Math.round(group.averageScore)}</text>
                      <text className="z8-hr-map__svg-label" x={12} y={77} fontSize={11} fontWeight={700} fill="#cbd5e1">TOP: {group.topPlayer.playerName.toUpperCase()}</text>
                    </>
                  )}
                  {hasHit && width > 90 && height > 48 && (
                    <g transform={`translate(10,${Math.max(10, height - 40)})`}>
                      <rect width={Math.min(width - 20, 190)} height={29} rx={6} fill="#fff7ed" />
                      <text className="z8-hr-map__badge-text" x={10} y={20} fontSize={13} fontWeight={950} fill="#7c2d12">{hits.length} HOME RUN{hits.length === 1 ? '' : 'S'}</text>
                    </g>
                  )}
                </g>
              );
            }

            const row = leaf.data.row;
            if (!row) return null;
            const tierName = leaf.data.tier ?? (leaf.parent?.data.name as string) ?? '';
            const color = TIER_COLOR[tierName] ?? '#94a3b8';
            const result = getHrResult?.(row.playerId) ?? null;
            const isHit = result === 'hit';
            const showFull = fitsFullName(row.playerName, width, height);
            const showLabel = width > 30 && height > 18;

            return (
              <g key={row.stableId} transform={`translate(${leaf.x0},${leaf.y0})`} onClick={() => onSelectPlayer(row)} style={{ cursor: 'pointer' }}>
                <rect
                  width={width}
                  height={height}
                  rx={6}
                  fill={isHit ? 'url(#hr-hit-fill)' : color}
                  fillOpacity={isHit ? 0.94 : result === 'no-hr' ? 0.09 : 0.16}
                  stroke={isHit ? '#ffedd5' : color}
                  strokeOpacity={isHit ? 1 : result === 'no-hr' ? 0.3 : 0.65}
                  strokeWidth={isHit ? 4 : 1}
                  filter={isHit ? 'url(#hr-hit-glow)' : undefined}
                  className={isHit ? 'z8-hr-map-hit' : undefined}
                >
                  <title>{row.playerName} — {tierName} · HR score {Math.round(row.hrScore)}{isHit ? ' · Confirmed home run' : result === 'no-hr' ? ' · Graded: no HR' : ''}</title>
                </rect>
                {showLabel && (
                  <text className="z8-hr-map__svg-label" x={8} y={19} fontSize={isHit ? 13 : 11} fontWeight={900} fill="#ffffff" style={{ pointerEvents: 'none' }}>
                    {showFull ? row.playerName.toUpperCase() : initialsOf(row.playerName)}
                  </text>
                )}
                {height > 38 && width > 34 && (
                  <text className="z8-hr-map__svg-label" x={8} y={isHit && height > 72 ? 39 : height - 10} fontSize={10} fontWeight={800} fill={isHit ? '#fff7ed' : '#d1d5db'} style={{ pointerEvents: 'none' }}>
                    HR SCORE {Math.round(row.hrScore)}
                  </text>
                )}
                {isHit && width > 74 && height > 58 && (
                  <g transform={`translate(8,${Math.max(8, height - 38)})`} style={{ pointerEvents: 'none' }}>
                    <rect width={Math.min(width - 16, 150)} height={28} rx={6} fill="#fff7ed" />
                    <text className="z8-hr-map__badge-text" x={10} y={19} fontSize={12} fontWeight={950} fill="#7c2d12">HOME RUN</text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {mapMode === 'teams' && activeTeam && (
        <div className="border-t border-white/[0.07] bg-white/[0.02] px-4 py-4">
          <div className="mb-3 flex items-center gap-3">
            {activeTeam.logoUrl ? <img src={activeTeam.logoUrl} alt="" className="h-9 w-9 object-contain" /> : null}
            <div>
              <p className="text-sm font-black uppercase text-white">{activeTeam.team} HR candidates</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-300">Select a player to open full intelligence</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {activeTeam.rows.map((row) => {
              const isHit = getHrResult?.(row.playerId) === 'hit';
              return (
                <button
                  key={row.stableId}
                  type="button"
                  onClick={() => onSelectPlayer(row)}
                  className={`flex min-h-14 items-center gap-3 rounded-xl border px-3 text-left transition-colors ${isHit ? 'border-orange-300/60 bg-orange-400/15 hover:bg-orange-400/20' : 'border-white/[0.07] bg-black/25 hover:border-cyan-400/35 hover:bg-cyan-400/[0.06]'}`}
                >
                  {row.headshotUrl ? <img src={row.headshotUrl} alt="" className="h-11 w-11 rounded-lg bg-white/[0.04] object-contain object-center" /> : null}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-black uppercase text-white">{row.playerName}</span>
                    <span className="mt-1 block text-[9px] font-black uppercase tracking-[0.12em] text-zinc-300">HR score {Math.round(row.hrScore)}</span>
                  </span>
                  {isHit ? <span className="rounded-md bg-orange-100 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-orange-900">Home run</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default HrTreemap;
