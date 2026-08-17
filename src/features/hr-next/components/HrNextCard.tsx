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
  // The handedness tile leads with the matchup that produced the layer score,
  // so identical bucket values stay distinguishable card to card.
  const handednessValue = handednessLabel ?? (platoonSplit === 'N/A' ? 'N/A' : platoonSplit);
  const handednessDetail = handednessLabel && platoonSplit !== 'N/A' ? platoonSplit : null;
  const pitchVulnerability = layerValue(row.pitchMix ?? row.pitcherVulnerability);
  const pitchVulnerabilityIsProxy = row.pitchMix == null && row.pitcherVulnerability != null;

  // ─── PRO MODE (Expanded 4-Tier Hero Telemetry Card with HR Intelligence) ───
  if (isProMode) {
    return (
      <div
        className={`hr-next-card group w-full rounded-2xl border bg-[#050808] ${
          hasHitHrToday
            ? 'border-amber-400/70 ring-1 ring-amber-400/50'
            : active
              ? 'border-[var(--aurora-max-emerald)] ring-1 ring-[var(--aurora-max-emerald)]/50'
              : `${activeTier.proBorder} ${tierBorderHover}`
        }`}
        style={{
          contentVisibility: 'auto',
          // `auto` makes the browser remember this card's last-rendered height.
          // A fixed placeholder under-measures the real card, so scrollHeight
          // inflates as you scroll and the column never reaches its end.
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
              {/* Batter hero image with lineup-status halo */}
              <button
                type="button"
                onClick={onTicketActivate}
                aria-label={`Select ${row.playerName}`}
                className="relative h-[56px] w-[56px] shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 border-white/15 bg-black/60 transition-colors group-hover:border-white/25"
                style={{ aspectRatio: '1 / 1' }}
              >
                <PlayerHeadshot name={row.playerName} playerId={row.playerId?.toString()} size={56} />
                {confirmed && (
                  <span
                    className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-[var(--aurora-max-emerald)] border-2 border-black shadow-[0_0_8px_rgba(0,217,160,0.8)]"
                    title="Confirmed Lineup"
                  />
                )}
              </button>

              {/* Player Info, Badges & Matchup */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    onClick={onTicketActivate}
                    className={`font-mono text-sm sm:text-base font-black leading-tight tracking-tight cursor-pointer hover:underline truncate ${
                      active ? 'text-[var(--aurora-max-emerald)]' : 'text-white'
                    }`}
                  >
                    {row.playerName}
                  </h3>
                  <span className="text-[10px] font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
                    {teamLogo ? (
                      <img src={teamLogo} alt="" width={12} height={12} className="h-3 w-3 shrink-0 object-contain" />
                    ) : null}
                    {row.team}
                  </span>

                  {/* Tier Badge — HRPI band, matching the column it renders in */}
                  <span className={`rounded border px-2 py-0.5 font-mono text-[9px] font-black uppercase ${tierBadgeBg}`}>
                    {activeTier.label}
                  </span>

                  {/* HR Intelligence Live & Recent Badges */}
                  {hasHitHrToday && (
                    <span className="inline-flex items-center gap-1 rounded border border-rose-500/50 bg-rose-500/20 px-2 py-0.5 font-mono text-[9px] font-black text-rose-300 uppercase shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse">
                      <Flame className="w-3 h-3 text-rose-400" /> Today HR
                    </span>
                  )}
                  {recentHrs != null && recentHrs > 0 && (
                    <span className="inline-flex items-center gap-1 rounded border border-amber-500/50 bg-amber-500/15 px-2 py-0.5 font-mono text-[9px] font-black text-amber-300 shadow-sm">
                      <Flame className="w-3 h-3 text-amber-400" /> 7Days HR: {recentHrs}
                    </span>
                  )}
                </div>

                {/* Matchup & Pitcher Line */}
                <p className="mt-1 font-mono text-[11px] text-white/60 truncate flex items-center gap-1.5">
                  <span className="text-white/40">vs</span>
                  <strong className="text-white font-bold">{pitcherName}</strong>
                  <span className="text-white/30">·</span>
                  <span className="text-white/40 truncate">{matchupLabel.split('·')[1]?.trim() || matchupLabel}</span>
                  <span className="text-white/30">·</span>
                  <span className="text-white/50 text-[10px] font-bold uppercase">{lineupText}</span>
                </p>

                {/* Layer Score Pips */}
                <div className="mt-2 flex items-center gap-2">
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
                  <span className="font-mono text-[10px] text-white/70 font-semibold truncate">
                    <TrendingUp className="mr-1 inline h-3 w-3 text-[var(--aurora-max-emerald)]" />
                    {catalyst}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Right: HRPI Score & Edge Badge */}
            <div className="flex shrink-0 flex-col items-end leading-none">
              <span className={`font-mono text-xl font-black tabular-nums ${scoreColorClass}`}>
                {score}
              </span>
              <span className="mt-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-white/40">
                HRPI
              </span>
              {evEdge != null && (
                <span className={`mt-1 text-[10px] font-mono font-black tabular-nums ${evEdge > 0 ? 'text-[var(--aurora-max-emerald)]' : 'text-white/40'}`}>
                  {evEdge > 0 ? `+${evEdge}% EV` : `${evEdge}% EV`}
                </span>
              )}
            </div>
          </div>

          {/* Statcast telemetry — exposed inline, no drawer required */}
          <div className="grid grid-cols-2 gap-1.5 border-t border-white/5 pt-2 font-mono">
            <div className="rounded-lg border border-white/5 bg-[#0a1010] px-2 py-1.5">
              <span className="block text-[8px] uppercase tracking-[0.12em] text-white/40">Avg Exit Velo</span>
              <strong
                className={`mt-0.5 block text-xs font-bold ${avgExitVelo == null ? 'text-white/35' : 'text-[#10B981]'}`}
                title="Season average exit velocity from the Statcast leaderboard"
              >
                {exitVeloText}
              </strong>
            </div>

            <div className="rounded-lg border border-white/5 bg-[#0a1010] px-2 py-1.5">
              <span className="block text-[8px] uppercase tracking-[0.12em] text-white/40">Barrel %</span>
              <strong
                className={`mt-0.5 block text-xs font-bold ${barrelRate == null ? 'text-white/35' : 'text-[#F59E0B]'}`}
                title="Season barrel rate from the Statcast leaderboard"
              >
                {barrelRateText}
              </strong>
            </div>

            <div className="rounded-lg border border-white/5 bg-[#0a1010] px-2 py-1.5">
              <span className="block text-[8px] uppercase tracking-[0.12em] text-white/40">Handedness</span>
              <strong
                className={`mt-0.5 flex items-baseline gap-1 text-xs font-bold ${handednessValue === 'N/A' ? 'text-white/35' : 'text-[#10B981]'}`}
                title="Batter hand vs opposing starter hand · platoon layer score (0–100)"
              >
                <span className="truncate">{handednessValue}</span>
                {handednessDetail ? (
                  <span className="shrink-0 text-[9px] font-semibold tabular-nums text-white/45">
                    {handednessDetail}
                  </span>
                ) : null}
              </strong>
            </div>

            <div className="rounded-lg border border-white/5 bg-[#0a1010] px-2 py-1.5">
              <span className="block text-[8px] uppercase tracking-[0.12em] text-white/40">
                Pitch Vuln{pitchVulnerabilityIsProxy ? '*' : ''}
              </span>
              <strong
                className={`mt-0.5 block text-xs font-bold ${pitchVulnerability === 'N/A' ? 'text-white/35' : 'text-[#A855F7]'}`}
                title={
                  pitchVulnerabilityIsProxy
                    ? 'Pitch-mix layer unavailable — showing the pitcher vulnerability layer (0–100)'
                    : 'Primary pitch-mix vulnerability layer score (0–100)'
                }
              >
                {pitchVulnerability}
              </strong>
            </div>
          </div>

          {/* Condensed secondary strip */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9px] text-white/45">
            <span>
              Hard Hit{' '}
              <strong className={`font-bold tabular-nums ${hardHitRate == null ? 'text-white/35' : 'text-white/75'}`}>
                {hardHitText}
              </strong>
            </span>
            <span>
              Park{' '}
              <strong className={`font-bold tabular-nums ${parkBoostPct == null ? 'text-white/35' : 'text-white/75'}`}>
                {parkBoostText}
              </strong>
            </span>
            <span className="truncate" title="Risk tier published by the pipeline, independent of the HRPI band">
              Model tier <strong className="font-bold text-white/75">{riskTier}</strong>
            </span>
          </div>

          {/* Action row — one tappable row at every width. The row never wraps:
              the odds / live-HR group is the only flexible member and it
              truncates, so Deep Intel, Save and Slip stay on the line even at
              320px. */}
          <div className="flex flex-nowrap items-center gap-1.5 border-t border-white/5 pt-2">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
              {bookOddsLabel && (
                <span className="min-w-0 truncate rounded-md border border-white/10 bg-[#0a1010] px-1.5 py-1 font-mono text-[10px] font-bold tabular-nums text-white/80">
                  {bookOddsLabel}
                </span>
              )}
              {hasHitHrToday && (
                <span className="min-w-0 truncate font-mono text-[9px] font-black uppercase text-rose-400">
                  ⚡ HR live
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleToggleResearch}
              title={isResearched ? 'Close Deep Research' : 'Open Deep Research'}
              aria-label={`${isResearched ? 'Close' : 'Open'} Research for ${row.playerName}`}
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border transition-colors ${
                isResearched
                  ? 'border-[var(--aurora-max-emerald)] bg-[var(--aurora-max-emerald)]/20 text-[var(--aurora-max-emerald)]'
                  : 'border-white/10 bg-[#0a1010] text-white/50 hover:border-white/25 hover:text-white'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onToggleSaved(row.stableId)}
              aria-label={`${saved ? 'Remove' : 'Add'} ${row.playerName} ${saved ? 'from' : 'to'} My List`}
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border transition-colors ${
                saved
                  ? 'border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 text-[var(--aurora-max-emerald)]'
                  : 'border-white/10 bg-[#0a1010] text-white/40 hover:text-white'
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => onAddToSlip(row)}
              title="Add to parlay slip"
              aria-label={`Add ${row.playerName} to parlay slip`}
              className="inline-flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/15 px-2 font-mono text-[9px] font-black uppercase text-[var(--aurora-max-emerald)] transition-colors hover:bg-[var(--aurora-max-emerald)]/30"
            >
              <Plus className="h-3.5 w-3.5" /> Slip
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
            <div className="border-t border-white/[0.08] px-4 pb-3 pt-2.5 bg-black/40">
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
      className={`hr-max-ticket hr-next-card group w-full rounded-xl border bg-[#070b0b] ${
        active
          ? 'border-[var(--aurora-max-emerald)] ring-1 ring-[var(--aurora-max-emerald)]/50'
          : `border-white/5 ${tierBorderHover}`
      }`}
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 88px',
      }}
      data-testid={`hr-card-${row.stableId}`}
      data-pro-mode="false"
      data-tier={activeTier.key}
    >
      <div className="flex min-h-[78px] items-center gap-2.5 px-3 py-2">
        <button
          type="button"
          onClick={onTicketActivate}
          aria-expanded={Boolean(onToggleReceipt) && isReceiptOpen}
          aria-label={
            onToggleReceipt
              ? `${isReceiptOpen ? 'Hide' : 'Open'} receipt for ${row.playerName}`
              : `Select ${row.playerName}`
          }
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          {/* Headshot with Status Halo */}
          <div
            className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/40 shadow-inner"
            style={{ width: 40, height: 40, aspectRatio: '1 / 1' }}
          >
            <PlayerHeadshot name={row.playerName} playerId={row.playerId?.toString()} size={40} />
            {confirmed && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[var(--aurora-max-emerald)] border border-black shadow" title="Confirmed Lineup" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            {/* Top row: Name + Catalyst */}
            <div className="flex min-w-0 items-center gap-2">
              <h4
                className={`font-mono text-xs font-bold leading-tight truncate max-w-[130px] sm:max-w-[160px] ${
                  active ? 'text-[var(--aurora-max-emerald)]' : 'text-white'
                }`}
              >
                {row.playerName}
              </h4>
              <p className="min-w-0 flex-1 truncate font-mono text-[10px] font-semibold leading-tight text-white/80">
                <TrendingUp className="mr-0.5 inline h-3 w-3 text-[var(--aurora-max-emerald)]" aria-hidden="true" />
                {catalyst}
              </p>
            </div>

            {/* Middle row: Matchup line, pips, lineup */}
            <div className="mt-1 flex min-w-0 items-center gap-1.5 font-mono text-[9px]">
              {teamLogo ? (
                <img src={teamLogo} alt="" width={12} height={12} className="h-3 w-3 shrink-0 object-contain" />
              ) : null}
              <span className="min-w-0 truncate text-white/50">
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
              <span className="shrink-0 truncate font-bold uppercase tracking-[0.08em] text-white/40">
                {lineupText}
              </span>
            </div>

            {/* Bottom Row: Mini Metrics & EV / Odds */}
            <div className="mt-1.5 flex items-center gap-2 font-mono text-[9px]">
              {bookOddsLabel && (
                <span className="px-1 py-0.2 rounded bg-white/5 border border-white/10 text-white/70 font-bold tabular-nums">
                  {bookOddsLabel}
                </span>
              )}
              {evEdge != null && (
                <span className={`font-bold tabular-nums ${evEdge > 0 ? 'text-[var(--aurora-max-emerald)]' : 'text-white/40'}`}>
                  {evEdge > 0 ? `+${evEdge}% EV` : `${evEdge}% EV`}
                </span>
              )}
              {recentHrs != null && recentHrs > 0 && (
                <span className="text-amber-300/80 font-bold tabular-nums flex items-center gap-0.5">
                  🔥 {recentHrs} HR
                </span>
              )}
            </div>
          </div>

          {/* HRPI Score Badge */}
          <div
            className={`flex shrink-0 flex-col items-center justify-center rounded-lg border px-2.5 py-1.5 leading-none ${tierBadgeBg}`}
          >
            <span className={`font-mono text-lg font-black tabular-nums ${scoreColorClass}`}>
              {score}
            </span>
            <span className="mt-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.12em] opacity-70">
              {activeTier.label}
            </span>
          </div>
        </button>

        {/* Card Actions (Save & Slip & Research) */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={handleToggleResearch}
            title={isResearched ? "Close Research" : "Open Deep Research"}
            aria-label={`${isResearched ? 'Close' : 'Open'} Research for ${row.playerName}`}
            className={`grid h-8 w-8 place-items-center rounded-lg border transition ${
              isResearched
                ? 'border-[var(--aurora-max-emerald)] bg-[var(--aurora-max-emerald)]/20 text-[var(--aurora-max-emerald)] shadow-[0_0_10px_rgba(0,217,160,0.2)]'
                : 'border-white/10 text-white/40 hover:text-white hover:border-white/20'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onToggleSaved(row.stableId)}
            aria-label={`${saved ? 'Remove' : 'Add'} ${row.playerName} ${saved ? 'from' : 'to'} My List`}
            className={`grid h-8 w-8 place-items-center rounded-lg border transition ${
              saved
                ? 'border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 text-[var(--aurora-max-emerald)]'
                : 'border-white/10 text-white/40 hover:text-white'
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => onAddToSlip(row)}
            title="Add to parlay slip"
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 px-2.5 font-mono text-[9px] font-bold uppercase text-[var(--aurora-max-emerald)] transition hover:bg-[var(--aurora-max-emerald)]/25"
          >
            <Plus className="h-3 w-3" /> Slip
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
          <div className="border-t border-white/[0.08] px-3 pb-2.5 pt-2 bg-black/40">
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
