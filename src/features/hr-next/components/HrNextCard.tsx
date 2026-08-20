import React from 'react';
import { Plus, Star, TrendingUp, Search, Flame } from 'lucide-react';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../lib/teamLogos';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import { extractCardData } from '../utils/cardUtils';
import { tierForScore, type HrNextTierDef } from '../utils/tierPartition';
import { HrNextReceiptTray } from './HrNextReceiptTray';
import { useResearchStore } from '../../../stores/useResearchStore';

/** Render a nullable 0–100 layer score without inventing a value for it. */
function layerValue(score: number | null | undefined): string {
  if (typeof score !== 'number' || !Number.isFinite(score)) return 'N/A';
  return String(Math.max(0, Math.min(100, Math.round(score))));
}

export interface HrNextCardProps {
  row: HrWatchRow;
  active: boolean;
  saved: boolean;
  isReceiptOpen: boolean;
  isProMode?: boolean;
  /** HRPI-band tier supplied by the board; derived from the score when absent. */
  tier?: HrNextTierDef;
  compact?: boolean;
  onSelect: (id: string) => void;
  onToggleSaved: (id: string) => void;
  onToggleReceipt?: (id: string) => void;
  onAddToSlip: (row: HrWatchRow) => void;
}

export const HrNextCard = React.memo(function HrNextCard({
  row,
  active,
  saved,
  isReceiptOpen,
  isProMode = false,
  tier,
  compact,
  onSelect,
  onToggleSaved,
  onToggleReceipt,
  onAddToSlip,
}: HrNextCardProps) {
  const teamLogo = logoByTeamName(row.team);
  
  const {
    matchupLabel,
    catalyst,
    pips,
    lineupLabel,
    confirmed,
    score,
    evEdge,
    bookOddsLabel,
    recentHrs,
    pitcherName,
    barrelRate,
    avgExitVelo,
    hardHitRate,
    parkBoostPct,
    handednessLabel,
    hasHitHrToday,
    riskTier,
    receipt,
  } = extractCardData(row);

  const lineupText = confirmed ? 'Confirmed' : lineupLabel;
  const selectedPlayer = useResearchStore((s) => s.selectedPlayer);
  const isDrawerOpen = useResearchStore((s) => s.isDrawerOpen);
  const openDrawer = useResearchStore((s) => s.openDrawer);
  const closeDrawer = useResearchStore((s) => s.closeDrawer);

  const isResearched = isDrawerOpen && String(selectedPlayer?.id) === String(row.playerId || row.stableId);

  const handleToggleResearch = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isResearched) {
      closeDrawer();
    } else {
      openDrawer({ id: row.playerId || row.stableId, name: row.playerName });
    }
  };

  const onTicketActivate = () => {
    onSelect(row.stableId);
    onToggleReceipt?.(row.stableId);
  };

  // HRPI-band tier drives every accent so the card always agrees with the
  // column it sits in. `riskTier` stays available as the pipeline's own label.
  const activeTier = tier ?? tierForScore(row.hrScore);
  const scoreColorClass = activeTier.scoreText;
  const tierBadgeBg = activeTier.badge;
  const tierBorderHover = activeTier.cardHover;

  // Statcast telemetry surfaced directly on the Pro card — no drawer required.
  // Nothing here fabricates a reading: a metric the feed never published prints
  // N/A rather than a value derived from the power layer.
  const platoonSplit = layerValue(row.platoon);
  const exitVeloText = avgExitVelo == null ? 'N/A' : `${avgExitVelo.toFixed(1)} mph`;
  const barrelRateText = barrelRate == null ? 'N/A' : `${barrelRate.toFixed(1)}%`;
  const hardHitText = hardHitRate == null ? 'N/A' : `${hardHitRate}%`;
  const parkBoostText = parkBoostPct == null
    ? 'N/A'
    : `${parkBoostPct > 0 ? '+' : ''}${parkBoostPct}%`;
  const handednessValue = handednessLabel ?? (platoonSplit === 'N/A' ? 'N/A' : platoonSplit);
  const handednessDetail = handednessLabel && platoonSplit !== 'N/A' ? platoonSplit : null;
  const pitchVulnerability = layerValue(row.pitchMix ?? row.pitcherVulnerability);
  const pitchVulnerabilityIsProxy = row.pitchMix == null && row.pitcherVulnerability != null;

  // ─── PRO MODE (Expanded 4-Tier Hero Telemetry Card with HR Intelligence) ───
  if (isProMode) {
    return (
      <div
        className={`hr-next-card group w-full border-2 bg-black font-mono ${
          hasHitHrToday
            ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
            : active
              ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)]'
              : 'border-white/15 hover:border-white/40'
        }`}
        style={{
          contentVisibility: 'auto',
          containIntrinsicSize: 'auto 384px',
        }}
        data-testid={`hr-card-${row.stableId}`}
        data-pro-mode="true"
        data-tier={activeTier.key}
      >
        <div className="flex flex-col gap-2.5 p-3">
          {/* Main Hero Header Row */}
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex min-w-0 items-start gap-2.5">
              {/* Batter hero image */}
              <button
                type="button"
                onClick={onTicketActivate}
                aria-label={`Select ${row.playerName}`}
                className="relative h-[56px] w-[56px] shrink-0 cursor-pointer overflow-hidden border-2 border-white/20 bg-zinc-950 transition-colors group-hover:border-white"
                style={{ aspectRatio: '1 / 1' }}
              >
                <PlayerHeadshot name={row.playerName} playerId={row.playerId?.toString()} size={56} />
                {confirmed && (
                  <span
                    className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-emerald-400 border border-black"
                    title="CONFIRMED LINEUP"
                  />
                )}
              </button>

              {/* Player Info, Badges & Matchup */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3
                    onClick={onTicketActivate}
                    className={`font-mono text-sm sm:text-base font-black leading-tight tracking-tight cursor-pointer hover:underline truncate uppercase ${
                      active ? 'text-cyan-300' : 'text-white'
                    }`}
                  >
                    {row.playerName}
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-300 bg-zinc-950 px-1.5 py-0.5 border border-white/15 flex items-center gap-1">
                    {teamLogo ? (
                      <img src={teamLogo} alt="" width={12} height={12} className="h-3 w-3 shrink-0 object-contain" />
                    ) : null}
                    {row.team}
                  </span>

                  {/* Tier Badge */}
                  <span
                    className="border px-1.5 py-0.5 font-mono text-[9px] font-black uppercase"
                    style={{ color: activeTier.accent, borderColor: `${activeTier.accent}60`, backgroundColor: `${activeTier.accent}15` }}
                  >
                    {activeTier.label.toUpperCase()}
                  </span>

                  {/* HR Intelligence Live & Recent Badges */}
                  {hasHitHrToday && (
                    <span className="inline-flex items-center gap-1 border border-rose-500 bg-rose-950/60 px-1.5 py-0.5 font-mono text-[9px] font-black text-rose-300 uppercase animate-pulse">
                      <Flame className="w-3 h-3 text-rose-400" /> Today HR
                    </span>
                  )}
                  {recentHrs != null && recentHrs > 0 && (
                    <span className="inline-flex items-center gap-1 border border-amber-500/50 bg-amber-950/40 px-1.5 py-0.5 font-mono text-[9px] font-black text-amber-300">
                      <Flame className="w-3 h-3 text-amber-400" /> 7Days HR: {recentHrs}
                    </span>
                  )}
                </div>

                {/* Matchup & Pitcher Line */}
                <p className="mt-1 font-mono text-[11px] text-zinc-400 truncate flex items-center gap-1.5">
                  <span className="text-zinc-500">vs</span>
                  <strong className="text-white font-bold">{pitcherName}</strong>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-400 truncate">{matchupLabel.split('·')[1]?.trim() || matchupLabel}</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-cyan-400 text-[10px] font-black uppercase">{lineupText}</span>
                </p>

                {/* Layer Score Pips */}
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="flex items-center gap-1" aria-label="Power, pitcher, and park layers">
                    {pips.map((pip) => (
                      <span
                        key={pip.key}
                        className={`hr-max-pip hr-max-pip--${pip.tone}`}
                        title={pip.label}
                        aria-label={pip.label}
                      />
                    ))}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-300 font-semibold truncate">
                    <TrendingUp className="mr-1 inline h-3 w-3 text-cyan-400" />
                    {catalyst}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Right: HRPI Score & Edge Badge */}
            <div className="flex shrink-0 flex-col items-end leading-none">
              <span className="font-mono text-2xl font-black tabular-nums text-white font-sans" style={{ color: activeTier.accent }}>
                {score}
              </span>
              <span className="mt-0.5 font-mono text-[8px] font-black uppercase tracking-widest text-zinc-500">
                HRPI
              </span>
              {evEdge != null && (
                <span className={`mt-1 text-[10px] font-mono font-black tabular-nums ${evEdge > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {evEdge > 0 ? `+${evEdge}% EV` : `${evEdge}% EV`}
                </span>
              )}
            </div>
          </div>

          {/* Statcast telemetry */}
          <div className="grid grid-cols-2 gap-1.5 border-t border-white/10 pt-2 font-mono">
            <div className="border border-white/10 bg-zinc-950 p-2">
              <span className="block text-[8px] font-black uppercase tracking-widest text-zinc-500">AVG EXIT VELO</span>
              <strong
                className={`mt-0.5 block text-xs font-bold ${avgExitVelo == null ? 'text-zinc-600' : 'text-cyan-300'}`}
              >
                {exitVeloText}
              </strong>
            </div>

            <div className="border border-white/10 bg-zinc-950 p-2">
              <span className="block text-[8px] font-black uppercase tracking-widest text-zinc-500">BARREL %</span>
              <strong
                className={`mt-0.5 block text-xs font-bold ${barrelRate == null ? 'text-zinc-600' : 'text-amber-400'}`}
              >
                {barrelRateText}
              </strong>
            </div>

            <div className="border border-white/10 bg-zinc-950 p-2">
              <span className="block text-[8px] font-black uppercase tracking-widest text-zinc-500">HANDEDNESS</span>
              <strong
                className={`mt-0.5 flex items-baseline gap-1 text-xs font-bold ${handednessValue === 'N/A' ? 'text-zinc-600' : 'text-emerald-400'}`}
              >
                <span className="truncate">{handednessValue}</span>
                {handednessDetail ? (
                  <span className="shrink-0 text-[9px] font-semibold tabular-nums text-zinc-500">
                    {handednessDetail}
                  </span>
                ) : null}
              </strong>
            </div>

            <div className="border border-white/10 bg-zinc-950 p-2">
              <span className="block text-[8px] font-black uppercase tracking-widest text-zinc-500">
                PITCH VULN{pitchVulnerabilityIsProxy ? '*' : ''}
              </span>
              <strong
                className={`mt-0.5 block text-xs font-bold ${pitchVulnerability === 'N/A' ? 'text-zinc-600' : 'text-purple-400'}`}
              >
                {pitchVulnerability}
              </strong>
            </div>
          </div>

          {/* Condensed secondary strip */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9px] text-zinc-400 border-t border-white/5 pt-1.5">
            <span>
              HARD HIT:{' '}
              <strong className={`font-bold tabular-nums ${hardHitRate == null ? 'text-zinc-600' : 'text-zinc-200'}`}>
                {hardHitText}
              </strong>
            </span>
            <span>
              PARK:{' '}
              <strong className={`font-bold tabular-nums ${parkBoostPct == null ? 'text-zinc-600' : 'text-zinc-200'}`}>
                {parkBoostText}
              </strong>
            </span>
            <span className="truncate">
              MODEL TIER: <strong className="font-bold text-zinc-200">{riskTier}</strong>
            </span>
          </div>

          {/* Action row */}
          <div className="flex flex-nowrap items-center gap-1.5 border-t border-white/10 pt-2 font-mono">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
              {bookOddsLabel && (
                <span className="min-w-0 truncate border border-white/15 bg-zinc-950 px-1.5 py-1 text-[10px] font-bold tabular-nums text-zinc-200">
                  {bookOddsLabel}
                </span>
              )}
              {hasHitHrToday && (
                <span className="min-w-0 truncate text-[9px] font-black uppercase text-rose-400">
                  ⚡ HR LIVE
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleToggleResearch}
              title={isResearched ? 'Close Deep Research' : 'Open Deep Research'}
              aria-label={`${isResearched ? 'Close' : 'Open'} Research for ${row.playerName}`}
              className={`grid h-7 w-7 shrink-0 place-items-center border transition-colors cursor-pointer ${
                isResearched
                  ? 'border-cyan-400 bg-cyan-950 text-cyan-300'
                  : 'border-white/15 bg-zinc-950 text-zinc-400 hover:border-white hover:text-white'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onToggleSaved(row.stableId)}
              aria-label={`${saved ? 'Remove' : 'Add'} ${row.playerName} ${saved ? 'from' : 'to'} My List`}
              className={`grid h-7 w-7 shrink-0 place-items-center border transition-colors cursor-pointer ${
                saved
                  ? 'border-amber-400/60 bg-amber-950/40 text-amber-300'
                  : 'border-white/15 bg-zinc-950 text-zinc-500 hover:border-white hover:text-white'
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => onAddToSlip(row)}
              title="Add to parlay slip"
              aria-label={`Add ${row.playerName} to parlay slip`}
              className="inline-flex h-7 shrink-0 items-center gap-1 whitespace-nowrap border border-cyan-400/60 bg-cyan-950/50 px-2.5 text-[9px] font-black uppercase text-cyan-300 transition-colors hover:bg-cyan-900/60 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> + SLIP
            </button>
          </div>
        </div>

        {/* Expandable Receipt Tray */}
        <div 
          className={`grid transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isReceiptOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <div className="border-t border-white/10 p-3 bg-black">
              <HrNextReceiptTray 
                playerName={row.playerName}
                receipt={receipt}
                onClose={() => onToggleReceipt?.(row.stableId)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── STANDARD COMPACT ROW MODE ──────────────────────────────────────────
  return (
    <div
      className={`hr-max-ticket hr-next-card group w-full border-2 bg-black font-mono ${
        active
          ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
          : 'border-white/15 hover:border-white/35'
      }`}
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 88px',
      }}
      data-testid={`hr-card-${row.stableId}`}
      data-pro-mode="false"
      data-tier={activeTier.key}
    >
      <div className="flex min-h-[76px] items-center gap-2.5 px-3 py-2">
        <button
          type="button"
          onClick={onTicketActivate}
          aria-expanded={Boolean(onToggleReceipt) && isReceiptOpen}
          aria-label={
            onToggleReceipt
              ? `${isReceiptOpen ? 'Hide' : 'Open'} receipt for ${row.playerName}`
              : `Select ${row.playerName}`
          }
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left cursor-pointer"
        >
          {/* Headshot with Status Halo */}
          <div
            className="relative h-10 w-10 shrink-0 overflow-hidden border border-white/20 bg-zinc-950"
            style={{ width: 40, height: 40, aspectRatio: '1 / 1' }}
          >
            <PlayerHeadshot name={row.playerName} playerId={row.playerId?.toString()} size={40} />
            {confirmed && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border border-black" title="CONFIRMED LINEUP" />
            )}
          </div>

          <div className="min-w-0 flex-1 font-mono">
            {/* Top row: Name + Catalyst */}
            <div className="flex min-w-0 items-center gap-2">
              <h4
                className={`text-xs font-bold leading-tight truncate max-w-[130px] sm:max-w-[160px] uppercase ${
                  active ? 'text-cyan-300' : 'text-white'
                }`}
              >
                {row.playerName}
              </h4>
              <p className="min-w-0 flex-1 truncate text-[10px] font-semibold leading-tight text-zinc-300">
                <TrendingUp className="mr-0.5 inline h-3 w-3 text-cyan-400" aria-hidden="true" />
                {catalyst}
              </p>
            </div>

            {/* Middle row: Matchup line, pips, lineup */}
            <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[9px]">
              {teamLogo ? (
                <img src={teamLogo} alt="" width={12} height={12} className="h-3 w-3 shrink-0 object-contain" />
              ) : null}
              <span className="min-w-0 truncate text-zinc-400">
                {matchupLabel}
              </span>
              <span className="flex shrink-0 items-center gap-1" aria-label="Power, pitcher, and park layers">
                {pips.map((pip) => (
                  <span
                    key={pip.key}
                    className={`hr-max-pip hr-max-pip--${pip.tone}`}
                    title={pip.label}
                    aria-label={pip.label}
                  />
                ))}
              </span>
              <span className="shrink-0 truncate font-black uppercase text-cyan-400">
                {lineupText}
              </span>
            </div>

            {/* Bottom Row: Mini Metrics & EV / Odds */}
            <div className="mt-1.5 flex items-center gap-2 text-[9px]">
              {bookOddsLabel && (
                <span className="px-1 py-0.2 border border-white/15 bg-zinc-950 text-zinc-300 font-bold tabular-nums">
                  {bookOddsLabel}
                </span>
              )}
              {evEdge != null && (
                <span className={`font-bold tabular-nums ${evEdge > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {evEdge > 0 ? `+${evEdge}% EV` : `${evEdge}% EV`}
                </span>
              )}
              {recentHrs != null && recentHrs > 0 && (
                <span className="text-amber-300 font-bold tabular-nums flex items-center gap-0.5">
                  🔥 {recentHrs} HR
                </span>
              )}
            </div>
          </div>

          {/* HRPI Score Badge */}
          <div
            className="flex shrink-0 flex-col items-center justify-center border px-2.5 py-1 leading-none font-mono"
            style={{ borderColor: `${activeTier.accent}60`, backgroundColor: `${activeTier.accent}15` }}
          >
            <span className="text-base font-black tabular-nums font-sans" style={{ color: activeTier.accent }}>
              {score}
            </span>
            <span className="mt-0.5 text-[7.5px] font-black uppercase tracking-widest" style={{ color: activeTier.accent }}>
              {activeTier.label.toUpperCase()}
            </span>
          </div>
        </button>

        {/* Card Actions (Save & Slip & Research) */}
        <div className="flex shrink-0 items-center gap-1 font-mono">
          <button
            type="button"
            onClick={handleToggleResearch}
            title={isResearched ? "Close Research" : "Open Deep Research"}
            aria-label={`${isResearched ? 'Close' : 'Open'} Research for ${row.playerName}`}
            className={`grid h-8 w-8 place-items-center border transition-colors cursor-pointer ${
              isResearched
                ? 'border-cyan-400 bg-cyan-950 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'border-white/15 bg-zinc-950 text-zinc-500 hover:text-white hover:border-white'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onToggleSaved(row.stableId)}
            aria-label={`${saved ? 'Remove' : 'Add'} ${row.playerName} ${saved ? 'from' : 'to'} My List`}
            className={`grid h-8 w-8 place-items-center border transition-colors cursor-pointer ${
              saved
                ? 'border-amber-400/60 bg-amber-950/40 text-amber-300'
                : 'border-white/15 bg-zinc-950 text-zinc-500 hover:text-white hover:border-white'
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => onAddToSlip(row)}
            aria-label={`Add ${row.playerName} to parlay slip`}
            className="inline-flex h-8 items-center gap-1 border border-cyan-400/60 bg-cyan-950/50 px-2.5 text-[10px] font-black uppercase text-cyan-300 hover:bg-cyan-900/60 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> + SLIP
          </button>
        </div>
      </div>

      {/* Expandable Receipt Tray */}
      <div 
        className={`grid transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isReceiptOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-white/10 p-3 bg-black">
            <HrNextReceiptTray 
              playerName={row.playerName}
              receipt={receipt}
              onClose={() => onToggleReceipt?.(row.stableId)}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default HrNextCard;
