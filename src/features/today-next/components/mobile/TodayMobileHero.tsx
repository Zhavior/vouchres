import React, { useState } from 'react';
import { Plus, Flame, ArrowUpRight } from 'lucide-react';
import type { HrWatchRow } from '../../../hr/types/hrWatch';
import { shortOdds } from './oddsLabel';
import PlayerHeadshot from '../../../../components/parlays/PlayerHeadshot';

interface TodayMobileHeroProps {
  rows: readonly HrWatchRow[];
  onAdd: (row: HrWatchRow) => void;
  onOpen: (row: HrWatchRow) => void;
}

/** 0–100 layer sub-score badge. */
function StatBadge({ label, value, tone = 'text-white' }: { label: string; value: number | null | undefined; tone?: string }) {
  const present = value != null && Number.isFinite(value);
  return (
    <div className="min-w-0 flex-1 border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-center font-mono rounded">
      <p className="text-[8px] uppercase tracking-wider text-zinc-500 font-medium">{label}</p>
      <p className={`mt-0.5 text-xs sm:text-sm font-bold tabular-nums font-mono ${present ? tone : 'text-zinc-600'}`}>
        {present ? Math.round(value as number) : '—'}
      </p>
    </div>
  );
}

/** HRPI gauge badge. */
function Gauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div className="border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-center min-w-[56px] rounded-lg shrink-0 font-mono">
      <span className="text-lg font-black leading-none tabular-nums text-emerald-400 block">{clamped}</span>
      <span className="text-[7px] font-bold uppercase tracking-wider text-emerald-300 block mt-0.5">HRPI</span>
    </div>
  );
}

export function TodayMobileHero({ rows, onAdd, onOpen }: TodayMobileHeroProps) {
  if (rows.length === 0) return null;

  return (
    <section aria-label="Top research signals" className="md:hidden font-mono">
      <div className="flex items-center justify-between px-4 pb-2">
        <span className="flex items-center gap-1.5 text-[10px] font-mono font-medium uppercase tracking-wider text-zinc-400">
          <Flame className="h-3 w-3 text-emerald-400" />
          SPOTLIGHT SIGNALS ({rows.length})
        </span>
        <span className="text-[9px] text-zinc-500 uppercase font-mono">SWIPE QUEUE →</span>
      </div>

      <div className="tn-scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
        {rows.map((row) => {
          const blocked = row.truthStatus === 'blocked';
          const parkFactor = row.parkContext ?? row.parkFactor ?? row.parkIndex;

          return (
            <article
              key={row.stableId}
              className="w-[85vw] max-w-[340px] shrink-0 snap-center border border-white/[0.08] bg-[#111113] p-4 flex flex-col justify-between space-y-3 rounded-xl shadow-lg"
            >
              {/* Header: Player info & HRPI Gauge */}
              <button
                type="button"
                onClick={() => onOpen(row)}
                className="flex w-full items-center gap-3 text-left cursor-pointer min-h-[44px]"
                aria-label={`Open deep intel for ${row.playerName}`}
              >
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-zinc-900">
                  <PlayerHeadshot name={row.playerName} size={48} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-bold text-[#F4F4F5] font-sans">{row.playerName}</p>
                    {row.truthStatus === 'official' && (
                      <span className="shrink-0 border border-emerald-500/25 bg-emerald-500/10 px-1 text-[7px] font-mono font-medium uppercase text-emerald-400 rounded">
                        CONFIRMED
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[10px] text-zinc-400">
                    {row.team} vs {row.opponent}
                  </p>
                  {row.pitcherName && (
                    <p className="mt-0.5 truncate text-[9px] text-zinc-500">vs {row.pitcherName}</p>
                  )}
                </div>

                <Gauge score={row.hrScore} />
              </button>

              {/* 3-Tier Metric Gauge (Hitter Power, Pitcher Vuln, Park Factor) */}
              <div className="flex gap-1.5">
                <StatBadge label="Power" value={row.hitterPower} tone="text-emerald-400" />
                <StatBadge label="Vuln" value={row.pitcherVulnerability} tone="text-sky-400" />
                <StatBadge label="Park" value={parkFactor} tone="text-amber-300" />
              </div>

              {/* CTA Row with min 44px touch targets */}
              <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
                <button
                  type="button"
                  disabled={blocked}
                  onClick={() => onAdd(row)}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 bg-white text-black text-xs font-semibold uppercase hover:bg-zinc-200 active:bg-zinc-300 disabled:border-white/10 disabled:bg-zinc-800 disabled:text-zinc-500 cursor-pointer rounded-lg shadow-sm transition-all"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {blocked ? 'BLOCKED' : 'ADD TO SLIP'}
                </button>
                <span className="shrink-0 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 min-h-[44px] text-xs font-mono font-medium tabular-nums text-zinc-300">
                  {shortOdds(row)}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
