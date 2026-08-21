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
      tone: vitals.live > 0 ? 'text-rose-400' : 'text-zinc-400',
      badge: vitals.live > 0 ? 'ACTIVE' : 'IDLE',
      isLive: vitals.live > 0,
    },
    {
      key: 'final',
      icon: CheckCircle2,
      label: 'FINAL SCORES',
      value: vitals.final,
      tone: 'text-zinc-300',
      badge: 'OFFICIAL',
    },
    {
      key: 'signals',
      icon: Activity,
      label: 'RESEARCH ROWS',
      value: vitals.hrSignals ?? '—',
      tone: 'text-emerald-400',
      badge: 'VERIFIED',
    },
    {
      key: 'slips',
      icon: ClipboardList,
      label: 'PENDING SLIPS',
      value: vitals.pendingSlips,
      tone: vitals.pendingSlips > 0 ? 'text-amber-300' : 'text-zinc-400',
      badge: 'TRACKED',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {cells.map((cell) => {
        const Icon = cell.icon;
        return (
          <div
            key={cell.key}
            className="bg-[#111113] border border-white/[0.08] rounded-xl p-4 sm:p-5 shadow-2xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
                {cell.isLive ? (
                  <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" aria-hidden="true" />
                ) : (
                  <Icon className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
                )}
                {cell.label}
              </span>
              <span className="text-[8px] font-mono font-medium px-1.5 py-0.5 rounded border border-white/[0.06] text-zinc-400 uppercase tracking-wider">
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
