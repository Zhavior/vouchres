import React from 'react';

type SidebarLiveOnAirBadgeProps = {
  /** Icon-only sidebar rail — show a pulsing dot instead of the LIVE pill */
  compact?: boolean;
  className?: string;
};

export const SidebarLiveOnAirBadge = React.memo(function SidebarLiveOnAirBadge({
  compact = false,
  className = '',
}: SidebarLiveOnAirBadgeProps) {
  if (compact) {
    return (
      <span
        className={`ve-live-on-air-dot h-2 w-2 shrink-0 rounded-full bg-rose-500 ${className}`}
        aria-label="Live games in progress"
        title="Live now"
      />
    );
  }

  return (
    <span
      className={`ve-live-on-air-pill inline-flex shrink-0 items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/12 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-rose-300 ${className}`}
      aria-label="Live games in progress"
      title="Live now"
    >
      <span className="ve-live-on-air-dot h-1.5 w-1.5 rounded-full bg-rose-400" aria-hidden />
      LIVE
    </span>
  );
});
