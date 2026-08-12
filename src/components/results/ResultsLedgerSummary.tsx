import { Info } from 'lucide-react';
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
    <AuroraMaxPanel as="section" className="p-3 sm:p-4" ariaLabelledBy="results-record-state-title">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <AuroraMaxEyebrow>Receipt coverage</AuroraMaxEyebrow>
          <h2 id="results-record-state-title" className="mt-1 text-lg font-black tracking-tight text-white">
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

      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-white/40">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Local status remains explicitly local. VouchEdge does not label a record verified without a durable backend source.
      </p>
    </AuroraMaxPanel>
  );
}
