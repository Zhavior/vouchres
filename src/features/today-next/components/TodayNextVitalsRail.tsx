import { Activity, CheckCircle2, ClipboardList, Gamepad2, Radio } from 'lucide-react';
import type { TodayNextVitals } from '../hooks/useTodayNextHome';

interface TodayNextVitalsRailProps {
  vitals: TodayNextVitals;
}

export function TodayNextVitalsRail({ vitals }: TodayNextVitalsRailProps) {
  const cells = [
    { key: 'matchups', icon: Gamepad2, label: 'MATCHUPS', value: vitals.matchups ?? '—', tone: 'text-white', badge: 'SLATE' },
    {
      key: 'live',
      icon: Radio,
      label: 'LIVE NOW',
      value: vitals.live,
      tone: vitals.live > 0 ? 'text-rose-400' : 'text-zinc-400',
      badge: vitals.live > 0 ? 'ACTIVE' : 'IDLE',
      isLive: vitals.live > 0,
    },
    { key: 'final', icon: CheckCircle2, label: 'FINAL SCORES', value: vitals.final, tone: 'text-zinc-300', badge: 'OFFICIAL' },
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
    <div className="grid grid-cols-2 sm:grid-cols-5 border-2 border-white/15 bg-black font-mono shadow-xl divide-y sm:divide-y-0 sm:divide-x divide-white/10">
      {cells.map((cell) => {
        const Icon = cell.icon;
        return (
          <div
            key={cell.key}
            className="p-3 sm:p-4 flex flex-col justify-between space-y-1.5 hover:bg-zinc-950/60 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                <Icon className={`h-3 w-3 ${cell.isLive ? 'text-rose-400 animate-pulse' : 'text-zinc-400'}`} aria-hidden="true" />
                {cell.label}
              </span>
              <span className="text-[7px] font-bold px-1 border border-white/10 text-zinc-500 uppercase">
                {cell.badge}
              </span>
            </div>
            <strong className={`block text-lg sm:text-xl font-black tabular-nums ${cell.tone}`}>
              {cell.value}
            </strong>
          </div>
        );
      })}
    </div>
  );
}

