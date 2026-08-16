import React from 'react';
import { Plus, Star, TrendingUp, Search, Flame } from 'lucide-react';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../lib/teamLogos';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import { extractCardData } from '../utils/cardUtils';
import { HrNextReceiptTray } from './HrNextReceiptTray';
import { useResearchStore } from '../../../stores/useResearchStore';

export interface HrNextCardProps {
  row: HrWatchRow;
  active: boolean;
  saved: boolean;
  isReceiptOpen: boolean;
  isProMode?: boolean;
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
    maxExitVelo,
    hardHitRate,
    parkBoostPct,
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

  // Tier-specific color styling for Pro Mode
  const tierLower = (riskTier || '').toLowerCase();
  const isElite = tierLower.includes('elite');
  const isStrong = tierLower.includes('strong') || tierLower.includes('core');
  const isWatch = tierLower.includes('watch') || tierLower.includes('value');
  const isSleeper = !isElite && !isStrong && !isWatch;

  let scoreColorClass = 'text-[var(--aurora-max-emerald)] drop-shadow-[0_0_12px_rgba(0,217,160,0.4)]';
  let tierBadgeBg = 'bg-[var(--aurora-max-emerald)]/10 text-[var(--aurora-max-emerald)] border-[var(--aurora-max-emerald)]/30';
  let tierBorderHover = 'hover:border-[var(--aurora-max-emerald)]/40';

  if (isElite) {
    scoreColorClass = 'text-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.45)]';
    tierBadgeBg = 'bg-amber-400/15 text-amber-300 border-amber-400/35';
    tierBorderHover = 'hover:border-amber-400/50';
  } else if (isWatch) {
    scoreColorClass = 'text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.35)]';
    tierBadgeBg = 'bg-cyan-400/15 text-cyan-300 border-cyan-400/30';
    tierBorderHover = 'hover:border-cyan-400/40';
  } else if (isSleeper) {
    scoreColorClass = 'text-violet-300 drop-shadow-[0_0_10px_rgba(167,139,250,0.35)]';
    tierBadgeBg = 'bg-violet-400/15 text-violet-300 border-violet-400/30';
    tierBorderHover = 'hover:border-violet-400/40';
  }

