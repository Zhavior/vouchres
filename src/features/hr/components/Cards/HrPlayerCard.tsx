import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, ShieldQuestion, ShieldAlert, Zap, ShieldOff, Trees, TrendingUp } from 'lucide-react';

export type HrTruthStatus = 'official' | 'projected' | 'blocked' | string;
export type HrRiskTier = 'elite' | 'strong' | 'watch' | 'sleeper' | string;

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
  hitterPower?: number | null;
  pitcherVulnerability?: number | null;
  parkFactor?: number | null;
  recentForm?: number | null;
  vouchScore?: number | null;
  dataConfidence?: number | null;
  truthStatus: HrTruthStatus;
  riskTier: HrRiskTier;
  oddsLabel?: string | null;
  reasons?: string[];
  warnings?: string[];
  sourceMode?: string;
}

export interface HrPlayerCardProps {
  player: HrWatchRow;
  onClick?: (player: HrWatchRow) => void;
}

interface TierPalette {
  ring: string;
  border: string;
  borderHover: string;
  text: string;
  glow: string;
  chip: string;
}

function getTierPalette(score: number): TierPalette {
  if (score >= 90) {
    return {
      ring: '#f59e0b',
      border: 'border-amber-500/30',
      borderHover: 'hover:border-amber-400/60',
      text: 'text-amber-400',
      glow: 'shadow-[0_0_24px_-6px_rgba(245,158,11,0.45)]',
      chip: 'bg-amber-500/10 text-amber-300 ring-amber-500/25',
    };
  }
  if (score >= 80) {
    return {
      ring: '#10b981',
      border: 'border-emerald-500/30',
      borderHover: 'hover:border-emerald-400/60',
      text: 'text-emerald-400',
      glow: 'shadow-[0_0_24px_-6px_rgba(16,185,129,0.45)]',
      chip: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/25',
    };
  }
  if (score >= 70) {
    return {
      ring: '#3b82f6',
      border: 'border-blue-500/30',
      borderHover: 'hover:border-blue-400/60',
      text: 'text-blue-400',
      glow: 'shadow-[0_0_24px_-6px_rgba(59,130,246,0.45)]',
      chip: 'bg-blue-500/10 text-blue-300 ring-blue-500/25',
    };
  }
  return {
    ring: '#a855f7',
    border: 'border-purple-500/30',
    borderHover: 'hover:border-purple-400/60',
    text: 'text-purple-400',
    glow: 'shadow-[0_0_24px_-6px_rgba(168,85,247,0.45)]',
    chip: 'bg-purple-500/10 text-purple-300 ring-purple-500/25',
  };
}

function truthBadge(status: HrTruthStatus): { label: string; icon: React.ReactNode; className: string } {
  switch (status) {
    case 'official':
      return {
        label: 'Official',
        icon: <ShieldCheck className="h-3 w-3" />,
        className: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/25',
      };
    case 'projected':
      return {
        label: 'Projected',
        icon: <ShieldQuestion className="h-3 w-3" />,
        className: 'bg-blue-500/10 text-blue-300 ring-blue-500/25',
      };
    case 'blocked':
      return {
        label: 'Blocked',
        icon: <ShieldAlert className="h-3 w-3" />,
        className: 'bg-red-500/10 text-red-300 ring-red-500/25',
      };
    default:
      return {
        label: '—',
        icon: <ShieldOff className="h-3 w-3" />,
        className: 'bg-white/[0.04] text-zinc-500 ring-white/[0.08]',
      };
  }
}

function fmtMetric(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return Math.round(value).toString();
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function teamColor(team: string): string {
  let hash = 0;
  for (let i = 0; i < team.length; i++) {
    hash = team.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 42%)`;
}

const ScoreRing: React.FC<{ score: number; color: string }> = ({ score, color }) => {
  const size = 64;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 500ms ease' }}
        />
      </svg>
      <span className="absolute text-lg font-extrabold text-slate-50">{Math.round(score)}</span>
    </div>
  );
};

const MetricChip: React.FC<{ icon: React.ReactNode; label: string; value: number | null | undefined }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex flex-col items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5">
    <div className="flex items-center gap-1 text-zinc-500">
      {icon}
      <span className="text-[9px] font-semibold uppercase tracking-wide">{label}</span>
    </div>
    <span className="text-sm font-bold text-slate-100">{fmtMetric(value)}</span>
  </div>
);

export const HrPlayerCard: React.FC<HrPlayerCardProps> = ({ player, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const palette = getTierPalette(player.hrScore);
  const badge = truthBadge(player.truthStatus);
  const hasWarnings = Boolean(player.warnings && player.warnings.length > 0);
  const avatarBg = teamColor(player.team);

  return (
    <button
      type="button"
      onClick={() => onClick?.(player)}
      className={`group relative flex w-full flex-col gap-3 rounded-2xl border ${palette.border} bg-[#090C13] p-4 text-left transition duration-200 hover:-translate-y-0.5 ${palette.borderHover} hover:shadow-[0_0_0_1px_rgba(34,211,238,0.25),0_12px_28px_-12px_rgba(34,211,238,0.25)]`}
    >
      {hasWarnings && (
        <span
          className="absolute right-3 top-3 h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.6)]"
          title={`${player.warnings?.length} warning(s)`}
        />
      )}

      {/* Top row: identity + score */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {player.headshotUrl && !imgError ? (
            <img
              src={player.headshotUrl}
              alt={player.playerName}
              onError={() => setImgError(true)}
              className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-white/[0.08]"
            />
          ) : (
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ring-1 ring-white/[0.08]"
              style={{ backgroundColor: avatarBg }}
            >
              {initials(player.playerName)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-50">{player.playerName}</p>
            <p className="truncate text-xs text-zinc-400">
              {player.team || '—'} <span className="text-zinc-600">vs</span> {player.opponent || '—'}
            </p>
            <p className="truncate text-[11px] text-zinc-600">{player.gameTime || '—'}</p>
          </div>
        </div>

        <ScoreRing score={player.hrScore} color={palette.ring} />
      </div>

      {/* Middle row: metric chips */}
      <div className="grid grid-cols-4 gap-1.5">
        <MetricChip icon={<Zap className="h-2.5 w-2.5" />} label="Power" value={player.hitterPower} />
        <MetricChip icon={<ShieldOff className="h-2.5 w-2.5" />} label="Vuln" value={player.pitcherVulnerability} />
        <MetricChip icon={<Trees className="h-2.5 w-2.5" />} label="Park" value={player.parkFactor} />
        <MetricChip icon={<TrendingUp className="h-2.5 w-2.5" />} label="Form" value={player.recentForm} />
      </div>

      {/* Bottom row: badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.05] pt-2.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${badge.className}`}
        >
          {badge.icon}
          {badge.label}
        </span>
        <span className="text-[11px] font-medium text-zinc-500">{player.oddsLabel || '—'}</span>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${palette.chip}`}>
          Vouch {player.vouchScore !== null && player.vouchScore !== undefined ? Math.round(player.vouchScore) : '—'}
        </span>
      </div>

      {hasWarnings && (
        <div className="flex items-center gap-1 text-[10px] font-medium text-amber-400/90">
          <AlertTriangle className="h-3 w-3" />
          {player.warnings?.length} warning{player.warnings && player.warnings.length > 1 ? 's' : ''}
        </div>
      )}
    </button>
  );
};

export default HrPlayerCard;
