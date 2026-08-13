/**
 * AuroraHqDesk — Aurora HQ Next-Gen HR Intelligence Desk.
 *
 * Structural base: HrMaxDesk (copied, not imported).
 * Data layer: useHrBoardViewModel + presentWatchRow (IntelV2Row — has displayTier, evidence, etc.)
 * Visual layer: CSS Lightning glassmorphism (.aurora-hq-*), no .intel-v2 or .hr-max-desk identifiers.
 * Gating: useUserTier() → isProMode controls Statcast Evidence Ladder visibility.
 *
 * Rules enforced:
 *   L001 — No HomeRunIntelligencePageZ8 imports. Static composition only.
 *   L005 — No inner React.lazy. One chunk.
 *   L007 — New file, new export name, new CSS identifiers.
 *   L008 — Eager route; no prefetch wired here.
 *   L009 — HRPI = hrScore. Statcast fields labeled UNKNOWN/missing when absent.
 */

import { Check, CircleDot, Clock3, FileCheck2, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AuroraMaxProductMark } from '../../../components/aurora-max/AuroraMaxPrimitives';
import { openParlayAdd } from '../../../lib/parlays/parlayAddContract';
import { localISODate } from '../../hr/utils/localDate';
import { useHrBoardViewModel } from '../../hr/hooks/useHrBoardViewModel';
import { useUserTier } from '../../hr/hooks/useUserTier';
import type { HrWatchMode } from '../../hr/types/hrWatch';
import {
  mapHrWatchToDeskRow,
  sortDeskRows,
  type DeskDisplayTier,
  type HrMaxDeskRow,
  type DeskSortKey,
} from '../../hr-max/mapHrWatchToDesk';
import { AuroraHqCommandBar } from './AuroraHqCommandBar';
import { AuroraHqTierBar } from './AuroraHqTierBar';
import { AuroraHqSignalCard } from './AuroraHqSignalCard';
import { AuroraHqSlateQueue } from './AuroraHqSlateQueue';
import AuroraHqRouteSkeleton from '../AuroraHqRouteSkeleton';
import '../aurora-hq.css';

/* ─── helpers ────────────────────────────────────────────────────────────── */

const DESK_TIERS: DeskDisplayTier[] = ['Elite', 'Strong', 'Watch', 'Sleepers'];
const DESK_TIER_COPY: Record<DeskDisplayTier, { index: string; title: string; detail: string }> = {
  Elite:    { index: '01', title: 'Elite',    detail: 'Top-resolution signal stacks' },
  Strong:   { index: '02', title: 'Strong',   detail: 'Balanced multi-factor rows' },
  Watch:    { index: '03', title: 'Watch',    detail: 'Context or confirmation needed' },
  Sleepers: { index: '04', title: 'Sleepers', detail: 'Deliberate investigation rows' },
};

function nextSort(current: DeskSortKey): DeskSortKey {
  if (current === 'hrpi')   return 'time';
  if (current === 'time')   return 'volume';
  return 'hrpi';
}

const CYCLE_MODE: HrWatchMode[] = ['confirmed', 'curated', 'all'];

