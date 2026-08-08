import React from 'react';
import { Flame } from 'lucide-react';
import type { HrEvent } from '../../../types/notifications';

export interface HrHitBadgeProps {
  event?: HrEvent;
  compact?: boolean;
  className?: string;
}

export function hasPlayerHitHr(player: any): boolean {
  if (!player) return false;
  if (typeof player.recentHomeRuns === 'number' && player.recentHomeRuns > 0) return true;
  if (typeof player.recentHrGames === 'number' && player.recentHrGames > 0) return true;
  if (player.hasHitHr || player.hitHr || player.hrHit || player.hrResult === 'hit') return true;
  return false;
}

export function PlayerHrTag({ player, compact = false }: { player: any; compact?: boolean }) {
  if (!hasPlayerHitHr(player)) return null;

  const hitToday = player?.hasHitHr || player?.hitHr || player?.hrHit || player?.hrResult === 'hit';
  const hrCount = player?.recentHomeRuns || player?.homeRunsHit || 1;

  if (hitToday) {
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded border border-emerald-400/50 bg-gradient-to-r from-emerald-500/25 to-green-500/25 font-mono font-black uppercase tracking-wider text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)] ${
          compact ? 'px-1 py-0.5 text-[8px]' : 'px-1.5 py-0.5 text-[9px]'
        }`}
        title="Player hit a Home Run today!"
      >
        <Flame className={compact ? 'h-2.5 w-2.5 text-emerald-400' : 'h-3 w-3 text-emerald-400'} />
        <span>{compact ? 'HR TODAY' : 'MADE ONE TODAY'}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded border border-amber-400/50 bg-gradient-to-r from-amber-500/25 to-yellow-500/25 font-mono font-black uppercase tracking-wider text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)] ${
        compact ? 'px-1 py-0.5 text-[8px]' : 'px-1.5 py-0.5 text-[9px]'
      }`}
      title="Player hit Home Runs recently"
    >
      <Flame className={compact ? 'h-2.5 w-2.5 text-amber-400' : 'h-3 w-3 text-amber-400'} />
      <span>{compact ? `${hrCount} HR / L7` : `${hrCount} HR / in last 7 games`}</span>
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
