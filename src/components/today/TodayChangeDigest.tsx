import React from 'react';
import { ArrowRight, Check, CircleAlert, RefreshCw, ShieldCheck } from 'lucide-react';
import type { TodayChange, TodayChangeKind } from './todayChangeDigestModel';
import { AuroraMaxControl, AuroraMaxEyebrow, AuroraMaxPanel } from '../aurora-max/AuroraMaxPrimitives';

interface Props {
  changes: TodayChange[];
  baselineCapturedAt?: string | null;
  onMarkAsChecked: () => void;
  onOpenSubject?: (change: TodayChange) => void;
}

const KIND_META: Record<TodayChangeKind, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  lineup: { label: 'Lineup', icon: ShieldCheck, tone: 'text-vouch-emerald' },
  'game-final': { label: 'Final', icon: Check, tone: 'text-vouch-cyan' },
  'game-status': { label: 'Game status', icon: RefreshCw, tone: 'text-vouch-cyan' },
  research: { label: 'Research', icon: CircleAlert, tone: 'text-amber-300' },
};

export default function TodayChangeDigest({ changes, baselineCapturedAt, onMarkAsChecked, onOpenSubject }: Props) {
  if (changes.length === 0) return null;

  return (
    <AuroraMaxPanel as="section" ariaLabelledBy="today-change-digest-title" className="overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-4 py-4 sm:px-5">
        <div>
          <AuroraMaxEyebrow>Since your last check</AuroraMaxEyebrow>
          <h2 id="today-change-digest-title" className="mt-1 text-lg font-black tracking-tight text-white">What changed</h2>
          {baselineCapturedAt ? <p className="mt-1 text-[10px] text-white/35">Compared with {formatCheckedTime(baselineCapturedAt)}</p> : null}
        </div>
        <AuroraMaxControl type="button" onClick={onMarkAsChecked} className="min-h-10 shrink-0 px-3 text-[10px]">
          Mark checked
        </AuroraMaxControl>
      </div>

      <ol className="divide-y divide-white/[0.07]">
        {changes.map((change) => {
          const meta = KIND_META[change.kind];
          const Icon = meta.icon;
          return (
            <li key={change.id} className="flex items-start gap-3 px-4 py-4 sm:px-5">
              <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--aurora-max-line)] bg-black/25 ${meta.tone}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`aurora-max-eyebrow ${meta.tone}`}>{meta.label}</p>
                <h3 className="mt-1 text-sm font-black text-white">{change.title}</h3>
                <p className="mt-1 text-xs leading-5 text-white/50">{change.detail}</p>
              </div>
              {onOpenSubject ? (
                <AuroraMaxControl type="button" onClick={() => onOpenSubject(change)} aria-label={`Open ${change.title}`} className="h-10 w-10 shrink-0 p-0">
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </AuroraMaxControl>
              ) : null}
            </li>
          );
        })}
      </ol>
    </AuroraMaxPanel>
  );
}

function formatCheckedTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'the previous saved snapshot';
  return parsed.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