function exportReceipts(rows: HrMaxDeskRow[]) {
  const blob = new Blob(
    [
      JSON.stringify(
        rows.map((row) => ({
          player:         row.playerName,
          matchup:        row.matchupLabel,
          strike:         row.signal,
          hrpiLine:       row.read,
          tier:           row.displayTier,
          hrpi:           row.score,
          lineup:         row.lineupLabel,
          signal:         row.signal,
          read:           row.read,
          evidenceConfidence: row.evidenceConfidence,
          evidence: row.evidence.map((item) => ({
            label:  item.label,
            value:  typeof item.value === 'string' ? item.value : null,
            detail: item.detail ?? null,
          })),
          receipt: row.receipt,
        })),
        null,
        2,
      ),
    ],
    { type: 'application/json' },
  );
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = `aurora-hq-receipts-${localISODate()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/* ─── Tier board column ──────────────────────────────────────────────────── */

const PREVIEW_COUNT = 2;

function TierColumn({
  tier,
  rows,
  isProMode,
  onResearch,
  onAddToSlip,
  getHrResult,
}: {
  tier: DeskDisplayTier;
  rows: HrMaxDeskRow[];
  isProMode: boolean;
  onResearch: (id: string) => void;
  onAddToSlip: (id: string) => void;
  getHrResult: ReturnType<typeof useHrBoardViewModel>['getHrResult'];
}) {
  const [expanded, setExpanded] = useState(false);
  const copy    = DESK_TIER_COPY[tier];
  const visible = expanded ? rows : rows.slice(0, PREVIEW_COUNT);

  return (
    <section className="aurora-hq__column aurora-hq-glass" aria-label={`${tier} signals`}>
      <header className="aurora-hq__column-head">
        <div style={{ minWidth: 0 }}>
          <p className="aurora-hq__column-index">{copy.index} · {copy.title}</p>
          <p className="aurora-hq__column-detail">{copy.detail}</p>
        </div>
        <strong className="aurora-hq__column-count">{String(rows.length).padStart(2, '0')}</strong>
      </header>

      {visible.length === 0 ? (
        <div style={{ padding: '1.25rem', fontSize: '0.5625rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
          No {tier} rows for this filter set.
        </div>
      ) : (
        <div className="aurora-hq__column-body">
          {visible.map((row) => (
            <AuroraHqSignalCard
              key={row.id}
              row={row}
              result={getHrResult(row.player.id)}
              isProMode={isProMode}
              onResearch={() => onResearch(row.id)}
              onAddToSlip={() => onAddToSlip(row.id)}
            />
          ))}
        </div>
      )}

      {rows.length > PREVIEW_COUNT ? (
        <button type="button" className="aurora-hq__column-expand" onClick={() => setExpanded((v) => !v)}>
          {expanded ? `Show top ${PREVIEW_COUNT}` : `Show all ${rows.length}`}
        </button>
      ) : null}
    </section>
  );
}

/* ─── Main desk ──────────────────────────────────────────────────────────── */

export default function AuroraHqDesk() {
  const vm             = useHrBoardViewModel();
  const { isProMode, toggleProMode } = useUserTier();

  const [activeId,      setActiveId]      = useState<string | null>(null);
  const [receiptId,     setReceiptId]     = useState<string | null>(null);
  const [sortKey,       setSortKey]       = useState<DeskSortKey>('hrpi');
  const [savedIds,      setSavedIds]      = useState<Set<string>>(() => new Set());
  const [exportStatus,  setExportStatus]  = useState<string | null>(null);

  /* ── Data pipeline (same as HrMaxDesk, richer presenter) ── */
  const boardSource = vm.connection?.source ?? null;
  const presented   = useMemo(
    () => vm.rows.map((row) => mapHrWatchToDeskRow(row, vm.slate.freshness, vm.slate.generatedAt, boardSource)),
    [boardSource, vm.rows, vm.slate.freshness, vm.slate.generatedAt],
  );
  const visibleRows = useMemo(() => sortDeskRows(presented, sortKey), [presented, sortKey]);

  const boardBuckets = useMemo(() => {
    const buckets: Record<DeskDisplayTier, HrMaxDeskRow[]> = { Elite: [], Strong: [], Watch: [], Sleepers: [] };
    for (const row of visibleRows) {
      if (row.displayTier) buckets[row.displayTier].push(row);
    }
    return buckets;
  }, [visibleRows]);

  const activeRow     = visibleRows.find((r) => r.id === activeId) ?? visibleRows[0] ?? null;
  const warningList   = vm.slate.warnings.slice(0, 3);
  const refreshedLabel = vm.lastUpdated
    ? vm.lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '—';

  /* ── Active row auto-fix ── */
  useEffect(() => {
    if (visibleRows.length === 0) {
      if (activeId !== null) setActiveId(null);
      return;
    }
    const isMissing = !visibleRows.some((r) => r.id === activeId);
    if (isMissing) {
      setActiveId(visibleRows[0].id);
    }
  }, [activeId, visibleRows]);

  /* ── Actions ── */
  const researchRow = (id: string) => { setActiveId(id); setReceiptId(id); };

  const addToSlip = (id: string) => {
    const row = presented.find((r) => r.id === id);
    if (!row) return;
    setSavedIds((curr) => new Set(curr).add(id));
    openParlayAdd({
      player:           row.player,
      propHint: {
        id:      `aurora-hq-${row.id}`,
        market:  'Home Runs',
        odds:    null,
        spec:    `${row.playerName} 1+ Home Run`,
        gamePk:  undefined,
        playerId: row.player.id,
      },
      initialFamily:    'home_runs',
      source:           'hr_intelligence',
      dataStatus:       row.dataStatus,
      reasoningSnapshot: row.reasoningSnapshot,
      riskSnapshot:     row.riskSnapshot,
    });
  };

  const toggleSaved = (id: string) => {
    if (savedIds.has(id)) {
      setSavedIds((curr) => { const next = new Set(curr); next.delete(id); return next; });
    } else {
      addToSlip(id);
    }
  };

  const cycleMode = () => {
    const idx = CYCLE_MODE.indexOf(vm.mode === 'blocked' ? 'all' : vm.mode);
    vm.setMode(CYCLE_MODE[(idx + 1) % CYCLE_MODE.length]);
  };

  const handleExport = () => {
    const target = savedIds.size > 0 ? visibleRows.filter((r) => savedIds.has(r.id)) : visibleRows;
    exportReceipts(target);
    setExportStatus(`${target.length} receipt${target.length === 1 ? '' : 's'} prepared`);
    window.setTimeout(() => setExportStatus(null), 2200);
  };

  /* ── Derived presentation ── */
  const freshnessTone = vm.slate.freshness === 'fresh' ? 'confirmed' : vm.slate.freshness === 'delayed' ? 'live' : 'warning';

  const modeCopy =
    vm.mode === 'curated'    ? 'Preview mode: showing projected lineup candidates. Lineups are subject to change.'
    : vm.mode === 'confirmed' ? 'Confirmed mode: only official batting orders are shown.'
    : 'All signals: confirmed and projected rows stay labeled.';

  return (
    <div className="aurora-hq min-h-full">

      {/* ── Sticky session header ── */}
      <header className="aurora-hq__session">
        <AuroraMaxProductMark />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          {/* Date label */}
          <span style={{ display: 'none', alignItems: 'center', gap: '0.5rem', fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace', fontSize: '0.5rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', borderRight: '1px solid rgba(255,255,255,0.07)', paddingRight: '0.75rem' }}
            className="sm:flex">
            {vm.isToday ? 'Today' : vm.date}
          </span>

          {/* Feed status */}
          <span className={`sm:flex hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] ${vm.slate.freshness === 'fresh' ? 'text-[#10b981]' : 'text-white/45'}`}>
            <CircleDot className="h-2.5 w-2.5" aria-hidden="true" />
            {vm.syncing ? 'Refreshing sources' : vm.slate.freshness === 'fresh' ? 'Sources fresh' : vm.slate.freshness === 'delayed' ? 'Sources delayed' : 'Sources stale'}
          </span>

          {/* Free / Pro toggle */}
          <button
            type="button"
            onClick={toggleProMode}
            className={`aurora-hq__mode-toggle ${isProMode ? 'is-pro' : ''}`}
            aria-pressed={isProMode}
            aria-label={isProMode ? 'Switch to Free mode' : 'Switch to Pro mode'}
          >
            {isProMode ? '⚡ Pro Mode' : 'Free Mode'}
          </button>
        </div>
      </header>

      <main className="aurora-hq__body">

        {/* ── Ambient glow ── */}
        <div aria-hidden="true" style={{
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '60vw', height: '40vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.07) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* ── Command header ── */}
        <div className="aurora-hq__header">
          <p className="aurora-hq__eyebrow">
            <CircleDot className="h-3 w-3" aria-hidden="true" />
            {new Date(vm.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
          <h1 className="aurora-hq__title">Aurora HQ</h1>
          <p className="aurora-hq__desc">
            Next-gen HR Intelligence desk. Missing inputs stay labeled. Nothing here is a guaranteed home run.
          </p>

          {/* Metric strip */}
          <div className="aurora-hq__metrics">
            {[
              { value: String(vm.slate.gameCount || visibleRows.length).padStart(2, '0'), label: 'Matchups',     tone: vm.slate.hasGames ? 'confirmed' : 'neutral' },
              { value: String(vm.modeCounts.confirmed).padStart(2, '0'),                  label: 'Confirmed',    tone: vm.modeCounts.confirmed > 0 ? 'confirmed' : 'warning' },
              { value: refreshedLabel,                                                      label: 'Refreshed',    tone: freshnessTone },
              { value: String(vm.stats.total),                                              label: 'Visible rows', tone: 'neutral' },
            ].map((m) => (
              <div key={m.label} className={`aurora-hq__metric aurora-hq__metric--${m.tone}`}>
                <strong>{m.value}</strong>
                <small>{m.label}</small>
              </div>
            ))}
          </div>
        </div>

        {/* ── Command bar ── */}
        <AuroraHqCommandBar
          date={vm.date}
          maxDate={localISODate()}
          search={vm.search}
          mode={vm.mode}
          sortKey={sortKey}
          onSortChange={setSortKey}
          syncing={vm.syncing}
          freshness={vm.slate.freshness}
          onDateChange={(d) => vm.setDate(d)}
          onSearchChange={(s) => vm.setSearch(s)}
          onRefresh={() => void vm.refresh()}
          onCycleMode={cycleMode}
          onCycleSort={() => setSortKey((k) => nextSort(k))}
          onExport={handleExport}
        />

        {/* ── Tier quick-filter bar ── */}
        <AuroraHqTierBar
          counts={{ Elite: vm.stats.elite, Strong: vm.stats.strong, Watch: vm.stats.watch, Sleepers: vm.stats.sleepers }}
          selected={vm.selectedTiers}
          onToggle={(tier) => vm.onToggleTier(tier)}
        />

        {/* ── Status banners ── */}
        {warningList.map((w) => (
          <div key={w} className="aurora-hq__banner" role="status">{w}</div>
        ))}
        {vm.autoSwitchedToPreview ? (
          <div className="aurora-hq__banner" role="status">
            Confirmed lineups are not posted yet. Showing the preview pool, labeled as projected.
          </div>
        ) : null}
        {vm.refreshError || vm.connection?.isLastGood ? (
          <div className="aurora-hq__banner" role="status">
            {vm.refreshError ?? 'Validated feed is recovering — showing a demoted last-good snapshot.'}
          </div>
        ) : null}
        {exportStatus ? (
          <div className="aurora-hq__banner aurora-hq__banner--ok" role="status">
            <Check className="h-3.5 w-3.5" aria-hidden="true" /> {exportStatus}
          </div>
        ) : null}

        {/* ── Loading skeleton ── */}
        {vm.loading && visibleRows.length === 0 ? <AuroraHqRouteSkeleton /> : null}

        {/* ── Error fallback ── */}
        {vm.error && visibleRows.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.45)', marginBottom: '1rem' }}>{vm.error}</p>
            <button type="button" className="aurora-hq__control" onClick={() => void vm.refresh()}>Retry board</button>
          </div>
        ) : null}

        {/* ── Empty state ── */}
        {!vm.loading && !vm.error && visibleRows.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.38)' }} role="status">
            {vm.mode === 'confirmed'
              ? 'No confirmed-lineup rows on this slate yet. Cycle the lineup filter to inspect the preview pool.'
              : 'The validated board returned no eligible rows for this date and filter set.'}
            {vm.mode === 'confirmed' && vm.modeCounts.curated > 0 ? (
              <div style={{ marginTop: '1rem' }}>
                <button type="button" className="aurora-hq__control" onClick={() => vm.setMode('curated')}>Open preview pool</button>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ── 4-Column Tier Board ── */}
        {visibleRows.length > 0 ? (
          <section className="aurora-hq__board" aria-label="Home run signal tiers">
            {DESK_TIERS.map((tier) => (
              <TierColumn
                key={tier}
                tier={tier}
                rows={boardBuckets[tier]}
                isProMode={isProMode}
                getHrResult={vm.getHrResult}
                onResearch={researchRow}
                onAddToSlip={addToSlip}
              />
            ))}
          </section>
        ) : null}

        {/* ── Ranked Workspace ── */}
        {visibleRows.length > 0 ? (
          <div className="aurora-hq__workspace-wrap">
            <div className="aurora-hq__workspace-title-row">
              <div>
                <p className="aurora-hq__workspace-title">Daily slate</p>
                <p className="aurora-hq__workspace-sub">
                  {visibleRows.length} ranked matchups · {vm.modeCounts.confirmed} confirmed
                </p>
              </div>
              <div className="aurora-hq__workspace-controls">
                <button type="button" className="aurora-hq__control" onClick={cycleMode}>
                  {vm.mode === 'confirmed' ? 'Confirmed only' : vm.mode === 'curated' ? 'Preview pool' : 'All lineups'}
                </button>
                <button type="button" className="aurora-hq__control" onClick={() => setSortKey((k) => nextSort(k))}>
                  {sortKey === 'hrpi' ? 'HRPI score' : sortKey === 'time' ? 'Game time' : 'Mkt attention'}
                </button>
                <button type="button" className="aurora-hq__control aurora-hq__control--primary" onClick={handleExport}>
                  Export receipts
                </button>
              </div>
            </div>

            <div className="aurora-hq-glass" style={{ overflow: 'hidden' }}>
              <AuroraHqSlateQueue
                rows={visibleRows}
                activeId={activeRow?.id ?? null}
                savedIds={savedIds}
                receiptId={receiptId}
                results={vm.getHrResult}
                onSelect={researchRow}
                onToggleSaved={toggleSaved}
                onToggleReceipt={(id) => setReceiptId((curr) => curr === id ? null : id)}
              />
            </div>
          </div>
        ) : null}

        {/* ── Mode copy ── */}
        <p style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.35)' }}>{modeCopy}</p>

        {/* ── Footer notes ── */}
        <div className="aurora-hq__notes">
          <div className="aurora-hq__note">
            <ShieldCheck className="h-3.5 w-3.5" style={{ color: '#10b981', flexShrink: 0 }} aria-hidden="true" />
            Every row keeps its research receipt.
          </div>
          <div className="aurora-hq__note">
            <Clock3 className="h-3.5 w-3.5" style={{ color: '#10b981', flexShrink: 0 }} aria-hidden="true" />
            Freshness is visible at decision time.
          </div>
          <div className="aurora-hq__note">
            <FileCheck2 className="h-3.5 w-3.5" style={{ color: '#10b981', flexShrink: 0 }} aria-hidden="true" />
            Missing inputs remain explicitly labeled.
          </div>
        </div>
      </main>
    </div>
  );
}
