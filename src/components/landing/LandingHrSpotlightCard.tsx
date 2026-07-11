import { useState } from 'react';
import { ShieldCheck, ShieldQuestion } from './LandingIcons';
import { Z8_LABEL } from './LandingTokens';
import { logoByTeamName } from '../../lib/teamLogos';
import type { HrWatchRow } from '../../features/hr/types/hrWatch';
import LandingVouchCursorTip from './LandingVouchCursorTip';

type TierStyle = {
  label: string;
  scoreColor: string;
  badge: string;
};

function tierStyle(score: number): TierStyle {
  if (score >= 97) {
    return { label: 'Elite', scoreColor: '#e2e8f0', badge: 'border-white/20 bg-white/8 text-white/85' };
  }
  if (score >= 92) {
    return { label: 'Strong', scoreColor: '#cbd5e1', badge: 'border-white/18 bg-white/6 text-white/75' };
  }
  if (score >= 85) {
    return { label: 'Watch', scoreColor: '#94a3b8', badge: 'border-white/15 bg-white/5 text-white/65' };
  }
  if (score >= 75) {
    return { label: 'Sleeper', scoreColor: '#94a3b8', badge: 'border-white/12 bg-black/35 text-white/55' };
  }
  return { label: 'Fade', scoreColor: '#64748b', badge: 'border-white/10 bg-black/40 text-white/45' };
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function fmtScore(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return String(Math.round(value));
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
  const vouchEdge = player.vouchScore;
  const dataConf = player.dataConfidence;
  const topReason = player.reasons?.[0];

  return (
    <article className="ve-landing-hr-card overflow-hidden rounded-xl border border-white/12 bg-obsidian-800 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
      <div className="relative h-28 overflow-hidden border-b border-white/8 bg-obsidian-700">
        {player.headshotUrl && !imgError ? (
          <img
            src={player.headshotUrl}
            alt=""
            width={320}
            height={320}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="ve-landing-hr-headshot absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-obsidian-600 font-mono text-2xl font-black text-white/35">
            {initials(player.playerName)}
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0e14] via-[#0a0e14]/55 to-transparent" aria-hidden="true" />

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-3 pb-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{player.playerName}</p>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/55">
              <TeamMark name={player.team} />
              <span className="font-mono text-[9px] uppercase tracking-wider text-white/30">vs</span>
              <TeamMark name={player.opponent} />
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-xl font-black tabular-nums leading-none" style={{ color: tier.scoreColor }}>
              {Math.round(player.hrScore)}
            </p>
            <p className={`mt-1 inline-block rounded border px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest ${tier.badge}`}>
              {tier.label}
            </p>
          </div>
        </div>

        {player.rank != null && (
          <span className="absolute left-3 top-3 rounded border border-white/15 bg-black/70 px-1.5 py-0.5 font-mono text-[8px] font-bold text-white/70">
            #{player.rank}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 p-3.5">
        {player.pitcherName && (
          <p className="truncate font-mono text-[10px] uppercase tracking-wide text-white/40">vs {player.pitcherName}</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide ${
              isOfficial
                ? 'border-white/15 bg-white/5 text-white/70'
                : 'border-amber-500/25 bg-amber-500/8 text-amber-200/85'
            }`}
          >
            {isOfficial ? <ShieldCheck size={11} /> : <ShieldQuestion size={11} />}
            {isOfficial ? 'Confirmed lineup' : 'Preview only'}
          </span>
          {player.gameTime && (
            <span className="ml-auto font-mono text-[9px] uppercase tracking-wider text-white/35">{player.gameTime}</span>
          )}
        </div>

        {stats.length > 0 && (
          <div className="grid grid-cols-3 gap-2 border-y border-white/8 py-2.5">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className={`${Z8_LABEL} text-[8px] text-white/35`}>{stat.label}</p>
                <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-white/90">{Math.round(stat.value)}</p>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg border border-white/10 bg-obsidian-700 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className={`${Z8_LABEL} text-[9px] text-white/45`}>Vouch System</p>
            <span className="font-mono text-[8px] uppercase tracking-wider text-white/30">Graded ledger</span>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-md border border-white/8 bg-black/25 px-2 py-1.5">
              <p className="font-mono text-[8px] uppercase tracking-wider text-white/35">Edge score</p>
              <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-amber-200/90">{fmtScore(vouchEdge)}</p>
            </div>
            <div className="rounded-md border border-white/8 bg-black/25 px-2 py-1.5">
              <p className="font-mono text-[8px] uppercase tracking-wider text-white/35">Data confidence</p>
              <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-white/85">{fmtScore(dataConf)}</p>
            </div>
          </div>

          {topReason && (
            <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-white/50">{topReason}</p>
          )}

          <LandingVouchCursorTip
            title="What is a Vouch?"
            body="Sign in to lock this pick to your public proof ledger. After the game, we grade it against the official box score — wins, losses, and ROI stay on your profile."
          >
            <button
              type="button"
              className="ve-landing-vouch-action mt-2.5 flex w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white/75 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
              aria-describedby={`vouch-tip-${player.stableId}`}
            >
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/20 text-[9px]">V</span>
              Vouch this pick
            </button>
          </LandingVouchCursorTip>
        </div>

        {hrPct != null && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className={`${Z8_LABEL} text-[9px] text-white/40`}>Model HR%</span>
              <span className="font-mono text-xs font-bold text-white/80">{hrPct}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white/55 transition-all duration-500"
                style={{ width: `${Math.min(100, player.hrProbability! * 700)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
