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

// ─── Types ───────────────────────────────────────────────────────────────────

export type HrTruthStatus = 'official' | 'projected' | 'blocked' | string;
export type HrRiskTier = 'elite' | 'strong' | 'watch' | 'sleeper' | 'fade' | string;

export interface HrWatchRow {
  stableId: string;
  playerName: string;
  playerId: string;
  team: string;
  opponent: string;
  teamLogoUrl?: string | null;
  opponentLogoUrl?: string | null;
  pitcherName?: string | null;
  venue?: string | null;
  gamePk?: string | null;
  gameTime?: string | null;
  headshotUrl?: string | null;
  rank?: number | null;
  hrScore: number;

  // Layer sub-scores (0–100 each)
  hitterPower?: number | null;
  pitcherVulnerability?: number | null;
  pitchMix?: number | null;
  parkFactor?: number | null;
  weather?: number | null;
  platoon?: number | null;
  recentForm?: number | null;
  swingDecisions?: number | null;
  lineupContext?: number | null;
  bullpen?: number | null;
  bvpScore?: number | null;
  vegasEdgeScore?: number | null;

  vouchScore?: number | null;
  dataConfidence?: number | null;
  truthStatus: HrTruthStatus;
  riskTier: HrRiskTier;
  oddsLabel?: string | null;

  /** American odds for Vegas edge display, e.g. +280 */
  bookOdds?: number | null;
  /** Model HR probability 0–1 */
  hrProbability?: number | null;
  /** Book implied probability 0–1 (after vig) */
  impliedProbability?: number | null;

  reasons?: string[];
  warnings?: string[];
  sourceMode?: string;
}

export interface HrPlayerCardProps {
  player: HrWatchRow;
  onClick?: (player: HrWatchRow) => void;
  onViewProfile?: (player: HrWatchRow) => void;
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
    tokenAccent: 've-accent-gold',
    ringHex: '#f59e0b',
    borderClass: 'border-[hsl(var(--ve-accent-gold)/0.35)]',
    borderHoverClass: 'hover:border-[hsl(var(--ve-accent-gold)/0.65)]',
    textClass: 'text-[hsl(var(--ve-accent-gold))]',
    glowClass: 'shadow-[0_0_28px_-6px_hsl(var(--ve-accent-gold)/0.50)]',
    chipClass: 'bg-[hsl(var(--ve-accent-gold)/0.10)] text-[hsl(var(--ve-accent-gold))] ring-[hsl(var(--ve-accent-gold)/0.28)]',
    badgeClass: 'bg-[hsl(var(--ve-accent-gold)/0.15)] text-[hsl(var(--ve-accent-gold))] border-[hsl(var(--ve-accent-gold)/0.45)]',
  };
  if (score >= 92) return {
    label: 'STRONG',
    tokenAccent: 've-success',
    ringHex: '#10b981',
    borderClass: 'border-[hsl(var(--ve-success)/0.30)]',
    borderHoverClass: 'hover:border-[hsl(var(--ve-success)/0.60)]',
    textClass: 'text-[hsl(var(--ve-success))]',
    glowClass: 'shadow-[0_0_28px_-6px_hsl(var(--ve-success)/0.45)]',
    chipClass: 'bg-[hsl(var(--ve-success)/0.10)] text-[hsl(var(--ve-success))] ring-[hsl(var(--ve-success)/0.28)]',
    badgeClass: 'bg-[hsl(var(--ve-success)/0.14)] text-[hsl(var(--ve-success))] border-[hsl(var(--ve-success)/0.40)]',
  };
  if (score >= 85) return {
    label: 'WATCH',
    tokenAccent: 've-accent-cyan',
    ringHex: '#22d3ee',
    borderClass: 'border-[hsl(var(--ve-accent-cyan)/0.28)]',
    borderHoverClass: 'hover:border-[hsl(var(--ve-accent-cyan)/0.55)]',
    textClass: 'text-[hsl(var(--ve-accent-cyan))]',
    glowClass: 'shadow-[0_0_28px_-6px_hsl(var(--ve-accent-cyan)/0.40)]',
    chipClass: 'bg-[hsl(var(--ve-accent-cyan)/0.10)] text-[hsl(var(--ve-accent-cyan))] ring-[hsl(var(--ve-accent-cyan)/0.24)]',
    badgeClass: 'bg-[hsl(var(--ve-accent-cyan)/0.12)] text-[hsl(var(--ve-accent-cyan))] border-[hsl(var(--ve-accent-cyan)/0.38)]',
  };
  if (score >= 75) return {
    label: 'SLEEPER',
    tokenAccent: 've-accent-pink',
    ringHex: '#818cf8',
    borderClass: 'border-[hsl(var(--ve-accent-pink)/0.26)]',
    borderHoverClass: 'hover:border-[hsl(var(--ve-accent-pink)/0.52)]',
    textClass: 'text-[hsl(var(--ve-accent-pink))]',
    glowClass: 'shadow-[0_0_28px_-6px_hsl(var(--ve-accent-pink)/0.38)]',
    chipClass: 'bg-[hsl(var(--ve-accent-pink)/0.09)] text-[hsl(var(--ve-accent-pink))] ring-[hsl(var(--ve-accent-pink)/0.22)]',
    badgeClass: 'bg-[hsl(var(--ve-accent-pink)/0.12)] text-[hsl(var(--ve-accent-pink))] border-[hsl(var(--ve-accent-pink)/0.35)]',
  };
  return {
    label: 'FADE',
    tokenAccent: 've-text-muted',
    ringHex: '#64748b',
    borderClass: 'border-[hsl(var(--ve-border)/0.35)]',
    borderHoverClass: 'hover:border-[hsl(var(--ve-border)/0.60)]',
    textClass: 'text-[hsl(var(--ve-text-muted))]',
    glowClass: '',
    chipClass: 'bg-[hsl(var(--ve-surface)/0.40)] text-[hsl(var(--ve-text-muted))] ring-[hsl(var(--ve-border)/0.30)]',
    badgeClass: 'bg-[hsl(var(--ve-surface)/0.40)] text-[hsl(var(--ve-text-muted))] border-[hsl(var(--ve-border)/0.40)]',
  };
}

