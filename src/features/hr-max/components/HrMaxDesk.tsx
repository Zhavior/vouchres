import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { Activity, CircleDot, Clock3, FileCheck2, Menu, ShieldCheck } from 'lucide-react';
import {
  AuroraMaxCommandHeader,
  AuroraMaxMetricStrip,
  AuroraMaxProductMark,
} from '../../../components/aurora-max/AuroraMaxPrimitives';
import { openParlayAdd } from '../../../lib/parlays/parlayAddContract';
import { localISODate } from '../../hr/utils/localDate';
import { useHrBoardViewModel } from '../../hr/hooks/useHrBoardViewModel';
import {
  formatDeskDate,
  mapHrWatchToDeskRow,
  sortDeskRows,
  type DeskSortKey,
  type HrMaxDeskRow,
} from '../mapHrWatchToDesk';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import '../hr-max-desk.css';

import { HrMaxToolbar } from './HrMaxToolbar';
import { HrMaxStatusBar } from './HrMaxStatusBar';
import { HrMaxSidecar } from './HrMaxSidecar';
import { HrMaxMainPane } from './HrMaxMainPane';

export type HrDeskViewMode = 'queue' | 'cards' | 'table';

function cycleSort(current: DeskSortKey): DeskSortKey {
  if (current === 'hrpi') return 'time';
  if (current === 'time') return 'volume';
  return 'hrpi';
}

