/**
 * HrPlayerCard — Pro rebuild
 *
 * Design rules:
 * - Zero hardcoded hex — all colors via --ve-* CSS custom properties
 * - Tier badge prominent (Elite / Strong / Watch / Sleeper / Fade)
 * - Top 3 contributing signals shown as chips
 * - VE Edge shown when Vegas line is available
 * - Score ring using CSS token color variable
 */

import React, { useState } from 'react';
import {
  AlertTriangle, ShieldCheck, ShieldQuestion, ShieldAlert,
  ShieldOff, TrendingUp, Zap, ChevronRight,
} from 'lucide-react';
import type { HrWatchRow } from '../../types/hrWatch';

// ─── Re-export for consumers that import HrWatchRow from here ────────────────
export type { HrWatchRow } from '../../types/hrWatch';

// ─── Legacy local aliases (kept for backward compat) ────────────────────────
export type HrTruthStatus = 'official' | 'projected' | 'blocked' | string;
export type HrRiskTier = 'elite' | 'strong' | 'watch' | 'sleeper' | 'fade' | string;

/** 'hit' = real box score confirms a HR; 'no-hr' = day is graded final with no HR; null = unknown/inconclusive (e.g. mid-slate today). */
export type HrCardResult = 'hit' | 'no-hr' | null;

export interface HrPlayerCardProps {
  player: HrWatchRow;
  onClick?: (player: HrWatchRow) => void;
  onViewProfile?: (player: HrWatchRow) => void;
  hrResult?: HrCardResult;
}

// ─── Tier system (matches your spec) ─────────────────────────────────────────
// 97–100 Elite | 92–96 Strong | 85–91 Watch | 75–84 Sleeper | <75 Fade

interface TierConfig {
  label: string;
  /** CSS custom property key (without --) */
  tokenAccent: string;
  ringHex: string; // SVG ring only — needs literal hex; theme patches via CSS var
  borderClass: string;
  borderHoverClass: string;
  textClass: string;
  glowClass: string;
  chipClass: string;
  badgeClass: string;
}

function getTier(score: number): TierConfig {
  if (score >= 97) return {
    label: 'ELITE',
    tokenAccent: 've-accent-cyan',
    ringHex: '#00F0FF',
    borderClass: 'border-white/10',
    borderHoverClass: 'hover:border-vouch-cyan/55',
    textClass: 'text-vouch-cyan',
    glowClass: 'hover:shadow-[0_0_24px_rgba(0,240,255,0.10)]',
    chipClass: 'border border-vouch-cyan/25 bg-vouch-cyan/10 text-vouch-cyan',
    badgeClass: 'bg-vouch-cyan/10 text-vouch-cyan border-vouch-cyan/35',
  };
  if (score >= 92) return {
    label: 'STRONG',
    tokenAccent: 've-accent-cyan',
    ringHex: '#00F0FF',
    borderClass: 'border-white/10',
    borderHoverClass: 'hover:border-vouch-cyan/55',
    textClass: 'text-vouch-cyan',
    glowClass: 'hover:shadow-[0_0_24px_rgba(0,240,255,0.10)]',
    chipClass: 'border border-vouch-cyan/25 bg-vouch-cyan/10 text-vouch-cyan',
    badgeClass: 'bg-vouch-cyan/10 text-vouch-cyan border-vouch-cyan/35',
  };
  if (score >= 85) return {
    label: 'WATCH',
    tokenAccent: 've-accent-cyan',
    ringHex: '#00F0FF',
    borderClass: 'border-white/10',
    borderHoverClass: 'hover:border-vouch-cyan/55',
    textClass: 'text-vouch-cyan',
    glowClass: 'hover:shadow-[0_0_24px_rgba(0,240,255,0.10)]',
    chipClass: 'border border-vouch-cyan/25 bg-vouch-cyan/10 text-vouch-cyan',
    badgeClass: 'bg-vouch-cyan/10 text-vouch-cyan border-vouch-cyan/35',
  };
  if (score >= 75) return {
    label: 'SLEEPER',
    tokenAccent: 've-accent-cyan',
    ringHex: '#00F0FF',
    borderClass: 'border-white/10',
    borderHoverClass: 'hover:border-vouch-cyan/55',
    textClass: 'text-vouch-cyan',
    glowClass: 'hover:shadow-[0_0_24px_rgba(0,240,255,0.10)]',
    chipClass: 'border border-vouch-cyan/25 bg-vouch-cyan/10 text-vouch-cyan',
    badgeClass: 'bg-vouch-cyan/10 text-vouch-cyan border-vouch-cyan/35',
  };
  return {
    label: 'FADE',
    tokenAccent: 've-text-muted',
    ringHex: '#64748b',
    borderClass: 'border-white/10',
    borderHoverClass: 'hover:border-vouch-cyan/35',
    textClass: 'text-[hsl(var(--ve-text-muted))]',
    glowClass: '',
    chipClass: 'border border-white/10 bg-black/30 text-[hsl(var(--ve-text-muted))]',
    badgeClass: 'bg-black/30 text-[hsl(var(--ve-text-muted))] border-white/10',
  };
}