function truthBadge(status: HrTruthStatus): { label: string; icon: React.ReactNode; className: string } {
  switch (status) {
    case 'official':
      return { label: 'Official', icon: <ShieldCheck className="h-3 w-3" />, className: 'bg-[hsl(var(--ve-success)/0.10)] text-[hsl(var(--ve-success))] ring-[hsl(var(--ve-success)/0.25)]' };
    case 'projected':
      return { label: 'Projected', icon: <ShieldQuestion className="h-3 w-3" />, className: 'bg-[hsl(var(--ve-accent-cyan)/0.10)] text-[hsl(var(--ve-accent-cyan))] ring-[hsl(var(--ve-accent-cyan)/0.25)]' };
    case 'blocked':
      return { label: 'Blocked', icon: <ShieldAlert className="h-3 w-3" />, className: 'bg-[hsl(var(--ve-danger)/0.10)] text-[hsl(var(--ve-danger))] ring-[hsl(var(--ve-danger)/0.25)]' };
    default:
      return { label: '—', icon: <ShieldOff className="h-3 w-3" />, className: 'bg-[hsl(var(--ve-surface)/0.40)] text-[hsl(var(--ve-text-muted))] ring-[hsl(var(--ve-border)/0.20)]' };
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

const ScoreRing: React.FC<{ score: number; hexColor: string }> = ({ score, hexColor }) => {
  const SIZE = 60;
  const STROKE = 4.5;
  const r = (SIZE - STROKE) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.max(0, Math.min(100, score)) / 100) * circ;
  return (
    <div className="relative flex h-[60px] w-[60px] items-center justify-center">
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={r}
          fill="none" stroke={hexColor} strokeWidth={STROKE} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 500ms ease' }}
        />
      </svg>
      <span className="absolute text-base font-extrabold text-[hsl(var(--ve-text-primary))]">{Math.round(score)}</span>
    </div>
  );
};

// ─── Main card ────────────────────────────────────────────────────────────────

export const HrPlayerCard: React.FC<HrPlayerCardProps> = ({ player, onClick, onViewProfile }) => {
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
        'group relative flex w-full cursor-pointer flex-col gap-3 rounded-2xl border',
        tier.borderClass,
        'bg-[hsl(var(--ve-bg-panel)/0.46)] p-4 text-left',
        'transition-all duration-[var(--ve-duration-normal)]',
        'hover:-translate-y-0.5',
        tier.borderHoverClass,
        tier.glowClass,
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ve-accent-cyan)/0.40)]',
      ].join(' ')}
    >
      {/* Warning dot */}
      {hasWarnings && (
        <span
          className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[hsl(var(--ve-warning))] shadow-[0_0_8px_2px_hsl(var(--ve-warning)/0.55)]"
          title={`${player.warnings?.length} warning(s)`}
        />
      )}

      {/* Row 1: identity + score ring */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* Avatar */}
          {player.headshotUrl && !imgError ? (
            <img
              src={player.headshotUrl}
              alt={player.playerName}
              onError={() => setImgError(true)}
              className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-[hsl(var(--ve-border)/0.40)]"
            />
          ) : (
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold text-[hsl(var(--ve-text-primary))] ring-1 ring-[hsl(var(--ve-border)/0.40)]"
              style={{ backgroundColor: teamColor(player.team) }}
            >
              {initials(player.playerName)}
            </div>
          )}
          {/* Name / matchup */}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[hsl(var(--ve-text-primary))]">{player.playerName}</p>
            <p className="truncate text-xs text-[hsl(var(--ve-text-muted))]">
              {player.team || '—'} <span className="text-[hsl(var(--ve-text-muted)/0.45)]">vs</span> {player.opponent || '—'}
            </p>
            {player.pitcherName && (
              <p className="truncate text-[11px] text-[hsl(var(--ve-text-muted)/0.55)]">
                vs {player.pitcherName}
              </p>
            )}
          </div>
        </div>
        {/* Score ring + tier badge */}
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <ScoreRing score={player.hrScore} hexColor={tier.ringHex} />
          <span className={[
            'rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em]',
            tier.badgeClass,
          ].join(' ')}>
            {tier.label}
          </span>
        </div>
      </div>

      {/* Row 2: truth badge + rank */}
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${badge.className}`}>
          {badge.icon}
          {badge.label}
        </span>
        {player.rank != null && (
          <span className="text-[10px] font-bold text-[hsl(var(--ve-text-muted)/0.60)]">
            #{player.rank}
          </span>
        )}
        {player.gameTime && (
          <span className="ml-auto text-[10px] text-[hsl(var(--ve-text-muted)/0.50)]">
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
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold ring-1 ${tier.chipClass}`}
            >
              {s.label}
              <span className="opacity-80">{fmt(s.value)}</span>
            </span>
          ))}
          {/* Vegas edge chip */}
          {edgeVal !== null && (
            <span className={[
              'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold ring-1 ml-auto',
              edgePositive
                ? 'bg-[hsl(var(--ve-success)/0.10)] text-[hsl(var(--ve-success))] ring-[hsl(var(--ve-success)/0.28)]'
                : edgeNegative
                  ? 'bg-[hsl(var(--ve-danger)/0.10)] text-[hsl(var(--ve-danger))] ring-[hsl(var(--ve-danger)/0.28)]'
                  : 'bg-[hsl(var(--ve-surface)/0.40)] text-[hsl(var(--ve-text-muted))] ring-[hsl(var(--ve-border)/0.30)]',
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
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[hsl(var(--ve-text-muted)/0.55)]">
              HR Probability
            </span>
            <span className={`text-[11px] font-black ${tier.textClass}`}>
              {(player.hrProbability * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-[hsl(var(--ve-border)/0.30)]">
            <div
              className={`h-full rounded-full transition-all duration-500`}
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

      {/* Full Profile CTA */}
      {onViewProfile && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onViewProfile(player); }}
          className={[
            'mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border py-1.5',
            'text-[10px] font-bold uppercase tracking-[0.14em] transition-all duration-150',
            'opacity-0 group-hover:opacity-100',
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

export default HrPlayerCard;
