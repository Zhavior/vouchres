import React from 'react';
import { Activity, CheckCircle2, ClipboardList, Gamepad2, Radio } from 'lucide-react';
import type { TodayNextVitals } from '../hooks/useTodayNextHome';

interface TodayNextVitalsRailProps {
  vitals: TodayNextVitals;
}

export function TodayNextVitalsRail({ vitals }: TodayNextVitalsRailProps) {
  const cells = [
    {
      key: 'matchups',
      icon: Gamepad2,
      label: 'MATCHUPS',
      value: vitals.matchups ?? '—',
      tone: 'text-white',
      badge: 'SLATE',
    },
    {
      key: 'live',
      icon: Radio,
      label: 'LIVE NOW',
      value: vitals.live,
      tone: vitals.live > 0 ? 'text-ve-red' : 'text-white/55',
      badge: vitals.live > 0 ? 'ACTIVE' : 'IDLE',
      isLive: vitals.live > 0,
    },
    {
      key: 'final',
      icon: CheckCircle2,
      label: 'FINAL SCORES',
      value: vitals.final,
      tone: 'text-white/70',
      badge: 'OFFICIAL',
    },
    {
      key: 'signals',
      icon: Activity,
      label: 'RESEARCH ROWS',
      value: vitals.hrSignals ?? '—',
      tone: 'text-ve-emerald',
      badge: 'VERIFIED',
    },
    {
      key: 'slips',
      icon: ClipboardList,
      label: 'PENDING SLIPS',
      value: vitals.pendingSlips,
      tone: vitals.pendingSlips > 0 ? 'text-ve-amber' : 'text-white/55',
      badge: 'TRACKED',
    },
  ];

  return (
    /* Open register rather than five boxes: one rule above, one rule between
       columns. The figures are telemetry, so they stay mono and tabular. */
    <div className="grid grid-cols-2 border-t border-white/[0.08] sm:grid-cols-3 lg:grid-cols-5">
      {cells.map((cell) => {
        const Icon = cell.icon;
        return (
          <div
            key={cell.key}
            className="flex flex-col justify-between border-b border-white/[0.08] px-4 py-4 sm:px-5 sm:py-5 [&:not(:nth-child(2n+1))]:border-l sm:[&:not(:nth-child(3n+1))]:border-l sm:[&:nth-child(3n+1)]:border-l-0 lg:[&:not(:nth-child(5n+1))]:border-l lg:[&:nth-child(3n+1)]:border-l [&]:border-white/[0.08]"
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider text-white/55 uppercase">
                {cell.isLive ? (
                  <span className="h-2 w-2 rounded-full bg-ve-red animate-pulse" aria-hidden="true" />
                ) : (
                  <Icon className="h-3.5 w-3.5 text-white/55" aria-hidden="true" />
                )}
                {cell.label}
              </span>
              <span className="text-[8px] font-mono font-medium uppercase tracking-[0.18em] text-white/30">
                {cell.badge}
              </span>
            </div>
            <div className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight mt-1 tabular-nums ${cell.tone}`}>
              {cell.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TodayNextVitalsRail;