function truthBadge(status: HrTruthStatus): { label: string; icon: React.ReactNode; className: string } {
  switch (status) {
    case 'official':
      return { label: 'Official', icon: <ShieldCheck className="h-3 w-3" />, className: 'border border-vouch-cyan/25 bg-vouch-cyan/10 text-vouch-cyan' };
    case 'projected':
      return { label: 'Projected', icon: <ShieldQuestion className="h-3 w-3" />, className: 'border border-vouch-amber/35 bg-vouch-amber/10 text-vouch-amber' };
    case 'blocked':
      return { label: 'Blocked', icon: <ShieldAlert className="h-3 w-3" />, className: 'border border-red-500/30 bg-red-500/10 text-red-300' };
    default:
      return { label: '—', icon: <ShieldOff className="h-3 w-3" />, className: 'border border-white/10 bg-black/30 text-[hsl(var(--ve-text-muted))]' };
  }
}

function fmt(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  return Math.round(v).toString();
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function teamColor(team: string): string {
  let hash = 0;
  for (let i = 0; i < team.length; i++) hash = team.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 52%, 38%)`;
}

/** Pick the 3 strongest contributing signals to show as chips on the card. */
function topSignals(p: HrWatchRow): Array<{ label: string; value: number }> {
  const signals: Array<{ label: string; value: number | null | undefined }> = [
    { label: 'Power',   value: p.hitterPower },
    { label: 'Pitcher', value: p.pitcherVulnerability },
    { label: 'Pitch Mix', value: p.pitchMix },
    { label: 'Park',    value: p.parkFactor },
    { label: 'Form',    value: p.recentForm },
    { label: 'Platoon', value: p.platoon },
    { label: 'Lineup',  value: p.lineupContext },
    { label: 'Swing',   value: p.swingDecisions },
  ];
  return signals
    .filter((s): s is { label: string; value: number } => s.value != null && !Number.isNaN(s.value))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

const ScoreRing: React.FC<{ score: number; hexColor: string; compact?: boolean }> = ({ score, hexColor, compact = false }) => {
  const SIZE = compact ? 44 : 60;
  const STROKE = compact ? 3.5 : 4.5;
  const r = (SIZE - STROKE) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.max(0, Math.min(100, score)) / 100) * circ;
  return (
    <div className={`relative flex items-center justify-center ${compact ? 'h-11 w-11' : 'h-[60px] w-[60px]'}`}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={r}
          fill="none" stroke={hexColor} strokeWidth={STROKE} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 500ms ease' }}
        />
      </svg>
      <span className={`absolute font-mono font-extrabold text-[hsl(var(--ve-text-primary))] ${compact ? 'text-sm' : 'text-base'}`}>{Math.round(score)}</span>
    </div>
  );
};

// ─── Main card ────────────────────────────────────────────────────────────────

export const HrPlayerCard: React.FC<HrPlayerCardProps> = ({ player, onClick, onViewProfile, hrResult = null }) => {
  const [imgError, setImgError] = useState(false);
  const tier = getTier(player.hrScore);
  const badge = truthBadge(player.truthStatus);
  const hasWarnings = Boolean(player.warnings?.length);
  const signals = topSignals(player);

  // Vegas edge display
  const hasEdge = player.bookOdds != null && player.hrProbability != null;
  const edgeVal = hasEdge
    ? ((player.hrProbability! - (player.impliedProbability ?? 0)) * 100).toFixed(1)
    : null;
  const edgePositive = edgeVal != null && parseFloat(edgeVal) >= 2;
  const edgeNegative = edgeVal != null && parseFloat(edgeVal) <= -2;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(player)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(player); } }}
      className={[
        'group relative flex w-full min-w-0 cursor-pointer flex-col gap-2 border sm:gap-3',
        tier.borderClass,
        'bg-black/30 p-2.5 text-left sm:p-4',
        'transition-all duration-[var(--ve-duration-normal)]',
        'hover:-translate-y-0.5 hover:bg-vouch-cyan/5',
        tier.borderHoverClass,
        tier.glowClass,
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ve-accent-cyan)/0.40)]',
      ].join(' ')}
    >
      {/* Warning dot */}
      {hasWarnings && (
        <span
          className="absolute right-3 top-3 h-2 w-2 bg-vouch-cyan shadow-[0_0_8px_2px_rgba(0,229,255,0.55)]"
          title={`${player.warnings?.length} warning(s)`}
        />
      )}

      {/* Row 1: identity + score ring */}
      <div className="flex items-start justify-between gap-2 sm:items-center sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          {/* Avatar */}
          {player.headshotUrl && !imgError ? (
            <img
              src={player.headshotUrl}
              alt={player.playerName}
              width={44}
              height={44}
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
              className="h-9 w-9 shrink-0 border border-white/10 object-cover sm:h-11 sm:w-11"
              style={{ aspectRatio: '1 / 1' }}
            />
          ) : (
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/10 font-mono text-[10px] font-bold text-[hsl(var(--ve-text-primary))] sm:h-11 sm:w-11 sm:text-xs"
              style={{ backgroundColor: teamColor(player.team) }}
            >
              {initials(player.playerName)}
            </div>
          )}
          {/* Name / matchup */}
          <div className="min-w-0">
            <p className="truncate font-mono text-xs font-bold uppercase tracking-wide text-[hsl(var(--ve-text-primary))] sm:text-sm">{player.playerName}</p>
            <p className="truncate font-mono text-[10px] uppercase tracking-wide text-[hsl(var(--ve-text-muted))] sm:text-xs">
              {player.team || '—'} <span className="text-[hsl(var(--ve-text-muted)/0.45)]">vs</span> {player.opponent || '—'}
            </p>
            {player.pitcherName && (
              <p className="hidden truncate font-mono text-[11px] uppercase tracking-wide text-[hsl(var(--ve-text-muted)/0.55)] sm:block">
                vs {player.pitcherName}
              </p>
            )}
          </div>
        </div>
        {/* Score ring + tier badge */}
        <div className="flex shrink-0 flex-col items-center gap-1 sm:gap-1.5">
          <div className="sm:hidden">
            <ScoreRing score={player.hrScore} hexColor={tier.ringHex} compact />
          </div>
          <div className="hidden sm:block">
            <ScoreRing score={player.hrScore} hexColor={tier.ringHex} />
          </div>
          <span className={[
            'border px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-[0.12em] sm:px-2 sm:text-[9px] sm:tracking-[0.14em]',
            tier.badgeClass,
          ].join(' ')}>
            {tier.label}
          </span>
        </div>
      </div>

      {/* Row 2: truth badge + HR result signal + rank */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide sm:px-2 sm:text-[10px] ${badge.className}`}>
          {badge.icon}
          {badge.label}
        </span>
        {player.truthStatus === 'projected' && (
          <span className="text-[9px] font-semibold uppercase tracking-wide text-vouch-amber/80 sm:text-[10px]" title="Official lineup not posted yet">
            Lineup not confirmed
          </span>
        )}
        {hrResult === 'hit' && (
          <span
            className="inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wide"
            style={{ borderColor: 'rgba(245,158,11,0.45)', background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}
            title="Real box score confirms a home run this game"
          >
            💥 HR
          </span>
        )}
        {hrResult === 'no-hr' && (
          <span
            className="inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide"
            style={{ borderColor: 'rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)' }}
            title="Graded final — no home run"
          >
            No HR
          </span>
        )}
        {player.rank != null && (
          <span className="font-mono text-[10px] font-bold text-[hsl(var(--ve-text-muted)/0.60)]">
            #{player.rank}
          </span>
        )}
        {player.gameTime && (
          <span className="ml-auto font-mono text-[10px] text-[hsl(var(--ve-text-muted)/0.50)]">
            {player.gameTime}
          </span>
        )}
      </div>

      {/* Row 3: top 3 signals */}
      {signals.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {signals.map(s => (
            <span
              key={s.label}
              className={`inline-flex items-center gap-1 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide ${tier.chipClass}`}
            >
              {s.label}
              <span className="opacity-80">{fmt(s.value)}</span>
            </span>
          ))}
          {/* Vegas edge chip */}
          {edgeVal !== null && (
            <span className={[
              'inline-flex items-center gap-1 border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide ml-auto',
              edgePositive
                ? 'border-vouch-cyan/25 bg-vouch-cyan/10 text-vouch-cyan'
                : edgeNegative
                  ? 'border-red-500/30 bg-red-500/10 text-red-300'
                  : 'border-white/10 bg-black/30 text-[hsl(var(--ve-text-muted))]',
            ].join(' ')}>
              <Zap className="h-2.5 w-2.5" />
              VE Edge {edgePositive ? '+' : ''}{edgeVal}%
            </span>
          )}
        </div>
      )}

      {/* Row 4: HR probability bar */}
      {player.hrProbability != null && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-[hsl(var(--ve-text-muted)/0.55)] sm:text-[10px]">
              HR Prob
            </span>
            <span className={`text-[10px] font-black sm:text-[11px] ${tier.textClass}`}>
              {(player.hrProbability * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden bg-white/10">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${Math.min(100, player.hrProbability * 700)}%`, // scale: 14% HR prob = full bar
                background: `hsl(var(--${tier.tokenAccent}))`,
              }}
            />
          </div>
        </div>
      )}

      {/* Trend icon */}
      {player.recentForm != null && player.recentForm >= 70 && (
        <div className="absolute bottom-3 right-3 opacity-30 group-hover:opacity-70 transition-opacity">
          <TrendingUp className={`h-3.5 w-3.5 ${tier.textClass}`} />
        </div>
      )}

      {/* Full Profile CTA — always visible on touch; hover reveal on desktop */}
      {onViewProfile && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onViewProfile(player); }}
          className={[
            'mt-0.5 flex min-h-11 w-full items-center justify-center gap-1.5 border py-2 sm:mt-1 sm:min-h-0 sm:py-1.5',
            'font-mono text-[10px] font-bold uppercase tracking-[0.14em] transition-all duration-150',
            'opacity-100 sm:opacity-0 sm:group-hover:opacity-100',
            `border-[hsl(var(--${tier.tokenAccent})/0.28)] text-[hsl(var(--${tier.tokenAccent}))]`,
            `hover:bg-[hsl(var(--${tier.tokenAccent})/0.08)]`,
          ].join(' ')}
        >
          Full Profile
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

export default React.memo(HrPlayerCard);
