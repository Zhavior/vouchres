import React, { useState } from 'react';
import { ChevronRight, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { logoByTeamName } from '../../lib/teamLogos';
import type { HrWatchRow } from '../../features/hr/types/hrWatch';
import { tierStyleForScore } from '../../features/hr/engine/tiers';
import VouchCursorTip from '../vouch-system/VouchCursorTip';
import '../../styles/unified-player-card.css';

export type HrCardResult = 'hit' | 'no-hr' | null;

const CARD_LABEL = 'font-mono text-[10px] font-bold uppercase tracking-wide';

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

function TeamMark({ name, size = 16 }: { name: string; size?: number }) {
  const logo = logoByTeamName(name);
  if (logo) {
    return <img src={logo} alt="" className="object-contain" style={{ width: size, height: size }} loading="lazy" decoding="async" />;
  }
  return <span className="font-mono text-[9px] font-bold text-white/50">{name.slice(0, 3).toUpperCase()}</span>;
}

function PlayerHeadshot({ name, url }: { name: string; url: string | null }) {
  const [imgError, setImgError] = useState(false);

  if (url && !imgError) {
    return (
      <img
        src={url}
        alt=""
        width={56}
        height={56}
        loading="lazy"
        decoding="async"
        onError={() => setImgError(true)}
        className="ve-player-face ve-player-headshot-bg h-14 w-14 shrink-0 rounded-lg border border-white/12 object-cover"
      />
    );
  }

  return (
    <div className="ve-player-headshot-bg flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-white/12 font-mono text-sm font-black text-white/35">
      {initials(name)}
    </div>
  );
}

export interface UnifiedPlayerCardProps {
  player: HrWatchRow;
  onClick?: (player: HrWatchRow) => void;
  onViewProfile?: (player: HrWatchRow) => void;
  hrResult?: HrCardResult;
  showVouchExplainer?: boolean;
  className?: string;
}

export const UnifiedPlayerCard = React.memo(function UnifiedPlayerCard({
  player,
  onClick,
  onViewProfile,
  hrResult = null,
  showVouchExplainer = true,
  className = '',
}: UnifiedPlayerCardProps) {
  const tier = tierStyleForScore(player.hrScore);
  const stats = topStats(player);
  const isOfficial = player.truthStatus === 'official';
  const isProjected = player.truthStatus === 'projected';
  const hrPct = player.hrProbability != null ? (player.hrProbability * 100).toFixed(1) : null;
  const vouchEdge = player.vouchScore;
  const dataConf = player.dataConfidence;
  const topReason = player.reasons?.[0];
  const teamLogo = player.teamLogoUrl || logoByTeamName(player.team);
  const hasWarnings = Boolean(player.warnings?.length);
  const interactive = Boolean(onClick);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(player);
    }
  };

  const vouchButton = (
    <button
      type="button"
      onClick={(event) => event.stopPropagation()}
      className="ve-vouch-action mt-2.5 flex w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white/75 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
    >
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/20 text-[9px]">V</span>
      Vouch this pick
    </button>
  );

  return (
    <article
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onClick?.(player) : undefined}
      onKeyDown={handleKeyDown}
      className={[
        've-unified-player-card overflow-hidden rounded-xl border shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition',
        tier.shell,
        interactive ? 've-unified-player-card--interactive cursor-pointer' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      <div className={`ve-unified-player-card__header-bar relative h-24 overflow-hidden border-b border-white/8 ${tier.shell}-header`}>
        {teamLogo ? (
          <>
            <img
              src={teamLogo}
              alt=""
              className="ve-player-team-header-logo pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-[42%] object-contain opacity-[0.22]"
              loading="lazy"
              decoding="async"
            />
            <img
              src={teamLogo}
              alt=""
              className="pointer-events-none absolute bottom-2 left-3 h-10 w-10 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
              loading="lazy"
              decoding="async"
            />
          </>
        ) : (
          <div className="absolute bottom-2 left-3 font-mono text-lg font-black text-white/25">{player.team.slice(0, 3).toUpperCase()}</div>
        )}

        <div className="ve-unified-player-card__header-fade pointer-events-none absolute inset-0" aria-hidden="true" />

        {hasWarnings && (
          <span
            className="absolute left-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border border-amber-500/30 bg-black/70 text-amber-300"
            title={player.warnings?.join(' ')}
          >
            <ShieldAlert className="h-3 w-3" />
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-3 pb-2.5">
          <div className="min-w-0 pl-11">
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
          <span className="absolute right-3 top-3 rounded border border-white/15 bg-black/70 px-1.5 py-0.5 font-mono text-[8px] font-bold text-white/70">
            #{player.rank}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 p-3.5">
        <div className="ve-unified-player-card__panel flex items-start gap-3 rounded-lg border border-white/8 p-2.5">
          <PlayerHeadshot name={player.playerName} url={player.headshotUrl} />

          <div className="min-w-0 flex-1 space-y-2">
            {player.pitcherName && (
              <p className="truncate font-mono text-[10px] uppercase tracking-wide text-white/50">vs {player.pitcherName}</p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide ${
                  isOfficial
                    ? 'border-white/15 bg-white/5 text-white/70'
                    : 'border-amber-500/25 bg-amber-500/8 text-amber-200/85'
                }`}
                title={isProjected ? 'Official lineup not posted yet' : undefined}
              >
                {isOfficial ? <ShieldCheck className="h-2.5 w-2.5" /> : <ShieldQuestion className="h-2.5 w-2.5" />}
                {isOfficial ? 'Confirmed lineup' : 'Preview only'}
              </span>

              {hrResult === 'hit' && (
                <span className="inline-flex items-center gap-1 rounded border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-amber-200">
                  HR hit
                </span>
              )}
              {hrResult === 'no-hr' && (
                <span className="inline-flex items-center gap-1 rounded border border-white/12 bg-white/5 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase text-white/45">
                  No HR
                </span>
              )}

              {player.gameTime && (
                <span className="ml-auto font-mono text-[9px] uppercase tracking-wider text-white/35">{player.gameTime}</span>
              )}
            </div>

            {isProjected && (
              <p className="text-[9px] font-semibold uppercase tracking-wide text-amber-200/75" title="Official lineup not posted yet">
                Official lineup not posted yet
              </p>
            )}
          </div>
        </div>

        {stats.length > 0 && (
          <div className="grid grid-cols-3 gap-2 border-y border-white/8 py-2.5">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className={`${CARD_LABEL} text-[8px] text-white/35`}>{stat.label}</p>
                <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-white/90">{Math.round(stat.value)}</p>
              </div>
            ))}
          </div>
        )}

        <div className="ve-unified-player-card__panel rounded-lg border border-white/10 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className={`${CARD_LABEL} text-[9px] text-white/45`}>Vouch System</p>
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

          {showVouchExplainer ? (
            <VouchCursorTip
              title="What is a Vouch?"
              body="Sign in to lock this pick to your public proof ledger. After the game, we grade it against the official box score — wins, losses, and ROI stay on your profile."
            >
              {vouchButton}
            </VouchCursorTip>
          ) : (
            vouchButton
          )}
        </div>

        {hrPct != null && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className={`${CARD_LABEL} text-[9px] text-white/40`}>Model HR%</span>
              <span className="font-mono text-xs font-bold text-white/80">{hrPct}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, player.hrProbability! * 700)}%`, background: tier.barColor }}
              />
            </div>
          </div>
        )}

        {onViewProfile && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onViewProfile(player);
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-white/15 bg-white/5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white/75 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
          >
            Full Profile
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </article>
  );
});

export default UnifiedPlayerCard;
