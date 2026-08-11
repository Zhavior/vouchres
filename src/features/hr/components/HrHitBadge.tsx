import React from 'react';
import { Flame } from 'lucide-react';
import type { HrEvent } from '../../../types/notifications';
import type { HrCardResult } from '../../../components/player/UnifiedPlayerCard';
import type { HrWatchRow } from '../types/hrWatch';

export interface HrHitBadgeProps {
  event?: HrEvent;
  compact?: boolean;
  className?: string;
}

export interface PlayerHrTagProps {
  player: Pick<HrWatchRow, 'last7DayHomeRuns' | 'last7DayGamesChecked'>;
  hrResult?: HrCardResult;
  compact?: boolean;
}

function verifiedCount(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : null;
}

export function PlayerHrTag({ player, hrResult = null, compact = false }: PlayerHrTagProps) {
  const last7DayHomeRuns = verifiedCount(player.last7DayHomeRuns);
  const sevenDayLabel = last7DayHomeRuns === null ? '—' : last7DayHomeRuns.toString();
  const sizeClasses = compact ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-1 text-[9px]';

  return (
    <span className="inline-flex shrink-0 flex-wrap items-center gap-1">
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded border border-ve-bronze/55 bg-ve-bronze/15 font-mono font-black tracking-wide text-ve-bronze ${sizeClasses}`}
        title={
          last7DayHomeRuns === null
            ? 'Seven-day home-run history is unavailable.'
            : `${last7DayHomeRuns} verified home run${last7DayHomeRuns === 1 ? '' : 's'} in the seven-calendar-day window ending on this slate date${player.last7DayGamesChecked != null ? ` across ${player.last7DayGamesChecked} game${player.last7DayGamesChecked === 1 ? '' : 's'}` : ''}.`
        }
        aria-label={`Seven-day home runs: ${last7DayHomeRuns === null ? 'unavailable' : last7DayHomeRuns}`}
      >
        <Flame className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} aria-hidden />
        <span>7Days HR:{sevenDayLabel}</span>
      </span>

      {hrResult === 'hit' ? (
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded border border-ve-live/55 bg-ve-live/15 font-mono font-black uppercase tracking-wide text-ve-live ${sizeClasses}`}
          title="Verified home run today from the MLB play-by-play feed."
          aria-label="Verified home run today"
        >
          <Flame className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} aria-hidden />
          Today HR
        </span>
      ) : null}
    </span>
  );
}

export function HrHitBadge({ event, compact = false, className = '' }: HrHitBadgeProps) {
  const title =
    event?.description?.trim() ||
    (event ? `Home run — ${event.halfInning}${event.inning}${event.rbi > 0 ? ` · ${event.rbi} RBI` : ''}` : 'Home run hit');

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 rounded border font-mono font-black uppercase tracking-wide ${
        compact ? 'px-1 py-0.5 text-[8px]' : 'px-1.5 py-0.5 text-[10px]'
      } ${className}`}
      style={{
        borderColor: 'rgba(245,158,11,0.45)',
        background: 'rgba(245,158,11,0.15)',
        color: '#fbbf24',
      }}
      title={title}
      aria-label="Home run hit"
    >
      <Flame className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} strokeWidth={2.5} aria-hidden />
      HR
    </span>
  );
}

export default HrHitBadge;
