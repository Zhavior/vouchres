import { Flame } from 'lucide-react';
import type { HrEvent } from '../../../types/notifications';

export interface HrHitBadgeProps {
  event: HrEvent;
  /** Tighter sizing for table rows and treemap tiles */
  compact?: boolean;
  className?: string;
}

/** Real box-score HR — same trust signal as HR Intelligence cards. */
export function HrHitBadge({ event, compact = false, className = '' }: HrHitBadgeProps) {
  const title =
    event.description?.trim() ||
    `Home run — ${event.halfInning}${event.inning}${event.rbi > 0 ? ` · ${event.rbi} RBI` : ''}`;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 border font-mono font-black uppercase tracking-wide ${
        compact ? 'px-1 py-0.5 text-[8px]' : 'px-1.5 py-0.5 text-[10px]'
      } ${className}`}
      style={{
        borderColor: 'rgba(245,158,11,0.45)',
        background: 'rgba(245,158,11,0.15)',
        color: '#fbbf24',
      }}
      title={title}
      aria-label={`${event.playerName} hit a home run`}
    >
      <Flame className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} strokeWidth={2.5} aria-hidden />
      HR
    </span>
  );
}

export default HrHitBadge;
