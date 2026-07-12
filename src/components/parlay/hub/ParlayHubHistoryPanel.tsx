import React, { Suspense, lazy, useMemo, useState } from 'react';
import LazyChunkSkeleton from '../../system/LazyChunkSkeleton';
import ParlayTrustPanel from '../../trust/ParlayTrustPanel';
import { ParlayTreeModal } from '../tree/ParlayTreeModal';
import type { Parlay } from '../../../types';
import { normalizePublicSlip, type PublicParlaySlip } from '../../../lib/parlayDisplay';
import { deriveCanonicalParlayState, selectParlayWorkspaces, type CanonicalParlayState } from '../../../domain/parlayState';
import { classifyParlayHistoryTab, type TrustAudience } from '../../../lib/trustLockSchedule';
import { CanonicalParlayCard } from './CanonicalParlayCard';
import { ParlayHubLivePulse } from './parlayHubUi';
import { useSynchronizedParlays } from '../../../hooks/useSynchronizedParlays';

const ParlayCorrelationGraph = lazy(() => import('../graph/ParlayCorrelationGraph'));

type WorkspaceRow = { parlay: Parlay; state: CanonicalParlayState };

function EmptyParlays() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] text-lg text-cyan-300">P</div>
      <h3 className="text-sm font-bold text-white">No parlays saved yet</h3>
      <p className="max-w-xs text-xs text-white/45">Build a complete slip and save it. Synced parlays will appear here automatically.</p>
    </div>
  );
}

function Section({ title, rows, live = false, onOpenStructure }: { title: string; rows: WorkspaceRow[]; live?: boolean; onOpenStructure: (parlay: Parlay) => void }) {
  if (rows.length === 0) return null;
  return (
    <section aria-label={title}>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">{title}</h2>
        <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[9px] font-bold text-white/40">{rows.length}</span>
        {live ? <ParlayHubLivePulse active /> : null}
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        {rows.map(({ parlay, state }) => (
          <div key={parlay.backendPickId ?? parlay.id}>
            <CanonicalParlayCard parlay={parlay} state={state} onViewStructure={() => onOpenStructure(parlay)} />
            {parlay.backendPickId && (parlay.trustCommittedAt || parlay.feedLockedAt) ? (
              <ParlayTrustPanel pickId={parlay.backendPickId} title={parlay.title} className="mt-2" />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ParlayHubHistoryPanel({ savedSlips }: { savedSlips: Parlay[] }) {
  const [treeSlip, setTreeSlip] = useState<PublicParlaySlip | null>(null);
  const [historyTab, setHistoryTab] = useState<TrustAudience>('private');
  const { parlays: synchronizedSlips } = useSynchronizedParlays(savedSlips);
  const workspaces = useMemo(() => selectParlayWorkspaces(synchronizedSlips), [synchronizedSlips]);
  const trustRows = useMemo(() => synchronizedSlips
    .filter((parlay) => classifyParlayHistoryTab({
      trustAudience: parlay.trustAudience,
      visibility: parlay.trustAudience,
      committedAt: parlay.trustCommittedAt,
      feedLockedAt: parlay.feedLockedAt,
    }) === historyTab)
    .map((parlay) => ({ parlay, state: deriveCanonicalParlayState(parlay) })), [historyTab, synchronizedSlips]);

  if (savedSlips.length === 0) return <EmptyParlays />;
  const tabs: Array<{ id: TrustAudience; label: string }> = [
    { id: 'private', label: 'Private' },
    { id: 'public', label: 'Public' },
    { id: 'subscriber', label: 'Subscribers' },
  ];

  return (
    <div className="flex flex-col gap-7">
      <Suspense fallback={<LazyChunkSkeleton height={260} label="Loading correlation graph" />}>
        <ParlayCorrelationGraph slips={savedSlips.map(normalizePublicSlip)} />
      </Suspense>

      <div role="tablist" aria-label="Trust audience" className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
        {tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={historyTab === tab.id} onClick={() => setHistoryTab(tab.id)} className={`min-h-11 rounded-lg px-2 text-[10px] font-bold uppercase tracking-wide ${historyTab === tab.id ? 'bg-cyan-400/10 text-cyan-200' : 'text-white/40'}`}>{tab.label}</button>)}
      </div>

      <Section title={`${historyTab} trust ledger`} rows={trustRows} onOpenStructure={(parlay) => setTreeSlip(normalizePublicSlip(parlay))} />
      <Section title="Needs attention" rows={workspaces.attention} onOpenStructure={(parlay) => setTreeSlip(normalizePublicSlip(parlay))} />
      <Section title="Upcoming" rows={workspaces.upcoming} onOpenStructure={(parlay) => setTreeSlip(normalizePublicSlip(parlay))} />
      <Section title="Live & locked" rows={workspaces.live} live onOpenStructure={(parlay) => setTreeSlip(normalizePublicSlip(parlay))} />
      <Section title="Results" rows={workspaces.results} onOpenStructure={(parlay) => setTreeSlip(normalizePublicSlip(parlay))} />

      <ParlayTreeModal slip={treeSlip} isOpen={treeSlip != null} onClose={() => setTreeSlip(null)} />
    </div>
  );
}
