import React, { Suspense, lazy, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { PanelErrorBoundary } from '../../common/PanelErrorBoundary';
import { ParlayOsPanelSkeleton } from './parlayOsUi';

const ResultsStudio = lazy(() => import('../../results/ResultsStudio'));

export default function ParlayOsTrackRecordPanel({
  savedSlips,
  onSectionChange,
}: {
  savedSlips: unknown[];
  onSectionChange?: (section: string) => void;
}) {
  const mappedParlays = useMemo(() => (
    savedSlips.map((s) => {
      const rec = s as Record<string, unknown>;
      return {
        id: String(rec.publicId ?? rec.sourceId ?? rec.id ?? Math.random()),
        title: String(rec.title ?? 'Saved Parlay'),
        legs: Array.isArray(rec.legs) ? rec.legs : [],
        status: String(rec.status ?? 'PENDING').toUpperCase(),
        createdAt: String(rec.createdAt ?? new Date().toISOString()),
        riskTier: String(rec.riskTier ?? 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
        oddsValue: Number(rec.oddsValue ?? 0),
        totalOdds: String(rec.totalOdds ?? ''),
        wagerAmount: Number(rec.wagerAmount ?? 0),
      };
    })
  ), [savedSlips]);

  return (
    <div className="flex flex-col gap-0">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <p className="text-xs text-[hsl(var(--ve-text-muted))]">
          Every saved slip — graded from the official box score. No cherry-picking.
        </p>
        {onSectionChange ? (
          <button
            type="button"
            onClick={() => onSectionChange('results')}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest min-h-[2.75rem] transition-all bg-cyan-500/10 border border-cyan-400/30 text-cyan-300"
            aria-label="Open full Results page"
          >
            <TrendingUp className="w-3 h-3" aria-hidden="true" />
            Full Results
          </button>
        ) : null}
      </div>

      <PanelErrorBoundary>
        <Suspense fallback={<ParlayOsPanelSkeleton label="Loading track record" />}>
          <ResultsStudio
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            savedParlays={mappedParlays as any}
          />
        </Suspense>
      </PanelErrorBoundary>
    </div>
  );
}
