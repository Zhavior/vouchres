import React, { Suspense, lazy, useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { PanelErrorBoundary } from '../../common/PanelErrorBoundary';
import LazyChunkSkeleton from '../../system/LazyChunkSkeleton';
import SmartParlaySlipCard from '../smart/SmartParlaySlipCard';
import { ParlayTreeModal } from '../tree/ParlayTreeModal';
import {
  selectSavedSlips,
  useParlayCommandStore,
} from '../../../stores/parlayCommandStore';
import type { PublicParlaySlip } from '../../../lib/parlayDisplay';
import { projectSmartParlayFromPublic } from '../../../domain/parlay';
import { classifyParlayHistoryTab } from '../../../lib/trustLockSchedule';
import type { TrustAudience } from '../../../lib/trustLockSchedule';
import { repairAllSavedParlays } from '../../../lib/parlays/repairSavedParlay';
import { useAppCommandStore } from '../../../stores/appCommandStore';
import { useParlayOsStore } from '../../../stores/parlayOsStore';
import { useSlipsStore } from '../../../stores/slipsStore';
import { ParlayHubLivePulse } from './parlayHubUi';

const ParlayCorrelationGraph = lazy(() => import('../graph/ParlayCorrelationGraph'));

function EmptyLiveParlays() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="text-5xl" aria-hidden="true">📋</div>
      <h3 className="text-sm font-bold text-[hsl(var(--ve-text-primary))]">No parlays saved yet</h3>
      <p className="text-xs text-[hsl(var(--ve-text-muted))] max-w-xs">
        Build a slip and save it — it will appear here for live tracking and grading.
      </p>
    </div>
  );
}

export default function ParlayHubHistoryPanel() {
  const savedSlips = useParlayCommandStore(selectSavedSlips);
  const liveGames = useAppCommandStore((s) => s.liveGames);
  const syncSlips = useSlipsStore((s) => s.syncSlips);
  const hydrateSavedSlips = useParlayCommandStore((s) => s.hydrateSavedSlips);
  const navigateSection = useAppCommandStore((s) => s.navigateSection);
  const openProofPage = useParlayOsStore((s) => s.openProofPage);
  const [treeSlip, setTreeSlip] = useState<PublicParlaySlip | null>(null);
  const [historyTab, setHistoryTab] = useState<TrustAudience>('private');

  const smartSlips = useMemo(
    () => savedSlips.map((slip) => projectSmartParlayFromPublic(slip, liveGames)),
    [savedSlips, liveGames],
  );

  const liveSlips = useMemo(
    () => smartSlips.filter((s) =>
      ['pending', 'live', 'open', 'active', 'in_progress', 'upcoming'].includes(String(s.status).toLowerCase())
      && !s.trustCommittedAt && !s.feedLockedAt,
    ),
    [smartSlips],
  );
  const gradedSlips = useMemo(
    () => smartSlips.filter((s) =>
      ['won', 'lost', 'push', 'void', 'cancelled'].includes(String(s.status).toLowerCase()),
    ),
    [smartSlips],
  );
  const historySlips = useMemo(
    () => smartSlips.filter((s) => {
      const raw = savedSlips.find((slip) => slip.sourceId === s.sourceId);
      const tab = classifyParlayHistoryTab({
        trustAudience: raw?.trustAudience as TrustAudience | undefined,
        visibility: raw?.trustAudience ?? undefined,
        committedAt: raw?.trustCommittedAt ?? undefined,
        feedLockedAt: raw?.feedLockedAt ?? undefined,
      });
      if (tab === 'draft') return false;
      return tab === historyTab;
    }),
    [smartSlips, savedSlips, historyTab],
  );

  const pendingRepairCount = useMemo(
    () => smartSlips.filter((slip) => !slip.identity.complete).length,
    [smartSlips],
  );

  if (savedSlips.length === 0) return <EmptyLiveParlays />;

  function handleRepairAllSaved() {
    const raw = useSlipsStore.getState().savedSlips;
    const { parlays, changed } = repairAllSavedParlays(raw, liveGames);
    if (changed) {
      syncSlips(parlays);
      hydrateSavedSlips(parlays);
    }
  }

  function openSlipProof(pickId: string | null) {
    if (!pickId) return;
    openProofPage(pickId);
    navigateSection('parlay_proof');
  }

  function Section({ title, slips, live }: { title: string; slips: typeof smartSlips; live?: boolean }) {
    if (slips.length === 0) return null;
    return (
      <section aria-label={title}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--ve-text-muted))]">{title}</span>
          {live ? <ParlayHubLivePulse active /> : null}
        </div>
        <div className="flex flex-col gap-2">
          {slips.map((slip) => {
            const publicSlip = savedSlips.find((s) => s.sourceId === slip.sourceId);
            return (
              <SmartParlaySlipCard
                key={slip.sourceId}
                slip={slip}
                onViewStructure={publicSlip ? () => setTreeSlip(publicSlip) : undefined}
                onViewProof={slip.proofPickId ? () => openSlipProof(slip.proofPickId) : undefined}
              />
            );
          })}
        </div>
      </section>
    );
  }

  const HISTORY_TABS: Array<{ id: TrustAudience; label: string }> = [
    { id: 'private', label: 'Private' },
    { id: 'public', label: 'Public' },
    { id: 'subscriber', label: 'Subscribers' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<LazyChunkSkeleton height={260} label="Loading correlation graph" />}>
        <ParlayCorrelationGraph slips={savedSlips} />
      </Suspense>

      <div role="tablist" aria-label="Parlay history" className="flex gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
        {HISTORY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={historyTab === tab.id}
            onClick={() => setHistoryTab(tab.id)}
            className={`flex-1 rounded-lg px-2 py-2 text-[10px] font-bold uppercase tracking-wide min-h-[2.75rem] ${
              historyTab === tab.id ? 'bg-vouch-cyan/15 text-vouch-cyan' : 'text-white/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Section
        title={
          historyTab === 'private'
            ? 'Private wins'
            : historyTab === 'public'
              ? 'Public ledger'
              : 'Subscriber slips'
        }
        slips={historySlips}
      />
      {historySlips.length === 0 ? (
        <p className="text-center text-xs text-white/45 py-6">
          No {historyTab} parlays yet. Use <strong className="text-white/70">Lock to Ledger</strong> on Build to start your trust record.
        </p>
      ) : null}

      {pendingRepairCount > 0 ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-3 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
          <p className="text-xs text-amber-100/90 flex-1">
            {pendingRepairCount} saved parlay{pendingRepairCount === 1 ? '' : 's'} need grading identity linked to today&apos;s slate.
          </p>
          <button
            type="button"
            onClick={handleRepairAllSaved}
            className="shrink-0 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-cyan-200 hover:bg-cyan-500/20 min-h-[2.75rem]"
          >
            Repair saved parlays
          </button>
        </div>
      ) : null}

      <Section title="Live & Pending" slips={liveSlips} live />
      <Section title="Graded Results" slips={gradedSlips} />
      <ParlayTreeModal slip={treeSlip} isOpen={treeSlip != null} onClose={() => setTreeSlip(null)} />
    </div>
  );
}
