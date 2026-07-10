import { useState } from 'react';
import { ShieldCheck, ShieldQuestion } from './LandingIcons';
import { Z8_LABEL } from './LandingTokens';
import { logoByTeamName } from '../../lib/teamLogos';
import type { HrWatchRow } from '../../features/hr/types/hrWatch';

type TierStyle = {
  label: string;
  accent: string;
  ring: string;
  badge: string;
};

function tierStyle(score: number): TierStyle {
  if (score >= 97) {
    return {
      label: 'Elite',
      accent: 'from-vouch-cyan/20 via-vouch-cyan/5 to-transparent',
      ring: '#00F0FF',
      badge: 'border-vouch-cyan/40 bg-vouch-cyan/12 text-vouch-cyan',
    };
  }
  if (score >= 92) {
    return {
      label: 'Strong',
      accent: 'from-vouch-cyan/16 via-vouch-cyan/4 to-transparent',
      ring: '#00F0FF',
      badge: 'border-vouch-cyan/35 bg-vouch-cyan/10 text-vouch-cyan',
    };
  }
  if (score >= 85) {
    return {
      label: 'Watch',
      accent: 'from-vouch-emerald/14 via-vouch-emerald/4 to-transparent',
      ring: '#00FF94',
      badge: 'border-vouch-emerald/35 bg-vouch-emerald/10 text-vouch-emerald',
    };
  }
  if (score >= 75) {
    return {
      label: 'Sleeper',
      accent: 'from-vouch-amber/14 via-vouch-amber/4 to-transparent',
      ring: '#FFB020',
      badge: 'border-vouch-amber/35 bg-vouch-amber/10 text-vouch-amber',
    };
  }
  return {
    label: 'Fade',
    accent: 'from-white/8 via-white/2 to-transparent',
    ring: '#64748b',
    badge: 'border-white/15 bg-black/40 text-white/45',
  };
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function topStats(player: HrWatchRow): Array<{ label: string; value: number }> {
  const stats = [
    { label: 'Power', value: player.hitterPower },
    { label: 'Pitcher', value: player.pitcherVulnerability },
    { label: 'Park', value: player.parkFactor },
  ];
  return stats
    .filter((s): s is { label: string; value: number } => s.value != null && !Number.isNaN(s.value))
    .slice(0, 3);
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const size = 52;
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.max(0, Math.min(100, score)) / 100) * circ;

  return (
    <div className="relative flex h-[52px] w-[52px] items-center justify-center">
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute font-mono text-sm font-black tabular-nums text-white">{Math.round(score)}</span>
    </div>
  );
}

function TeamMark({ name }: { name: string }) {
  const logo = logoByTeamName(name);
  if (logo) {
    return <img src={logo} alt="" className="h-4 w-4 object-contain" loading="lazy" decoding="async" />;
  }
  return <span className="font-mono text-[9px] font-bold text-white/50">{name.slice(0, 3).toUpperCase()}</span>;
}

export default function LandingHrSpotlightCard({ player }: { player: HrWatchRow }) {
  const [imgError, setImgError] = useState(false);
  const tier = tierStyle(player.hrScore);
  const stats = topStats(player);
  const isOfficial = player.truthStatus === 'official';
  const hrPct = player.hrProbability != null ? (player.hrProbability * 100).toFixed(1) : null;

  return (
    <article className="ve-landing-hr-card group">
      <div className={`ve-landing-hr-card-accent bg-gradient-to-b ${tier.accent}`} aria-hidden="true" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-vouch-cyan/60 via-vouch-cyan/20 to-transparent opacity-80" aria-hidden="true" />

      <div className="relative flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">
              {player.headshotUrl && !imgError ? (
                <img
                  src={player.headshotUrl}
                  alt=""
                  width={56}
                  height={56}
                  loading="lazy"
                  decoding="async"
                  onError={() => setImgError(true)}
                  className="h-14 w-14 rounded-xl border border-white/15 bg-black/40 object-cover object-top shadow-[0_4px_16px_rgba(0,0,0,0.45)]"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/15 bg-black/50 font-mono text-sm font-black text-white/80">
                  {initials(player.playerName)}
                </div>
              )}
              {player.rank != null && (
                <span className="absolute -bottom-1.5 -right-1.5 rounded-md border border-vouch-cyan/35 bg-black/90 px-1.5 py-0.5 font-mono text-[8px] font-bold text-vouch-cyan">
                  #{player.rank}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-white">{player.playerName}</p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/50">
                <TeamMark name={player.team} />
                <span className="font-mono text-[9px] uppercase tracking-wider text-white/30">vs</span>
                <TeamMark name={player.opponent} />
              </div>
              {player.pitcherName && (
                <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-wide text-white/35">
                  vs {player.pitcherName}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-1">
            <ScoreRing score={player.hrScore} color={tier.ring} />
            <span className={`rounded-full border px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest ${tier.badge}`}>
              {tier.label}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide ${
              isOfficial
                ? 'border-vouch-cyan/30 bg-vouch-cyan/10 text-vouch-cyan'
                : 'border-vouch-amber/30 bg-vouch-amber/10 text-vouch-amber'
            }`}
          >
            {isOfficial ? <ShieldCheck size={11} /> : <ShieldQuestion size={11} />}
            {isOfficial ? 'Confirmed lineup' : 'Preview'}
          </span>
          {player.gameTime && (
            <span className="ml-auto font-mono text-[9px] uppercase tracking-wider text-white/35">{player.gameTime}</span>
          )}
        </div>

        {stats.length > 0 && (
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/8 bg-black/25 p-2">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className={`${Z8_LABEL} text-[8px] text-white/35`}>{stat.label}</p>
                <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-white">{Math.round(stat.value)}</p>
              </div>
            ))}
          </div>
        )}

        {hrPct != null && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className={`${Z8_LABEL} text-[9px] text-white/40`}>HR Probability</span>
              <span className="font-mono text-xs font-bold text-vouch-cyan">{hrPct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-vouch-cyan/70 to-vouch-cyan transition-all duration-500"
                style={{ width: `${Math.min(100, player.hrProbability! * 700)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
