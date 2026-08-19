import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { HrWatchRow } from '../../../hr/types/hrWatch';
import { shortOdds } from './oddsLabel';

interface TodayMobileHeroProps {
  rows: readonly HrWatchRow[];
  onAdd: (row: HrWatchRow) => void;
  onOpen: (row: HrWatchRow) => void;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Headshots 404 for some players; a bare <img> then paints an empty disc. */
function Portrait({ row }: { row: HrWatchRow }) {
  const [failed, setFailed] = useState(false);
  if (!row.headshotUrl || failed) {
    return (
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/[0.06] font-mono text-[13px] font-black text-white/45">
        {initials(row.playerName)}
      </span>
    );
  }
  return (
    <img
      src={row.headshotUrl}
      alt=""
      onError={() => setFailed(true)}
      className="h-12 w-12 shrink-0 rounded-full bg-white/5 object-cover"
      loading="lazy"
    />
  );
}

/** 0–100 layer sub-score. Renders "—" rather than 0 when the layer is absent. */
function StatBadge({ label, value }: { label: string; value: number | null | undefined }) {
  const present = value != null && Number.isFinite(value);
  return (
    <div className="min-w-0 flex-1 rounded-lg border border-white/[0.07] bg-black/30 px-2 py-1.5 text-center">
      <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-white/35">{label}</p>
      <p className={`mt-0.5 font-mono text-[13px] font-bold tabular-nums ${present ? 'text-white' : 'text-white/25'}`}>
        {present ? Math.round(value as number) : '—'}
      </p>
    </div>
  );
}

/** HRPI gauge. Conic sweep, so the number and the arc cannot disagree. */
function Gauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div
      className="relative grid h-[58px] w-[58px] shrink-0 place-items-center rounded-full"
      style={{
        background: `conic-gradient(var(--aurora-max-emerald) ${clamped * 3.6}deg, rgba(255,255,255,0.07) ${clamped * 3.6}deg)`,
      }}
      role="img"
      aria-label={`HRPI ${clamped} out of 100`}
    >
      <div className="grid h-[46px] w-[46px] place-items-center rounded-full bg-[var(--aurora-max-obsidian)]">
        <span className="font-mono text-[17px] font-black leading-none tabular-nums text-white">{clamped}</span>
        <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-white/35">HRPI</span>
      </div>
    </div>
  );
}

/*
 * Spotlight as a swipe deck. The desktop desk shows one spotlight at a time
 * behind a selection list; on a phone that is two taps to compare two players,
 * so the top of the board becomes a snap carousel you thumb through instead.
 */
export function TodayMobileHero({ rows, onAdd, onOpen }: TodayMobileHeroProps) {
  if (rows.length === 0) return null;

  return (
    <section aria-label="Top research signals" className="md:hidden">
      <div className="tn-scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
        {rows.map((row) => {
          const blocked = row.truthStatus === 'blocked';
          return (
            <article
              key={row.stableId}
              className="w-[82vw] max-w-[320px] shrink-0 snap-center rounded-xl border border-emerald-900/60 bg-[var(--aurora-max-panel-strong)] p-4"
            >
              <button
                type="button"
                onClick={() => onOpen(row)}
                className="flex w-full items-center gap-3 text-left"
                aria-label={`Open deep intel for ${row.playerName}`}
              >
                <Portrait row={row} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold leading-tight text-white">{row.playerName}</p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-white/45">
                    {row.team} vs {row.opponent}
                  </p>
                  {row.pitcherName && (
                    <p className="mt-0.5 truncate font-mono text-[10px] text-white/30">{row.pitcherName}</p>
                  )}
                </div>

                <Gauge score={row.hrScore} />
              </button>

              <div className="mt-3 flex gap-1.5">
                <StatBadge label="Power" value={row.hitterPower} />
                <StatBadge label="Vuln" value={row.pitcherVulnerability} />
                <StatBadge label="Park" value={row.parkContext ?? row.parkFactor} />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  disabled={blocked}
                  onClick={() => onAdd(row)}
                  className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--aurora-max-emerald)]/45 bg-[var(--aurora-max-emerald)]/15 text-[13px] font-bold text-[var(--aurora-max-emerald)] transition active:bg-[var(--aurora-max-emerald)]/30 disabled:border-white/10 disabled:bg-white/[0.03] disabled:text-white/25"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {blocked ? 'Unavailable' : 'Add to slip'}
                </button>
                <span className="shrink-0 rounded-xl border border-white/10 px-3 py-2.5 font-mono text-[13px] font-bold tabular-nums text-white/70">
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
