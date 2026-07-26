import { Database, HardDrive, Info, LockKeyhole } from 'lucide-react';
import { AURORA_LABEL, AURORA_PANEL, AURORA_SURFACE } from '../../theme/auroraTokens';
import { ScorePill } from '../ui/primitives';
import type { ResultsAuroraSummary } from './resultsAuroraModel';

interface ResultsLedgerSummaryProps {
  summary: ResultsAuroraSummary;
}

export function ResultsLedgerSummary({ summary }: ResultsLedgerSummaryProps) {
  return (
    <section className={`${AURORA_PANEL} p-4`} aria-labelledby="aurora-record-state-title">
      <div>
        <p className={`${AURORA_LABEL} text-vouch-cyan`}>Aurora record state</p>
        <h2 id="aurora-record-state-title" className="mt-1 text-lg font-black tracking-tight text-white">
          What is actually recorded
        </h2>
      </div>

      {summary.total === 0 ? (
        <p className="py-4 text-sm leading-6 text-white/50">
          No saved slips yet. Save a decision to begin a track record.
        </p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <ScorePill label="Pending" value={summary.pending} />
            <ScorePill label="Won" value={summary.won} color="#31B583" />
            <ScorePill label="Lost" value={summary.lost} color="#f87171" />
            <ScorePill label="Void" value={summary.voids} color="#94a3b8" />
            <ScorePill
              label="Win rate"
              value={summary.winRate === null ? 'Unavailable' : `${summary.winRate}%`}
              color="#31B583"
            />
          </div>

          <div className="mt-3 grid gap-px bg-white/10">
            <RecordCoverageRow icon={Database} label="Backend synced" value={summary.synced} />
            <RecordCoverageRow icon={HardDrive} label="Local only" value={summary.localOnly} />
            <RecordCoverageRow icon={LockKeyhole} label="Locked before outcome" value={summary.committedBeforeOutcome} />
          </div>
        </>
      )}

      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-white/40">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Local status is shown as local status. Aurora does not label a record verified without a durable backend source.
      </p>
    </section>
  );
}

interface RecordCoverageRowProps {
  icon: typeof Database;
  label: string;
  value: number;
}

function RecordCoverageRow({ icon: Icon, label, value }: RecordCoverageRowProps) {
  return (
    <div className={`${AURORA_SURFACE} flex min-h-11 items-center justify-between gap-3 px-3 py-2`}>
      <span className="flex items-center gap-2 text-xs text-white/55">
        <Icon className="h-3.5 w-3.5 text-vouch-cyan" aria-hidden="true" />
        {label}
      </span>
      <span className="font-mono text-sm font-black tabular-nums text-white">{value}</span>
    </div>
  );
}
