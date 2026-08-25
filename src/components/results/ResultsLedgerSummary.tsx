import { ShieldCheck } from 'lucide-react';
import type { ResultsRecordSummary } from './resultsRecordModel';

interface ResultsLedgerSummaryProps {
  summary: ResultsRecordSummary;
}

function Figure({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'confirmed' | 'warning' }) {
  const valueTone =
    tone === 'confirmed' ? 'text-ve-emerald' : tone === 'warning' ? 'text-white/60' : 'text-white';
  return (
    <div className="min-w-0 border-l border-white/5 px-4 py-4 first:border-l-0">
      <div className={`text-2xl font-bold italic tracking-tighter ${valueTone}`}>{value}</div>
      <span className="terminal-text mt-1 block">{label}</span>
    </div>
  );
}

/**
 * What is actually recorded. Local status stays labelled local — the ladder
 * exists so a record without a durable backend receipt can never read as
 * verified.
 */
export function ResultsLedgerSummary({ summary }: ResultsLedgerSummaryProps) {
  return (
    <section className="border border-white/5 bg-white/[0.01] p-5" aria-labelledby="results-record-state-title">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <span className="terminal-text text-ve-emerald">Receipt coverage</span>
          <h2 id="results-record-state-title" className="mt-2 text-lg font-bold italic tracking-tighter text-white">
            What is actually recorded
          </h2>
        </div>
        <span
          className={`border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-widest ${
            summary.synced > 0 ? 'border-ve-emerald/40 text-ve-emerald' : 'border-white/10 text-white/30'
          }`}
        >
          {summary.synced > 0 ? 'Backend receipts present' : 'Local records only'}
        </span>
      </div>

      {summary.total === 0 ? (
        <p className="py-8 text-center font-mono text-[10px] uppercase tracking-widest text-white/20">
          Save a decision to begin a traceable record
        </p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-4 border border-white/5">
            <Figure label="Pending" value={summary.pending} tone="warning" />
            <Figure label="Won" value={summary.won} tone="confirmed" />
            <Figure label="Lost" value={summary.lost} />
            <Figure label="Void" value={summary.voids} />
          </div>

          <dl className="mt-4 space-y-2">
            {([
              ['Backend synced', summary.synced, summary.synced > 0],
              ['Local only', summary.localOnly, summary.localOnly === 0],
              ['Locked before outcome', summary.committedBeforeOutcome, summary.committedBeforeOutcome > 0],
            ] as const).map(([label, value, good]) => (
              <div key={label} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-b-0">
                <dt className="font-mono text-[10px] uppercase tracking-widest text-white/30">{label}</dt>
                <dd className={`font-mono text-[11px] font-bold ${good ? 'text-ve-emerald' : 'text-white/40'}`}>{value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      <p className="mt-5 flex items-start gap-2 border-t border-white/5 pt-4 text-[10px] leading-relaxed text-white/30">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ve-emerald" aria-hidden="true" />
        Local status remains explicitly local. VouchEdge does not label a record verified without a durable backend source.
      </p>
    </section>
  );
}
