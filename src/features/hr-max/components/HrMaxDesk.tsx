import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownUp,
  Check,
  CircleDot,
  Clock3,
  Download,
  FileCheck2,
  Filter,
  Menu,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  AuroraMaxCommandHeader,
  AuroraMaxControl,
  AuroraMaxFallback,
  AuroraMaxMetricStrip,
  AuroraMaxProductMark,
  AuroraMaxRankedWorkspace,
} from '../../../components/aurora-max/AuroraMaxPrimitives';
import { openParlayAdd } from '../../../lib/parlays/parlayAddContract';
import { localISODate } from '../../hr/utils/localDate';
import { useHrBoardViewModel } from '../../hr/hooks/useHrBoardViewModel';
import {
  SORT_LABELS,
  formatDeskDate,
  mapHrWatchToDeskRow,
  sortDeskRows,
  type DeskSortKey,
  type HrMaxDeskRow,
} from '../mapHrWatchToDesk';
import { HrMaxSpotlight } from './HrMaxSpotlight';
import { HrMaxSlateQueue } from './HrMaxSlateQueue';
import HrMaxRouteSkeleton from '../HrMaxRouteSkeleton';
import '../hr-max-desk.css';

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

export default function HrMaxDesk() {
  const vm = useHrBoardViewModel();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<DeskSortKey>('hrpi');
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const boardSource = vm.connection?.source ?? null;
  const deskRows = useMemo(
    () => vm.rows.map((row) => mapHrWatchToDeskRow(row, vm.slate.freshness, vm.slate.generatedAt, boardSource)),
    [boardSource, vm.rows, vm.slate.freshness, vm.slate.generatedAt],
  );
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

  const selectRow = (id: string) => {
    setActiveId(id);
    setReceiptId(id);
  };

  const toggleSaved = (id: string) => {
    const row = deskRows.find((item) => item.id === id);
    setSavedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (row && !savedIds.has(id)) {
      openParlayAdd({
        player: row.player,
        source: 'hr_intelligence',
        dataStatus: row.dataStatus,
        reasoningSnapshot: row.reasoningSnapshot,
        riskSnapshot: row.riskSnapshot,
      });
    }
  };

  const handleExport = () => {
    const target = savedIds.size > 0 ? visibleRows.filter((row) => savedIds.has(row.id)) : visibleRows;
    exportReceipts(target);
    setExportStatus(`${target.length} receipt${target.length === 1 ? '' : 's'} prepared`);
    window.setTimeout(() => setExportStatus(null), 2200);
  };

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

        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="hr-max-date">Slate date</label>
          <input
            id="hr-max-date"
            type="date"
            max={localISODate()}
            value={vm.date}
            onChange={(event) => vm.setDate(event.target.value)}
            className="aurora-max-control px-3 py-1.5 font-mono text-xs font-bold normal-case tracking-normal"
          />
          <AuroraMaxControl onClick={() => void vm.refresh()} disabled={vm.syncing}>
            <RefreshCw className={`h-3.5 w-3.5 ${vm.syncing ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </AuroraMaxControl>
        </div>

        {vm.autoSwitchedToPreview ? (
          <div className="hr-max-desk__status hr-max-desk__status--warning" role="status">
            Confirmed lineups are not posted yet. Showing projected research rows, labeled as projected.
          </div>
        ) : null}
        {vm.refreshError ? (
          <div className="hr-max-desk__status hr-max-desk__status--warning" role="status">{vm.refreshError}</div>
        ) : null}
        {exportStatus ? (
          <div className="hr-max-desk__status" role="status">
            <Check className="h-3.5 w-3.5" aria-hidden="true" /> {exportStatus}
          </div>
        ) : null}

        {vm.loading && visibleRows.length === 0 ? <HrMaxRouteSkeleton /> : null}

        {vm.error && visibleRows.length === 0 ? (
          <AuroraMaxFallback
            title="Board unavailable"
            detail={vm.error}
            action={<AuroraMaxControl onClick={() => void vm.refresh()} className="mt-3">Retry board</AuroraMaxControl>}
          />
        ) : null}

        {!vm.loading && !vm.error && visibleRows.length === 0 ? (
          <AuroraMaxFallback
            title="No research rows"
            detail={confirmedOnly
              ? 'No confirmed-lineup rows are on this slate yet. Switch to all lineups to inspect projected research.'
              : 'The validated board returned no eligible rows for this date.'}
            action={confirmedOnly ? (
              <AuroraMaxControl onClick={() => vm.setMode('all')} className="mt-3">Show all lineups</AuroraMaxControl>
            ) : undefined}
          />
        ) : null}

        {activeRow ? (
          <>
            <HrMaxSpotlight row={activeRow} saved={savedIds.has(activeRow.id)} onToggleSaved={() => toggleSaved(activeRow.id)} />
            <AuroraMaxRankedWorkspace
              title="Daily slate"
              subtitle={`${visibleRows.length} ranked matchups · ${confirmedCount} confirmed`}
              controls={
                <div className="flex flex-wrap gap-2">
                  <AuroraMaxControl
                    aria-pressed={confirmedOnly}
                    onClick={() => vm.setMode(confirmedOnly ? 'all' : 'confirmed')}
                  >
                    <Filter className="h-3.5 w-3.5" aria-hidden="true" />
                    {confirmedOnly ? 'Confirmed only' : 'All lineups'}
                  </AuroraMaxControl>
                  <AuroraMaxControl onClick={() => setSortKey((current) => cycleSort(current))}>
                    <ArrowDownUp className="h-3.5 w-3.5" aria-hidden="true" />
                    {SORT_LABELS[sortKey]}
                  </AuroraMaxControl>
                  <AuroraMaxControl onClick={handleExport}>
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    Export receipts
                  </AuroraMaxControl>
                </div>
              }
            >
              <HrMaxSlateQueue
                rows={visibleRows}
                activeId={activeRow.id}
                savedIds={savedIds}
                receiptId={receiptId}
                onSelect={selectRow}
                onToggleSaved={toggleSaved}
                onToggleReceipt={(id) => setReceiptId((current) => current === id ? null : id)}
              />
            </AuroraMaxRankedWorkspace>
          </>
        ) : null}

        <div className="hr-max-notes">
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
