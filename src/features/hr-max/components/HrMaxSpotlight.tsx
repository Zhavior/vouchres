import React from 'react';
import { Clock3, Flame, Plus, Radio, ShieldAlert, Sparkles, Star, TrendingUp, Zap } from 'lucide-react';
import {
  AuroraMaxEvidenceLadder,
  AuroraMaxPanel,
  AuroraMaxScoreBadge,
  AuroraMaxTruthBadge,
} from '../../../components/aurora-max/AuroraMaxPrimitives';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../lib/teamLogos';
import type { HrMaxDeskRow } from '../mapHrWatchToDesk';
import { deskMatchupLine } from '../presentHrMaxTicket';
import { HrMaxRadarHUD } from './HrMaxRadarHUD';

export interface HrMaxSpotlightProps {
  row: HrMaxDeskRow;
  saved: boolean;
  onToggleSaved: () => void;
  onAddToSlip?: (row: HrMaxDeskRow) => void;
}

export function HrMaxSpotlight({
  row,
  saved,
  onToggleSaved,
  onAddToSlip,
}: HrMaxSpotlightProps) {
  const teamLogo = logoByTeamName(row.team);
  const oppLogo = logoByTeamName(row.opponent);

  // Recent Form / Home Run streaks from verified game logs
  const recentHrs = row.raw.recentHomeRuns;
  const recentGames = row.raw.recentGamesChecked ?? 5;

  return (
    <AuroraMaxPanel className="hr-max-spotlight" ariaLabel="Primary research signal">
      <div className="hr-max-spotlight__grid" aria-hidden="true" />
      
      {/* Spotlight Header Bar */}
      <div className="hr-max-spotlight__bar">
        <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--aurora-max-emerald)]">
          <Radio className="h-3 w-3 animate-pulse" aria-hidden="true" /> Tactical Intelligence Dossier
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-white/35">
          <Clock3 className="h-3 w-3" aria-hidden="true" /> {row.receipt.updated}
        </span>
      </div>

      <div className="hr-max-spotlight__body">
        {/* Left Column: Player Identity, Read, Matchup & EV HUD */}
        <div className="hr-max-spotlight__player">
          {/* Identity Row */}
          <div className="hr-max-spotlight__identity">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/15 bg-black/50 shadow-md">
                <PlayerHeadshot name={row.playerName} playerId={row.player.id} size={48} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <AuroraMaxTruthBadge state={row.truthState}>
                    {row.confirmed ? 'Confirmed' : row.lineupLabel}
                  </AuroraMaxTruthBadge>
                  {row.displayTier && (
                    <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--aurora-max-emerald)]">
                      {row.displayTier} Tier
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate mt-0.5">
                  {row.playerName}
                </h2>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-white/60 mt-0.5">
                  {teamLogo && <img src={teamLogo} alt="" className="h-3 w-3 object-contain" />}
                  <span>{row.team} vs {row.opponent}</span>
                  {oppLogo && <img src={oppLogo} alt="" className="h-3 w-3 object-contain" />}
                  <span>· {row.gameTimeLabel}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <AuroraMaxScoreBadge score={row.score} />
              <span className="mt-1 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-white/35">
                HRPI INDEX
              </span>
            </div>
          </div>

          {/* Core Signal Readout */}
          <div className="hr-max-spotlight__read">
            <p className="font-semibold text-white/90 text-xs leading-relaxed">{row.read}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px]">
              <span className="flex items-center gap-1 text-[var(--aurora-max-emerald)] font-bold">
                <TrendingUp className="h-3 w-3" /> {row.signal}
              </span>
              {row.pitcherName && (
                <span className="text-white/60">
                  vs <strong className="text-white/80">{row.pitcherName}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Tactical Matchup & EV Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-white/10 bg-black/30 p-2.5 rounded-lg font-mono text-xs">
            {/* Book Odds & EV */}
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-white/40">Market Odds</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-sm font-bold text-white tabular-nums">
                  {row.bookOddsLabel || '—'}
                </span>
                {row.evEdge != null && (
                  <span className={`text-[10px] font-bold tabular-nums ${row.evEdge > 0 ? 'text-[var(--aurora-max-emerald)]' : 'text-white/40'}`}>
                    {row.evEdge > 0 ? `+${row.evEdge}% EV` : `${row.evEdge}% EV`}
                  </span>
                )}
              </div>
            </div>

            {/* Model Probability */}
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-white/40">Model HR Prob</span>
              <span className="text-sm font-bold text-[var(--aurora-max-emerald)] tabular-nums mt-0.5">
                {row.hrProbability != null ? `${(row.hrProbability * 100).toFixed(1)}%` : '—'}
              </span>
            </div>

            {/* Verified Recent Form */}
            <div className="flex flex-col col-span-2 sm:col-span-1">
              <span className="text-[9px] uppercase tracking-wider text-white/40">Recent Form</span>
              <div className="flex items-center gap-1 mt-1">
                {recentHrs != null ? (
                  <span className="text-[11px] font-bold text-white flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-[var(--aurora-max-emerald)] animate-pulse" />
                    {recentHrs} HR in {recentGames}G
                  </span>
                ) : (
                  <span className="text-[11px] text-white/40">Log pending</span>
                )}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
            <p className="text-[10px] text-white/40 truncate">
              {row.evidenceConfidence} · research signal, not a guarantee.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onToggleSaved}
                aria-pressed={saved}
                aria-label={saved ? `Remove ${row.playerName} from My List` : `Add ${row.playerName} to My List`}
                title={saved ? 'Remove from My List' : 'Add to My List'}
                className={`grid h-9 w-9 place-items-center border transition ${
                  saved
                    ? 'border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 text-[var(--aurora-max-emerald)]'
                    : 'border-white/10 text-white/40 hover:text-white'
                }`}
              >
                <Star className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
              </button>
              {onAddToSlip && (
                <button
                  type="button"
                  onClick={() => onAddToSlip(row)}
                  title="Add to Parlay Slip"
                  className="inline-flex h-9 items-center gap-1.5 border border-[var(--aurora-max-emerald)]/50 bg-[var(--aurora-max-emerald)]/15 px-3 font-mono text-xs font-bold uppercase text-[var(--aurora-max-emerald)] transition hover:bg-[var(--aurora-max-emerald)]/25 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" /> Add to Slip
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 5-Factor Radar HUD & Evidence Ladder */}
        <div className="hr-max-spotlight__evidence flex flex-col items-center justify-center">
          {/* 5-Axis SVG Radar Matrix */}
          <div className="w-full flex flex-col items-center pb-3 border-b border-white/10">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mb-1">
              5-Factor Tactical Matrix
            </span>
            <HrMaxRadarHUD row={row.raw} size={230} />
          </div>

          {/* Evidence Ladder Breakdown */}
          <div className="w-full mt-3">
            <AuroraMaxEvidenceLadder
              meta={<AuroraMaxTruthBadge state={row.truthState}>{row.evidenceConfidence}</AuroraMaxTruthBadge>}
              items={row.evidence}
            />
            <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-white/30 font-mono">
              <span>Source receipt available in queue</span>
              <span className="uppercase tracking-[0.12em]">{row.evidence.length} layers analyzed</span>
            </div>
          </div>
        </div>
      </div>
    </AuroraMaxPanel>
  );
}
