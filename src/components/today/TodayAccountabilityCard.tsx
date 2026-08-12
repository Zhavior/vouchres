import { ArrowRight, CircleCheck, ClipboardList, Scale } from 'lucide-react';
import { useMemo } from 'react';
import type { Parlay } from '../../types';
import { AuroraMaxControl, AuroraMaxEyebrow, AuroraMaxPanel } from '../aurora-max/AuroraMaxPrimitives';

interface Props {
  savedSlips: Parlay[];
  finalGames: number;
  onSectionChange: (section: string) => void;
}

export default function TodayAccountabilityCard({ savedSlips, finalGames, onSectionChange }: Props) {
  const record = useMemo(() => {
    const settled = savedSlips.filter((slip) => slip.status !== 'PENDING');
    return {
      settled: settled.length,
      won: settled.filter((slip) => slip.status === 'WON').length,
      lost: settled.filter((slip) => slip.status === 'LOST').length,
      voided: settled.filter((slip) => slip.status === 'VOID').length,
    };
  }, [savedSlips]);

  const hasRecord = record.settled > 0;

  return (
    <AuroraMaxPanel as="section" id="today-accountability" className="relative overflow-hidden p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <AuroraMaxEyebrow className="flex items-center gap-2">
            <Scale className="h-3.5 w-3.5" aria-hidden="true" /> Results &amp; accountability
          </AuroraMaxEyebrow>
          <h2 className="mt-2 text-lg font-black tracking-tight text-white">
            {hasRecord ? `${record.settled} tracked result${record.settled === 1 ? '' : 's'} on your record` : 'Build an evidence record over time'}
          </h2>
          <p className="mt-1 text-xs leading-5 text-white/48">
            {hasRecord
              ? 'Review what you tracked against what actually happened. Wins, losses and voids remain visible.'
              : 'Save a researched decision before the game so the outcome can be reviewed honestly later.'}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--aurora-max-line-strong)] bg-[rgba(0,217,160,0.075)] text-[var(--aurora-max-emerald)]">
          {hasRecord ? <CircleCheck className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2" aria-label="Tracked results summary">
        <RecordStat label="Won" value={record.won} tone="text-vouch-emerald" />
        <RecordStat label="Lost" value={record.lost} tone="text-rose-300" />
        <RecordStat label="Void" value={record.voided} tone="text-white/65" />
        <RecordStat label="Games final" value={finalGames} tone="text-vouch-cyan" />
      </div>

      <AuroraMaxControl
        onClick={() => onSectionChange(hasRecord ? 'results' : 'build')}
        className="mt-4 min-h-11 w-full"
      >
        {hasRecord ? 'Review tracked results' : 'Research a decision'} <ArrowRight className="h-4 w-4" />
      </AuroraMaxControl>
    </AuroraMaxPanel>
  );
}

function RecordStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="border border-[var(--aurora-max-line)] bg-black/25 px-2 py-2.5 text-center">
      <p className={`font-mono text-sm font-black ${tone}`}>{value}</p>
      <p className="mt-0.5 truncate text-[8px] font-bold uppercase tracking-wider text-white/35">{label}</p>
    </div>
  );
}
