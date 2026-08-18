import React, { Suspense, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import type { CreatorProofProfile, Leg, Parlay } from '../../../types';
import { PanelErrorBoundary } from '../../common/PanelErrorBoundary';
import { ParlayOsPanelSkeleton } from './parlayOsUi';
import { lazyWithRetry } from '../../../lib/lazyWithRetry';

const ResultsStudio = lazyWithRetry(() => import('../../results/ResultsStudio'), { label: 'ResultsStudio' });

export default function ParlayOsTrackRecordPanel({
  savedSlips,
  profile,
  onSectionChange,
}: {
  savedSlips: unknown[];
  /** Drives slip ownership in ResultsStudio; without it every slip reads "You". */
  profile?: CreatorProofProfile;
  onSectionChange?: (section: string) => void;
}) {
  const mappedParlays = useMemo<Parlay[]>(() => (
    savedSlips.map((s, index) => {
      const rec = s as Record<string, unknown>;
      const status = String(rec.status ?? '').toUpperCase();
      const normalizedStatus: Parlay['status'] =
        status === 'WON' || status === 'LOST' || status === 'VOID' ? status : 'PENDING';

      return {
        id: String(rec.publicId ?? rec.sourceId ?? rec.id ?? `local-slip-${index}`),
        title: String(rec.title ?? 'Saved Parlay'),
        legs: (Array.isArray(rec.legs) ? rec.legs : []) as Leg[],
        status: normalizedStatus,
        createdAt: typeof rec.createdAt === 'string' ? rec.createdAt : '',
        riskTier: String(rec.riskTier ?? 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
        oddsValue: Number(rec.oddsValue ?? 0),
        totalOdds: String(rec.totalOdds ?? ''),
        wagerAmount: typeof rec.wagerAmount === 'number' ? rec.wagerAmount : undefined,
        backendPickId: typeof rec.backendPickId === 'string' ? rec.backendPickId : undefined,
        backendSyncState: typeof rec.backendSyncState === 'string'
          ? rec.backendSyncState as Parlay['backendSyncState']
          : undefined,
        trustCommittedAt: typeof rec.trustCommittedAt === 'string' ? rec.trustCommittedAt : undefined,
      };
    })
  ), [savedSlips]);

  return (
    <div className="flex flex-col gap-0">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <p className="text-xs text-[hsl(var(--ve-text-muted))]">
          Saved slips and their current recorded states. Backend-synced and local records remain distinct.
        </p>
        {onSectionChange ? (
          <button
            type="button"
            onClick={() => onSectionChange('results')}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest min-h-[2.75rem] transition-all bg-emerald-500/10 border border-emerald-400/30 text-emerald-300"
            aria-label="Open full Results page"
          >
            <TrendingUp className="w-3 h-3" aria-hidden="true" />
            Full Results
          </button>
        ) : null}
      </div>

      <PanelErrorBoundary>
        <Suspense fallback={<ParlayOsPanelSkeleton label="Loading track record" />}>
          <ResultsStudio savedParlays={mappedParlays} profile={profile} />
        </Suspense>
      </PanelErrorBoundary>
    </div>
  );
}
