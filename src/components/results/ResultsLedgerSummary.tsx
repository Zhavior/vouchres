import { Info, ShieldCheck } from 'lucide-react';
import {
  AuroraMaxEvidenceLadder,
  AuroraMaxEyebrow,
  AuroraMaxFallback,
  AuroraMaxMetricStrip,
  AuroraMaxPanel,
  AuroraMaxTruthBadge,
} from '../aurora-max/AuroraMaxPrimitives';
import type { ResultsRecordSummary } from './resultsRecordModel';

interface ResultsLedgerSummaryProps {
  summary: ResultsRecordSummary;
}

export function ResultsLedgerSummary({ summary }: ResultsLedgerSummaryProps) {
  return (
    <AuroraMaxPanel as="section" className="p-3 sm:p-4 border-2 border-white/15 bg-black font-mono shadow-2xl" ariaLabelledBy="results-record-state-title">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <AuroraMaxEyebrow>RECEIPT COVERAGE</AuroraMaxEyebrow>
          <h2 id="results-record-state-title" className="mt-1 text-base font-black uppercase tracking-wider text-white">
            What is actually recorded
          </h2>
        </div>
        <AuroraMaxTruthBadge state={summary.synced > 0 ? 'confirmed' : 'missing'}>
          {summary.synced > 0 ? 'Backend receipts present' : 'Local records only'}
        </AuroraMaxTruthBadge>
      </div>

      {summary.total === 0 ? (
        <AuroraMaxFallback compact title="No record yet" detail="Save a decision to begin a traceable record." />
      ) : (
        <>
          <AuroraMaxMetricStrip
            className="mt-4"
            items={[
              { label: 'Pending', value: summary.pending, tone: 'warning' },
              { label: 'Won', value: summary.won, tone: 'confirmed' },
              { label: 'Lost', value: summary.lost, tone: 'neutral' },
              { label: 'Void', value: summary.voids, tone: 'neutral' },
            ]}
          />
          <AuroraMaxEvidenceLadder
            meta={`${summary.total} saved`}
            items={[
              { label: 'Backend synced', value: summary.synced, tone: summary.synced > 0 ? 'confirmed' : 'missing' },
              { label: 'Local only', value: summary.localOnly, tone: summary.localOnly > 0 ? 'warning' : 'confirmed' },
              { label: 'Locked before outcome', value: summary.committedBeforeOutcome, tone: summary.committedBeforeOutcome > 0 ? 'confirmed' : 'missing' },
            ]}
          />
        </>
      )}

      <p className="mt-4 flex items-start gap-2 text-[10px] leading-relaxed text-zinc-400 border-t border-white/10 pt-3">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" aria-hidden="true" />
        Local status remains explicitly local. VouchEdge does not label a record verified without a durable backend source.
      </p>
    </AuroraMaxPanel>
  );
}
