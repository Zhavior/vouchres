import { ArrowRight, CircleCheck, ClipboardList, Scale } from 'lucide-react';
import { useMemo } from 'react';
import type { Parlay } from '../../types';
import { AURORA_LABEL } from '../../theme/auroraTokens';

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
    <section id="today-accountability" className="relative overflow-hidden rounded-2xl border border-white/12 bg-[linear-gradient(145deg,rgba(9,20,32,.96),rgba(4,9,16,.98))] p-4 shadow-xl sm:p-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-vouch-emerald/65 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`${AURORA_LABEL} flex items-center gap-2 text-vouch-emerald`}>
            <Scale className="h-3.5 w-3.5" aria-hidden="true" /> Results &amp; accountability
          </p>
          <h2 className="mt-2 text-lg font-black tracking-tight text-white">
            {hasRecord ? `${record.settled} tracked result${record.settled === 1 ? '' : 's'} on your record` : 'Build an evidence record over time'}
          </h2>
          <p className="mt-1 text-xs leading-5 text-white/65">
            {hasRecord
              ? 'Review what you tracked against what actually happened. Wins, losses and voids remain visible.'
              : 'Save a researched decision before the game so the outcome can be reviewed honestly later.'}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-vouch-emerald/25 bg-vouch-emerald/10 text-vouch-emerald">
          {hasRecord ? <CircleCheck className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2" aria-label="Tracked results summary">
        <RecordStat label="Won" value={record.won} tone="text-vouch-emerald" />
        <RecordStat label="Lost" value={record.lost} tone="text-rose-300" />
        <RecordStat label="Void" value={record.voided} tone="text-white/65" />
        <RecordStat label="Games final" value={finalGames} tone="text-vouch-cyan" />
      </div>

      <button
        type="button"
        onClick={() => onSectionChange(hasRecord ? 'results' : 'build')}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-vouch-emerald/35 bg-vouch-emerald/10 px-4 text-xs font-black text-vouch-emerald transition hover:bg-vouch-emerald/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vouch-emerald"
      >
        {hasRecord ? 'Review tracked results' : 'Research a decision'} <ArrowRight className="h-4 w-4" />
      </button>
    </section>
  );
}

function RecordStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/25 px-2 py-2.5 text-center">
      <p className={`font-mono text-sm font-black ${tone}`}>{value}</p>
      <p className="mt-0.5 truncate text-[8px] font-bold uppercase tracking-wider text-white/60">{label}</p>
    </div>
  );
}
