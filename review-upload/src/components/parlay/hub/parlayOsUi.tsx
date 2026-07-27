import React from 'react';
import {
  LEG_STATUS_META,
  type LegGradeStatus,
  type SlipGradeStatus,
} from '../types/parlayOsTypes';
import { z8StatusColor } from '../../../theme/z8Tokens';
import { withAlpha } from '../../../theme/colors';

function statusColorStyle(token: string) {
  const color = z8StatusColor(token);
  return {
    color,
    borderColor: withAlpha(color, 0.4),
    background: withAlpha(color, 0.12),
  };
}

export function ParlayOsStatusBadge({
  status,
  size = 'sm',
}: {
  status: LegGradeStatus | SlipGradeStatus;
  size?: 'xs' | 'sm';
}) {
  const meta = (LEG_STATUS_META as Record<string, typeof LEG_STATUS_META[LegGradeStatus]>)[status]
    ?? LEG_STATUS_META.pending;
  const sz = size === 'xs' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-bold uppercase tracking-wide ${sz}`}
      style={statusColorStyle(meta.token)}
    >
      <span aria-hidden="true">{meta.icon}</span>
      {meta.label}
    </span>
  );
}

export function ParlayOsLivePulse({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="flex h-5 items-end gap-[3px]" aria-label="Live parlay activity" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((bar) => (
        <span
          key={bar}
          className="w-[3px] rounded-full bg-vouch-cyan/90"
          style={{
            height: `${8 + (bar % 3) * 4}px`,
            boxShadow: '0 0 8px rgba(0,240,255,0.5)',
            animation: 've-cmd-live-bar 0.9s ease-in-out infinite',
            animationDelay: `${bar * 110}ms`,
          }}
        />
      ))}
    </div>
  );
}

export function ParlayOsPanelSkeleton({ label = 'Loading panel' }: { label?: string }) {
  return (
    <div className="flex flex-col gap-3 py-8 animate-pulse" aria-busy="true" aria-label={label}>
      <div className="h-4 w-40 rounded bg-white/[0.06]" />
      <div className="h-24 rounded-xl bg-white/[0.04] border border-white/[0.06]" />
      <div className="h-24 rounded-xl bg-white/[0.04] border border-white/[0.06]" />
    </div>
  );
}
