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
    <div className="min-w-0 flex-1 border-l border-white/[0.08] px-2 text-center font-mono first:border-l-0 first:pl-0">
      <p className="text-[8px] uppercase tracking-wider text-white/40 font-medium">{label}</p>
      <p className={`mt-0.5 text-xs sm:text-sm font-bold tabular-nums font-mono ${present ? tone : 'text-white/30'}`}>
        {present ? Math.round(value as number) : '—'}
      </p>
    </div>
  );
}

/** HRPI gauge badge. */
function Gauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div className="border border-ve-emerald/30 bg-ve-emerald/10 px-2.5 py-1.5 text-center min-w-[56px] rounded-none shrink-0 font-mono">
      <span className="text-lg font-black leading-none tabular-nums text-ve-emerald block">{clamped}</span>
      <span className="text-[7px] font-bold uppercase tracking-wider text-ve-emerald block mt-0.5">HRPI</span>
    </div>
  );
}

export function TodayMobileHero({ rows, onAdd, onOpen }: TodayMobileHeroProps) {
  if (rows.length === 0) return null;

  return (
    <section aria-label="Top research signals" className="md:hidden font-mono">
      <div className="flex items-center justify-between px-4 pb-2">
        <span className="flex items-center gap-1.5 text-[10px] font-mono font-medium uppercase tracking-wider text-white/55">
          <Flame className="h-3 w-3 text-ve-emerald" />
          SPOTLIGHT SIGNALS ({rows.length})
        </span>
        <span className="text-[9px] text-white/40 uppercase font-mono">SWIPE QUEUE →</span>
      </div>

      <div className="tn-scrollbar-none flex snap-x snap-mandatory gap-3 scroll-pl-4 overflow-x-auto px-4 pb-2">
        {rows.map((row) => {
          const blocked = row.truthStatus === 'blocked';
          const parkFactor = row.parkContext ?? row.parkFactor ?? row.parkIndex;

          return (
            <article
              key={row.stableId}
              className="flex w-[calc(100vw-3.5rem)] max-w-[330px] shrink-0 snap-start flex-col justify-between divide-y divide-white/[0.06] border border-white/[0.08] bg-[#0A0A0A] px-3.5 rounded-none"
            >
              {/* Header: Player info & HRPI Gauge */}
              <button
                type="button"
                onClick={() => onOpen(row)}
                className="flex w-full items-center gap-3 py-3 text-left cursor-pointer min-h-[44px]"
                aria-label={`Open deep intel for ${row.playerName}`}
              >
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-none border border-white/10 bg-obsidian-800">
                  <PlayerHeadshot name={row.playerName} size={40} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-z8 text-base font-medium text-white">{row.playerName}</p>
                    {row.truthStatus === 'official' && (
                      <span className="shrink-0 border border-ve-emerald/25 bg-ve-emerald/10 px-1 text-[7px] font-mono font-medium uppercase text-ve-emerald rounded-none">
                        CONFIRMED
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[10px] text-white/55">
                    {row.team} vs {row.opponent}
                  </p>
                  {row.pitcherName && (
                    <p className="mt-0.5 truncate text-[9px] text-white/40">vs {row.pitcherName}</p>
                  )}
                </div>

                <Gauge score={row.hrScore} />
              </button>

              {/* 3-Tier Metric Gauge (Hitter Power, Pitcher Vuln, Park Factor) */}
              <div className="flex py-2.5">
                <StatBadge label="Power" value={row.hitterPower} tone="text-ve-emerald" />
                <StatBadge label="Vuln" value={row.pitcherVulnerability} tone="text-ve-cyan" />
                <StatBadge label="Park" value={parkFactor} tone="text-ve-amber" />
              </div>

              {/* CTA Row with min 44px touch targets */}
              <div className="flex items-center gap-2 py-3">
                <button
                  type="button"
                  disabled={blocked}
                  onClick={() => onAdd(row)}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-2 bg-ve-cyan text-black font-mono text-[11px] font-bold uppercase tracking-[0.18em] hover:bg-white disabled:bg-white/10 disabled:text-white/40 cursor-pointer rounded-none transition-colors"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {blocked ? 'BLOCKED' : 'ADD TO SLIP'}
                </button>
                <span className="shrink-0 flex items-center justify-center rounded-none border border-white/[0.08] bg-white/[0.03] px-3 min-h-[44px] text-xs font-mono font-medium tabular-nums text-white/70">
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
