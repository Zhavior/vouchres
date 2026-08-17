import React from 'react';
import { Plus, Sparkles, Star, TrendingUp, Zap } from 'lucide-react';
import {
  AuroraMaxPanel,
  AuroraMaxScoreBadge,
  AuroraMaxTruthBadge,
} from '../../../components/aurora-max/AuroraMaxPrimitives';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../lib/teamLogos';
import { selectSpotlight, type SpotlightPick } from '../../hr/engine/signalScore';
import type { HrWatchRow } from '../../hr/types/hrWatch';

const HIGHLIGHT_STYLES: Record<SpotlightPick['key'], { border: string; bg: string; text: string; glow: string }> = {
  top: { border: 'border-amber-400/40', bg: 'bg-amber-400/10', text: 'text-amber-300', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.12)]' },
  power: { border: 'border-orange-400/40', bg: 'bg-orange-400/10', text: 'text-orange-300', glow: 'shadow-[0_0_20px_rgba(249,115,22,0.12)]' },
  matchup: { border: 'border-[var(--aurora-max-emerald)]/40', bg: 'bg-[var(--aurora-max-emerald)]/10', text: 'text-[var(--aurora-max-emerald)]', glow: 'shadow-[0_0_20px_rgba(0,217,160,0.12)]' },
  value: { border: 'border-emerald-400/40', bg: 'bg-emerald-400/10', text: 'text-emerald-300', glow: 'shadow-[0_0_20px_rgba(0,217,160,0.12)]' },
};

export const HrMaxSpotlightDeck = React.memo(function HrMaxSpotlightDeck({
  rows,
  onSelect,
  onAddToSlip,
}: {
  rows: readonly HrWatchRow[];
  onSelect: (row: HrWatchRow) => void;
  onAddToSlip: (row: HrWatchRow) => void;
}) {
  const spotlights = selectSpotlight(rows);
  if (spotlights.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {spotlights.map((pick) => {
        const style = HIGHLIGHT_STYLES[pick.key];
        const { row } = pick;
        const teamLogo = logoByTeamName(row.team);

        // Subscores
        const powerScore = typeof row.hitterPower === 'number' && Number.isFinite(row.hitterPower) ? Math.round(row.hitterPower) : null;
        const pitcherScore = typeof row.pitcherVulnerability === 'number' && Number.isFinite(row.pitcherVulnerability) ? Math.round(row.pitcherVulnerability) : null;
        const parkScore = typeof (row.parkContext ?? row.parkFactor) === 'number' && Number.isFinite(row.parkContext ?? row.parkFactor) ? Math.round((row.parkContext ?? row.parkFactor)!) : null;

        return (
          <AuroraMaxPanel
            key={pick.key}
            className={`group cursor-pointer border ${style.border} ${style.glow} transition-all duration-200 hover:bg-white/[0.03] hover:border-white/30`}
          >
            <div className="p-3" onClick={() => onSelect(row)}>
              {/* Category Header */}
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-2">
                <span className={`flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-[0.14em] ${style.text}`}>
                  <span>{pick.icon}</span>
                  <span>{pick.title}</span>
                </span>
                <span className="font-mono text-[9px] font-bold uppercase text-white/50 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                  {pick.metricLabel}: {pick.metricValue}
                </span>
              </div>

              {/* Player Identity with Headshot */}
              <div className="mt-2.5 flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/40">
                    <PlayerHeadshot name={row.playerName} playerId={row.playerId ? String(row.playerId) : undefined} size={40} />
                  </div>
                  <div className="min-w-0">
                    <AuroraMaxTruthBadge state={row.truthStatus === 'official' ? 'confirmed' : 'projected'}>
                      {row.truthStatus === 'official' ? 'Confirmed' : 'Projected'}
                    </AuroraMaxTruthBadge>
                    <h4 className="mt-0.5 truncate text-xs font-bold text-white group-hover:text-[var(--aurora-max-emerald)] transition-colors">
                      {row.playerName}
                    </h4>
                    <div className="flex items-center gap-1 font-mono text-[9px] text-white/50">
                      {teamLogo && <img src={teamLogo} alt="" className="h-2.5 w-2.5 object-contain" />}
                      <span>{row.team} vs {row.opponent}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <AuroraMaxScoreBadge score={row.hrScore} />
                  <span className="mt-0.5 font-mono text-[8px] font-bold text-white/30">HRPI</span>
                </div>
              </div>

              {/* Mini Layer Bars (Power / Pitcher / Park) */}
              <div className="mt-2.5 grid grid-cols-3 gap-1.5 pt-2 border-t border-white/[0.06] font-mono text-[8px]">
                <div className="flex flex-col">
                  <span className="text-white/40 uppercase">Power</span>
                  <div className="h-1 w-full bg-white/10 rounded overflow-hidden mt-0.5">
                    <div style={{ width: `${powerScore ?? 50}%` }} className="h-full bg-orange-400" />
                  </div>
                  <span className="text-white/70 font-bold mt-0.5 tabular-nums">{powerScore ?? '—'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white/40 uppercase">Matchup</span>
                  <div className="h-1 w-full bg-white/10 rounded overflow-hidden mt-0.5">
                    <div style={{ width: `${pitcherScore ?? 50}%` }} className="h-full bg-[var(--aurora-max-emerald)]" />
                  </div>
                  <span className="text-white/70 font-bold mt-0.5 tabular-nums">{pitcherScore ?? '—'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white/40 uppercase">Park</span>
                  <div className="h-1 w-full bg-white/10 rounded overflow-hidden mt-0.5">
                    <div style={{ width: `${parkScore ?? 50}%` }} className="h-full bg-emerald-400" />
                  </div>
                  <span className="text-white/70 font-bold mt-0.5 tabular-nums">{parkScore ?? '—'}</span>
                </div>
              </div>

              {/* Reasons Snapshot */}
              <p className="mt-2 line-clamp-1 text-[10px] text-white/60">
                {row.reasons[0] || 'High signal alignment'}
              </p>

              {/* Action Button */}
              <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.06] pt-2">
                <span className="font-mono text-[9px] text-white/40">
                  {row.oddsLabel || (row.bookOdds ? `+${row.bookOdds}` : 'Line open')}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToSlip(row);
                  }}
                  title="Add to Parlay Slip"
                  className="inline-flex h-6 items-center gap-1 border border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 px-2 font-mono text-[9px] font-bold uppercase text-[var(--aurora-max-emerald)] transition hover:bg-[var(--aurora-max-emerald)]/25"
                >
                  <Plus className="h-2.5 w-2.5" /> Add Slip
                </button>
              </div>
            </div>
          </AuroraMaxPanel>
        );
      })}
    </div>
  );
});
