import React, { Suspense, lazy, useMemo, useState } from 'react';
import { GitBranch, TrendingUp } from 'lucide-react';
import { PanelErrorBoundary } from '../../common/PanelErrorBoundary';
import LazyChunkSkeleton from '../../system/LazyChunkSkeleton';
import ParlayOsBadgeRow from '../../trust/ParlayOsBadgeRow';
import ParlayTrustPanel from '../../trust/ParlayTrustPanel';
import ParlayIdentityBadge from '../../trust/ParlayIdentityBadge';
import ParlayLockCountdownBanner from '../os/ParlayLockCountdownBanner';
import { ParlayTreeModal } from '../tree/ParlayTreeModal';
import {
  selectSavedSlips,
  useParlayCommandStore,
} from '../../../stores/parlayCommandStore';
import type { PublicParlaySlip } from '../../../lib/parlayDisplay';
import { classifyParlayHistoryTab, trustLockCountdownLabel } from '../../../lib/trustLockSchedule';
import type { TrustAudience } from '../../../lib/trustLockSchedule';
import { assessClientParlayIdentity } from '../../../lib/parlayIdentity';
import { deriveSlipProgress } from '../../../lib/parlayLegProgress';
import {
  LEG_STATUS_META,
  type LegGradeStatus,
  type SlipGradeStatus,
} from '../types/parlayHubTypes';
import { z8StatusColor } from '../../../theme/z8Tokens';
import { ParlayHubLivePulse, ParlayHubStatusBadge } from './parlayHubUi';

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
  const [treeSlip, setTreeSlip] = useState<PublicParlaySlip | null>(null);
  const [historyTab, setHistoryTab] = useState<TrustAudience>('private');

  const liveSlips = useMemo(
    () => savedSlips.filter((s) =>
      ['pending', 'live', 'open', 'active', 'in_progress'].includes(String(s.status).toLowerCase())
      && !s.trustCommittedAt && !s.feedLockedAt,
    ),
    [savedSlips],
  );
  const gradedSlips = useMemo(
    () => savedSlips.filter((s) =>
      ['won', 'lost', 'push', 'void', 'cancelled'].includes(String(s.status).toLowerCase()),
    ),
    [savedSlips],
  );
  const historySlips = useMemo(
    () => savedSlips.filter((s) => {
      const tab = classifyParlayHistoryTab({
        trustAudience: s.trustAudience as TrustAudience | undefined,
        visibility: s.trustAudience ?? undefined,
        committedAt: s.trustCommittedAt ?? undefined,
        feedLockedAt: s.feedLockedAt ?? undefined,
      });
      if (tab === 'draft') return false;
      return tab === historyTab;
    }),
    [savedSlips, historyTab],
  );

  if (savedSlips.length === 0) return <EmptyLiveParlays />;

  function SlipCard({ slip }: { slip: PublicParlaySlip }) {
    const status = String(slip.status ?? 'pending').toLowerCase() as SlipGradeStatus;
    const legs = Array.isArray(slip.legs) ? slip.legs : [];
    const pendingLock = slip.trustCommittedAt && !slip.feedLockedAt;
    const lockLabel = pendingLock ? trustLockCountdownLabel(slip.trustLockAt ?? undefined) : null;
    const pickId = String(slip.sourceId ?? '').trim();
    const showTrustPanel = Boolean(pickId && (slip.trustCommittedAt || slip.feedLockedAt));
    const legRecords = legs.map((leg) => leg as Record<string, unknown>);
    const identity = assessClientParlayIdentity(legRecords);
    const slipProgress = deriveSlipProgress(legRecords);

    return (
      <article
        className="flex flex-col gap-2 p-3 rounded-xl border border-[hsl(var(--ve-border)/0.5)] bg-[hsl(var(--ve-surface)/0.6)]"
        aria-label={String(slip.title ?? 'Saved parlay')}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-[hsl(var(--ve-text-primary))] truncate">
              {String(slip.title ?? 'Saved Parlay')}
            </p>
            <p className="text-[10px] text-[hsl(var(--ve-text-muted))] mt-0.5">
              {legs.length} leg{legs.length !== 1 ? 's' : ''}
              {lockLabel ? ` · ${lockLabel}` : ''}
            </p>
            <ParlayOsBadgeRow
              className="mt-1.5"
              input={{
                id: pickId || slip.publicId,
                status: slip.status,
                committedAt: slip.trustCommittedAt,
                feedLockedAt: slip.feedLockedAt,
                lockReason: slip.lockReason,
              }}
            />
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <ParlayIdentityBadge identity={identity} />
            </div>
            <ParlayLockCountdownBanner
              trustCommittedAt={slip.trustCommittedAt}
              trustLockAt={slip.trustLockAt}
              feedLockedAt={slip.feedLockedAt}
            />
            {pickId ? (
              <a
                href={`/p/${encodeURIComponent(pickId)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-[10px] font-bold uppercase tracking-wide text-cyan-300 hover:text-cyan-200 mt-1"
              >
                View proof page
              </a>
            ) : null}
            {slipProgress ? (
              <p className="text-[10px] text-cyan-300/80 font-mono mt-1">
                Live: {slipProgress.label} ({slipProgress.current}/{slipProgress.target})
              </p>
            ) : null}
          </div>
          <ParlayHubStatusBadge status={status as LegGradeStatus} size="xs" />
        </div>

        {legs.slice(0, 3).map((leg, i) => {
          const legRec = leg as Record<string, unknown>;
          const legStatus = String(legRec.status ?? 'pending').toLowerCase() as LegGradeStatus;
          const legMeta = LEG_STATUS_META[legStatus] ?? LEG_STATUS_META.pending;
          return (
            <div key={i} className="flex items-center gap-2 text-[10px] text-[hsl(var(--ve-text-muted))]">
              <span aria-hidden="true" style={{ color: z8StatusColor(legMeta.token) }}>{legMeta.icon}</span>
              <span className="truncate">{String(legRec.selection ?? legRec.playerName ?? 'Prop')}</span>
              <span className="ml-auto text-[9px] font-bold shrink-0" style={{ color: z8StatusColor(legMeta.token) }}>
                {legMeta.label}
              </span>
            </div>
          );
        })}
        {legs.length > 3 ? (
          <p className="text-[9px] text-[hsl(var(--ve-text-muted))] text-center">+{legs.length - 3} more legs</p>
        ) : null}
        {legs.length > 0 ? (
          <button
            type="button"
            onClick={() => setTreeSlip(slip)}
            className="mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-[hsl(var(--ve-border)/0.5)] py-1.5 text-[10px] font-bold uppercase tracking-wide text-[hsl(var(--ve-text-muted))] transition hover:border-cyan-500/40 hover:text-cyan-300 min-h-[2.75rem]"
          >
            <GitBranch className="h-3 w-3" />
            View Structure
          </button>
        ) : null}
        {showTrustPanel ? (
          <ParlayTrustPanel
            pickId={pickId}
            title={String(slip.title ?? 'Saved Parlay')}
            className="mt-1"
          />
        ) : null}
      </article>
    );
  }

  function Section({ title, slips, live }: { title: string; slips: PublicParlaySlip[]; live?: boolean }) {
    if (slips.length === 0) return null;
    return (
      <section aria-label={title}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--ve-text-muted))]">{title}</span>
          {live ? <ParlayHubLivePulse active /> : null}
        </div>
        <div className="flex flex-col gap-2">
          {slips.map((slip) => (
            <SlipCard key={slip.publicId ?? slip.sourceId} slip={slip} />
          ))}
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

      <Section title="Live & Pending" slips={liveSlips as PublicParlaySlip[]} live />
      <Section title="Graded Results" slips={gradedSlips as PublicParlaySlip[]} />
      <ParlayTreeModal slip={treeSlip} isOpen={treeSlip != null} onClose={() => setTreeSlip(null)} />
    </div>
  );
}
