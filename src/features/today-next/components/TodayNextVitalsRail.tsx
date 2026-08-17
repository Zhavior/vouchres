import { Activity, CheckCircle2, ClipboardList, Gamepad2, Radio } from 'lucide-react';
import type { TodayNextVitals } from '../hooks/useTodayNextHome';

interface TodayNextVitalsRailProps {
  vitals: TodayNextVitals;
}

export function TodayNextVitalsRail({ vitals }: TodayNextVitalsRailProps) {
  const cells = [
    { key: 'matchups', icon: Gamepad2, label: 'Matchups', value: vitals.matchups ?? '—', tone: 'text-white' },
    {
      key: 'live',
      icon: Radio,
      label: 'Live now',
      value: vitals.live,
      tone: vitals.live > 0 ? 'text-rose-300' : 'text-white/70',
    },
    { key: 'final', icon: CheckCircle2, label: 'Final', value: vitals.final, tone: 'text-white/70' },
    {
      key: 'signals',
      icon: Activity,
      label: 'Research rows',
      value: vitals.hrSignals ?? '—',
      tone: 'text-[var(--aurora-max-emerald)]',
    },
    {
      key: 'slips',
      icon: ClipboardList,
      label: 'Pending slips',
      value: vitals.pendingSlips,
      tone: vitals.pendingSlips > 0 ? 'text-amber-300' : 'text-white/70',
    },
  ];

  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-white/10 bg-black/40 font-mono sm:flex sm:items-stretch">
      {cells.map((cell, index) => {
        const Icon = cell.icon;
        return (
          <div
            key={cell.key}
            className={`min-w-0 px-3 py-2 sm:min-w-[92px] sm:flex-1 ${index % 2 ? 'border-l border-white/[0.07]' : ''} ${
              index >= 2 ? 'border-t border-white/[0.07] sm:border-t-0' : ''
            } ${index ? 'sm:border-l sm:border-white/[0.07]' : 'sm:border-l-0'}`}
          >
            <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-white/35">
              <Icon className="h-3 w-3" aria-hidden="true" />
              {cell.label}
            </span>
            <strong className={`mt-0.5 block text-sm font-black tabular-nums ${cell.tone}`}>{cell.value}</strong>
          </div>
        );
      })}
    </div>
  );
}