function exportReceipts(rows: HrMaxDeskRow[]) {
  const payload = rows.map((row) => ({
    player: row.playerName,
    matchup: row.matchupLabel,
    hrpi: row.score,
    lineup: row.lineupLabel,
    signal: row.signal,
    read: row.read,
    evidence: row.evidence.map((item) => ({ label: item.label, value: item.value, score: item.score ?? null })),
    receipt: row.receipt,
  }));
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hr-command-desk-receipts-${localISODate()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

const LS_VIEW_MODE_KEY = 've_hr_max_view_mode';

function getInitialViewMode(): HrDeskViewMode {
  try {
    const saved = localStorage.getItem(LS_VIEW_MODE_KEY);
    if (saved === 'queue' || saved === 'cards' || saved === 'table') {
      return saved;
    }
  } catch {
    // Ignore storage access errors
  }
  return 'queue';
}

type SavedAction = { type: 'toggle'; id: string };
function savedReducer(state: Record<string, true>, action: SavedAction): Record<string, true> {
  if (state[action.id]) {
    const { [action.id]: _, ...rest } = state;
    return rest;
  }
  return { ...state, [action.id]: true };
}

export default function HrMaxDesk() {
  const vm = useHrBoardViewModel();
  const [viewMode, setViewModeState] = useState<HrDeskViewMode>(getInitialViewMode);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<DeskSortKey>('hrpi');
  const [savedMap, dispatchSaved] = useReducer(savedReducer, {});
  
  const isSaved = useCallback((id: string) => !!savedMap[id], [savedMap]);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const setViewMode = useCallback((mode: HrDeskViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem(LS_VIEW_MODE_KEY, mode);
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const handleAddToSlip = useCallback((row: HrMaxDeskRow) => {
    openParlayAdd({
      player: row.player,
      source: 'hr_intelligence',
      dataStatus: row.dataStatus,
      reasoningSnapshot: row.reasoningSnapshot,
      riskSnapshot: row.riskSnapshot,
    });
  }, []);

  const boardSource = vm.connection?.source ?? null;
  const deskRows = useMemo(
    () => vm.rows.map((row) => mapHrWatchToDeskRow(row, vm.slate.freshness, vm.slate.generatedAt, boardSource)),
    [boardSource, vm.rows, vm.slate.freshness, vm.slate.generatedAt],
  );
  
  const handleRawAddToSlip = useCallback((rawRow: HrWatchRow) => {
    const match = deskRows.find((r) => r.id === rawRow.stableId || r.id === String(rawRow.playerId));
    if (match) {
      handleAddToSlip(match);
    }
  }, [deskRows, handleAddToSlip]);

  const visibleRows = useMemo(() => sortDeskRows(deskRows, sortKey), [deskRows, sortKey]);
  const activeRow = visibleRows.find((row) => row.id === activeId) ?? visibleRows[0] ?? null;
  const confirmedCount = vm.modeCounts.confirmed;
  const refreshedLabel = vm.lastUpdated
    ? vm.lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '—';

  useEffect(() => {
    if (!activeRow) {
      setActiveId(null);
      return;
    }
    if (!visibleRows.some((row) => row.id === activeId)) {
      setActiveId(activeRow.id);
    }
  }, [activeId, activeRow, visibleRows]);

  const selectRow = useCallback((id: string) => {
    setActiveId(id);
    // Pass 3: Decouple Selection — do not auto-open receipt
  }, []);
  
  const toggleReceipt = useCallback((id: string) => {
    setReceiptId((current) => (current === id ? null : id));
  }, []);

  const toggleSaved = useCallback((id: string) => {
    const row = deskRows.find((item) => item.id === id);
    dispatchSaved({ type: 'toggle', id });
    if (row && !savedMap[id]) {
      openParlayAdd({
        player: row.player,
        source: 'hr_intelligence',
        dataStatus: row.dataStatus,
        reasoningSnapshot: row.reasoningSnapshot,
        riskSnapshot: row.riskSnapshot,
      });
    }
  }, [deskRows, savedMap]);

  const handleExport = useCallback(() => {
    const savedKeys = Object.keys(savedMap);
    const target = savedKeys.length > 0 ? visibleRows.filter((row) => savedMap[row.id]) : visibleRows;
    exportReceipts(target);
    setExportStatus(`${target.length} receipt${target.length === 1 ? '' : 's'} prepared`);
    window.setTimeout(() => setExportStatus(null), 2200);
  }, [savedMap, visibleRows]);

  const freshnessTone = vm.slate.freshness === 'fresh' ? 'confirmed' : vm.slate.freshness === 'delayed' ? 'live' : 'warning';
  const confirmedOnly = vm.mode === 'confirmed';

  return (
    <div className="hr-max-desk min-h-full">
      <header className="hr-max-desk__session">
        <AuroraMaxProductMark />
        <div className="flex min-w-0 items-center gap-2">
          <span className="hidden items-center gap-1.5 border-r border-white/[0.07] pr-3 font-mono text-[11px] uppercase tracking-[0.12em] text-white/30 sm:flex">
            {vm.isToday ? 'Today' : vm.date}
          </span>
          <span className={`hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] sm:flex ${vm.slate.freshness === 'fresh' ? 'text-[var(--aurora-max-emerald)]' : 'text-white/45'}`}>
            <CircleDot className="h-2.5 w-2.5" aria-hidden="true" />
            {vm.syncing ? 'Refreshing sources' : vm.slate.freshness === 'fresh' ? 'Sources fresh' : vm.slate.freshness === 'delayed' ? 'Sources delayed' : 'Sources stale'}
          </span>
          <Menu className="h-4 w-4 text-white/45 md:hidden" aria-hidden="true" />
        </div>
      </header>

      <main className="hr-max-desk__body">
        <div className="hr-max-desk__glow" aria-hidden="true" />
        <AuroraMaxCommandHeader
          eyebrow={<span className="flex items-center gap-2"><Activity className="h-3 w-3" aria-hidden="true" /> {formatDeskDate(vm.date)}</span>}
          title="Research command desk"
          description="Aurora Max system · live Home Run Intelligence board. Missing inputs stay labeled. Nothing here is a guaranteed home run."
          meta={
            <AuroraMaxMetricStrip
              items={[
                { value: String(vm.slate.gameCount || visibleRows.length).padStart(2, '0'), label: 'Matchups', tone: vm.slate.hasGames ? 'confirmed' : 'neutral' },
                { value: String(confirmedCount).padStart(2, '0'), label: 'Confirmed', tone: confirmedCount > 0 ? 'confirmed' : 'warning' },
                { value: refreshedLabel, label: 'Refreshed', tone: freshnessTone },
                { value: String(vm.stats.total), label: 'Visible rows', tone: 'neutral' },
              ]}
            />
          }
        />

        <HrMaxSidecar
          activeRow={activeRow}
          saved={activeRow ? isSaved(activeRow.id) : false}
          onToggleSaved={() => activeRow && toggleSaved(activeRow.id)}
          rawRows={vm.rows}
          onSpotlightSelect={(r) => selectRow(r.stableId)}
          onAddToSlip={handleRawAddToSlip}
        />

        <HrMaxToolbar
          date={vm.date}
          onDateChange={vm.setDate}
          search={vm.search}
          onSearchChange={vm.setSearch}
          syncing={vm.syncing}
          onRefresh={() => void vm.refresh()}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedTiers={vm.selectedTiers}
          tierStats={vm.stats}
          onToggleTier={vm.onToggleTier}
        />

        <HrMaxStatusBar
          autoSwitchedToPreview={vm.autoSwitchedToPreview}
          refreshError={vm.refreshError}
          exportStatus={exportStatus}
          loading={vm.loading}
          error={vm.error}
          hasRows={visibleRows.length > 0}
          confirmedOnly={confirmedOnly}
          onRetry={() => void vm.refresh()}
          onShowAll={() => vm.setMode('all')}
        />

        <HrMaxMainPane
          viewMode={viewMode}
          rows={visibleRows}
          activeId={activeId}
          receiptId={receiptId}
          confirmedOnly={confirmedOnly}
          confirmedCount={confirmedCount}
          sortKey={sortKey}
          isSaved={isSaved}
          onSelect={selectRow}
          onToggleSaved={toggleSaved}
          onToggleReceipt={toggleReceipt}
          onAddToSlip={handleAddToSlip}
          onCycleSort={() => setSortKey(cycleSort)}
          onToggleMode={() => vm.setMode(confirmedOnly ? 'all' : 'confirmed')}
          onExport={handleExport}
        />

        <div className="hr-max-notes mt-6">
          <div className="flex items-center gap-2 text-[10px] text-white/35">
            <FileCheck2 className="h-3.5 w-3.5 text-[var(--aurora-max-emerald)]" aria-hidden="true" />
            Every row keeps its research receipt.
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/35">
            <Clock3 className="h-3.5 w-3.5 text-[var(--aurora-max-emerald)]" aria-hidden="true" />
            Freshness is visible at decision time.
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/35">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--aurora-max-emerald)]" aria-hidden="true" />
            Missing inputs remain explicitly labeled.
          </div>
        </div>
      </main>
    </div>
  );
}