  // ─── PRO MODE (Expanded 4-Tier Hero Telemetry Card with HR Intelligence) ───
  if (isProMode) {
    return (
      <div
        className={`group transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] w-full rounded-2xl border ${
          hasHitHrToday
            ? 'border-amber-400/70 bg-gradient-to-r from-amber-500/15 via-ve-obsidian to-ve-obsidian ring-1 ring-amber-400/50 shadow-[0_0_30px_rgba(251,191,36,0.2)]'
            : active
              ? 'border-[var(--aurora-max-emerald)] bg-[rgba(0,217,160,0.12)] ring-1 ring-[var(--aurora-max-emerald)]/50 shadow-[0_0_25px_rgba(0,217,160,0.15)]'
              : `bg-ve-obsidian/95 border-white/10 ${tierBorderHover} hover:bg-ve-graphite shadow-xl`
        }`}
        style={{
          contentVisibility: 'auto',
          containIntrinsicSize: '0 160px',
        }}
        data-testid={`hr-card-${row.stableId}`}
        data-pro-mode="true"
      >
        <div className="p-4 flex flex-col gap-3">
          {/* Main Hero Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5 min-w-0">
              {/* Enlarged Batter Hero Image (72px) with Status Halo */}
              <button
                type="button"
                onClick={onTicketActivate}
                aria-label={`Select ${row.playerName}`}
                className="relative h-[68px] w-[68px] sm:h-[74px] sm:w-[74px] shrink-0 overflow-hidden rounded-2xl border-2 border-white/15 bg-black/60 shadow-[0_0_20px_rgba(0,0,0,0.6)] group-hover:border-[var(--aurora-max-emerald)]/50 transition-all cursor-pointer"
                style={{ aspectRatio: '1 / 1' }}
              >
                <PlayerHeadshot name={row.playerName} playerId={row.playerId?.toString()} size={74} />
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

                  {/* Tier Badge */}
                  <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded border ${tierBadgeBg}`}>
                    {isElite ? '👑 ELITE' : isStrong ? '⚡ STRONG' : isWatch ? '🎯 WATCH' : '🌊 SLEEPER'}
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
            <div className="flex flex-col items-end shrink-0 leading-none">
              <span className={`font-mono text-2xl font-black tabular-nums ${scoreColorClass}`}>
                {score}
              </span>
              <span className="mt-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-white/40">
                HRPI SCORE
              </span>
              {evEdge != null && (
                <span className={`mt-1 text-[10px] font-mono font-black tabular-nums ${evEdge > 0 ? 'text-[var(--aurora-max-emerald)]' : 'text-white/40'}`}>
                  {evEdge > 0 ? `+${evEdge}% EV` : `${evEdge}% EV`}
                </span>
              )}
            </div>
          </div>

          {/* Deep Intel Telemetry Grid (On Top of Ranks/Actions) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 font-mono">
            <div className="p-2 rounded-lg bg-black/40 border border-white/5">
              <span className="text-[8px] text-white/40 uppercase block">Max Exit Velo</span>
              <strong className="text-xs font-bold text-[var(--aurora-max-emerald)] block mt-0.5">
                {maxExitVelo.toFixed(1)} mph
              </strong>
            </div>

            <div className="p-2 rounded-lg bg-black/40 border border-white/5">
              <span className="text-[8px] text-white/40 uppercase block">Barrel Rate</span>
              <strong className="text-xs font-bold text-amber-400 block mt-0.5">
                {barrelRate.toFixed(1)}%
              </strong>
            </div>

            <div className="p-2 rounded-lg bg-black/40 border border-white/5">
              <span className="text-[8px] text-white/40 uppercase block">Hard Hit (95+)</span>
              <strong className="text-xs font-bold text-vouch-cyan block mt-0.5">
                {hardHitRate}%
              </strong>
            </div>

            <div className="p-2 rounded-lg bg-black/40 border border-white/5">
              <span className="text-[8px] text-white/40 uppercase block">Park HR Boost</span>
              <strong className="text-xs font-bold text-white block mt-0.5">
                +{parkBoostPct}% Deep
              </strong>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              {bookOddsLabel && (
                <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 font-mono text-xs font-bold text-white/80 tabular-nums">
                  {bookOddsLabel}
                </span>
              )}
              {hasHitHrToday && (
                <span className="text-rose-400 font-mono text-[10px] font-black uppercase flex items-center gap-1">
                  ⚡ HR HIT IN LIVE PLAY
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleResearch}
                title={isResearched ? "Close Deep Research" : "Open Deep Research"}
                aria-label={`${isResearched ? 'Close' : 'Open'} Research for ${row.playerName}`}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border font-mono text-[10px] font-bold uppercase transition ${
                  isResearched
                    ? 'border-[var(--aurora-max-emerald)] bg-[var(--aurora-max-emerald)]/20 text-[var(--aurora-max-emerald)] shadow-[0_0_10px_rgba(0,217,160,0.2)]'
                    : 'border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/20'
                }`}
              >
                <Search className="h-3 w-3" /> Deep Intel
              </button>

              <button
                type="button"
                onClick={() => onToggleSaved(row.stableId)}
                aria-label={`${saved ? 'Remove' : 'Add'} ${row.playerName} ${saved ? 'from' : 'to'} My List`}
                className={`grid h-8 w-8 place-items-center rounded-lg border transition ${
                  saved
                    ? 'border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 text-[var(--aurora-max-emerald)]'
                    : 'border-white/10 bg-white/5 text-white/40 hover:text-white'
                }`}
              >
                <Star className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => onAddToSlip(row)}
                title="Add to parlay slip"
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/15 px-3 font-mono text-[10px] font-black uppercase text-[var(--aurora-max-emerald)] transition hover:bg-[var(--aurora-max-emerald)]/30"
              >
                <Plus className="h-3.5 w-3.5" /> Slip
              </button>
            </div>
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
      className={`hr-max-ticket group transition-colors duration-150 w-full rounded-xl ${
        active
          ? 'border-[var(--aurora-max-emerald)] bg-[rgba(0,217,160,0.15)] ring-1 ring-[var(--aurora-max-emerald)]/50 shadow-[0_0_15px_rgba(0,217,160,0.1)]'
          : 'bg-ve-obsidian border border-white/5 hover:border-[var(--aurora-max-emerald)]/40 hover:bg-ve-graphite'
      }`}
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: '0 88px',
      }}
      data-testid={`hr-card-${row.stableId}`}
      data-pro-mode="false"
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

          {/* HRPI Score Display */}
          <div className="flex shrink-0 flex-col items-end leading-none">
            <span className="font-mono text-base font-black tabular-nums text-[var(--aurora-max-emerald)] drop-shadow-[0_0_8px_rgba(0,217,160,0.3)]">
              {score}
            </span>
            <span className="mt-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-white/35">
              HRPI
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
