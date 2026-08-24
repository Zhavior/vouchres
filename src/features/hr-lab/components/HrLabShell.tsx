import { useCallback, useMemo, useState } from 'react';
import { useHrNextData } from '../../hr-next/hooks/useHrNextData';
import { buildSlateTelemetry } from '../../hr-next/utils/slateTelemetry';
import { openParlayAdd } from '../../../lib/parlays/parlayAddContract';
import { toHrParlayPickerPlayer } from '../../hr/utils/hrDecisionBrief';
import { useHrListStore, selectActiveHrList } from '../../hr-list/hrListStore';
import { hrWatchRowToListEntry } from '../../hr-list/adapters/hrWatchRowToListEntry';
import { useResearchStore } from '../../../stores/useResearchStore';
import { extractCardData } from '../../hr-next/utils/cardUtils';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import { HrLabCommandStrip } from './HrLabCommandStrip';
import { HrLabStage } from './HrLabStage';
import { HrLabRegister } from './HrLabRegister';
import { HrLabProGrid } from './HrLabProGrid';
import { HrNextProjectionMatrix } from '../../hr-next/components/HrNextProjectionMatrix';
import { HrNextTeamRankView } from '../../hr-next/components/HrNextTeamRankView';
import { HrNextVerifiedNow } from '../../hr-next/components/HrNextVerifiedNow';
import { HrNextKeyboardCheatsheet } from '../../hr-next/components/HrNextKeyboardCheatsheet';
import { buildVerifiedNowSlate } from '../../hr-next/utils/verifiedNow';
import { buildTeamRankings } from '../../hr-next/utils/teamRanking';

/**
 * HR Lab — the Collision Lab composition.
 *
 * Three layers at 1440: a quiet command strip across the top, a sticky
 * Collision Stage on the left, and the ranked register scrolling beside it.
 * The stage stays on screen while the register is scanned, which is the whole
 * argument for the layout — pick row 40 and the reading updates in place.
 *
 * This is presentation only. Every hook, model and contract is HR Next's:
 * useHrNextData, openParlayAdd, the HR list store and the research store are
 * imported unchanged, so both surfaces read and write the same state.
 */
export function HrLabShell() {
  const {
    items,
    rawRows,
    filterCounts,
    filterTag,
    setFilterTag,
    isLoading,
    error,
    refetch,
    mode,
    setMode,
    date,
    setDate,
    syncing,
    sortKey,
    setSortKey,
    groupBy,
    setGroupBy,
    searchQuery,
    setSearchQuery,
  } = useHrNextData();

  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [proMode, setProMode] = useState(false);
  const [view, setView] = useState<'tier' | 'matchup' | 'none' | 'matrix' | 'team'>('tier');
  const [statcastResolved, setStatcastResolved] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [keysOpen, setKeysOpen] = useState(false);

  /*
   * Matrix and Team are analytical projections of the flat pool rather than
   * groupings, so selecting them sets the hook to 'none' and renders the
   * projection over it — the same model HR Next uses.
   */
  const selectView = useCallback(
    (next: 'tier' | 'matchup' | 'none' | 'matrix' | 'team') => {
      setView(next);
      setGroupBy(next === 'matrix' || next === 'team' ? 'none' : next);
    },
    [setGroupBy],
  );

  const telemetry = useMemo(() => buildSlateTelemetry(rawRows), [rawRows]);
  const verifiedSlate = useMemo(() => buildVerifiedNowSlate(rawRows), [rawRows]);
  const teamRankings = useMemo(() => buildTeamRankings(rawRows), [rawRows]);

  // Saved-list wiring, identical to HR Next's.
  const activeHrList = useHrListStore(selectActiveHrList);
  const addHrListPlayer = useHrListStore((s) => s.addPlayer);
  const removeHrListPlayer = useHrListStore((s) => s.removePlayer);

  const savedPlayerIds = useMemo(
    () => new Set((activeHrList?.entries ?? []).map((entry) => String(entry.playerId))),
    [activeHrList],
  );

  const savedMap = useMemo(() => {
    const map: Record<string, true> = {};
    for (const item of rawRows) {
      if (item.playerId != null && savedPlayerIds.has(String(item.playerId))) {
        map[item.stableId] = true;
      }
    }
    return map;
  }, [rawRows, savedPlayerIds]);

  const toggleSaved = useCallback(
    (id: string) => {
      const row = rawRows.find((candidate) => candidate.stableId === id);
      if (!row) return;
      const entry = hrWatchRowToListEntry(row);
      if (!entry) return;
      if (savedPlayerIds.has(String(entry.playerId))) {
        if (activeHrList) void removeHrListPlayer(activeHrList.id, entry.playerId);
        return;
      }
      if (activeHrList) void addHrListPlayer(activeHrList.id, entry);
    },
    [rawRows, savedPlayerIds, activeHrList, addHrListPlayer, removeHrListPlayer],
  );

  const handleAddToSlip = useCallback((row: HrWatchRow) => {
    openParlayAdd({
      player: toHrParlayPickerPlayer(row),
      source: 'hr_intelligence',
      dataStatus:
        row.truthStatus === 'official'
          ? 'official'
          : row.truthStatus === 'projected'
            ? 'projected'
            : 'unknown',
      reasoningSnapshot:
        row.reasons?.[0]?.trim() || 'No model rationale was supplied for this signal.',
      riskSnapshot:
        row.warnings?.[0]?.trim() ||
        'No specific risk note was supplied. Verify the lineup and market before adding.',
    });
  }, []);

  /**
   * Export. Saved candidates when the list has any, otherwise the whole
   * filtered set — the board's own rule, and the payload is built from
   * extractCardData so both surfaces emit identical records.
   */
  const handleExport = useCallback(
    (format: 'json' | 'csv') => {
      const savedKeys = Object.keys(savedMap);
      const target = items.filter(
        (item) => item.type === 'row' && (savedKeys.length === 0 || savedMap[item.row.stableId]),
      );
      if (target.length === 0) {
        setExportStatus('Nothing to export');
        window.setTimeout(() => setExportStatus(null), 2400);
        return;
      }

      const payload = target.map((item: any) => {
        const row = item.row;
        const data = extractCardData(row);
        return {
          player: row.playerName,
          team: row.team,
          matchup: data.matchupLabel,
          hrpi: data.score,
          lineup: data.lineupLabel,
          odds: data.bookOddsLabel,
          evEdge: data.evEdge,
        };
      });

      let blob: Blob;
      if (format === 'csv') {
        const headers = Object.keys(payload[0]);
        const lines = [
          headers.join(','),
          ...payload.map((r: any) =>
            headers.map((h) => JSON.stringify(r[h] ?? '')).join(','),
          ),
        ];
        blob = new Blob([lines.join('\n')], { type: 'text/csv' });
      } else {
        blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vouchedge-hr-${date}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus(`${payload.length} exported`);
      window.setTimeout(() => setExportStatus(null), 2400);
    },
    [items, savedMap, date],
  );

  const openDrawer = useResearchStore((s) => s.openDrawer);
  const handleOpenResearch = useCallback(
    (row: HrWatchRow) => {
      openDrawer({ id: row.playerId ?? row.stableId, name: row.playerName });
    },
    [openDrawer],
  );

  /** Matrix and Team speak the {id,name} shape rather than a row. */
  const handleOpenResearchByPlayer = useCallback(
    (player: { id: string | number; name: string }) => openDrawer(player),
    [openDrawer],
  );

  // The stage follows selection, and falls back to the ranked leader so the
  // instrument is never blank on arrival.
  const rowItems = useMemo(() => items.filter((i) => i.type === 'row'), [items]);

  const { stageRow, stageRank, isLeader } = useMemo(() => {
    if (rowItems.length === 0) return { stageRow: null, stageRank: null, isLeader: false };
    const idx = focusedId
      ? rowItems.findIndex((i) => i.type === 'row' && i.row.stableId === focusedId)
      : -1;
    const resolved = idx >= 0 ? idx : 0;
    const item = rowItems[resolved];
    return {
      stageRow: item.type === 'row' ? item.row : null,
      stageRank: resolved + 1,
      isLeader: resolved === 0,
    };
  }, [rowItems, focusedId]);

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <HrLabCommandStrip
        telemetry={telemetry}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        filterTag={filterTag}
        onFilterTag={setFilterTag}
        filterCounts={filterCounts}
        view={view}
        onView={selectView}
        lineupMode={mode}
        onLineupMode={setMode}
        statcastResolved={statcastResolved}
        onToggleStatcast={() => setStatcastResolved((v) => !v)}
        onExport={handleExport}
        exportStatus={exportStatus}
        savedCount={Object.keys(savedMap).length}
        onOpenKeys={() => setKeysOpen(true)}
        sortKey={sortKey}
        onSortKey={setSortKey}
        date={date}
        onDate={setDate}
        syncing={syncing}
        onRefresh={refetch}
        proMode={proMode}
        onProMode={setProMode}
      />

      {error && (
        <div className="border-b border-ve-red/25 bg-ve-red/[0.06] px-5 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ve-red">
            Feed degraded — {String(error)}
          </p>
        </div>
      )}

      {verifiedSlate && (
        <div className="border-b border-white/[0.08] px-5 py-3">
          <HrNextVerifiedNow
            slate={verifiedSlate}
            onOpenResearch={handleOpenResearchByPlayer}
            onAddToSlip={handleAddToSlip}
          />
        </div>
      )}

      <HrNextKeyboardCheatsheet isOpen={keysOpen} onClose={() => setKeysOpen(false)} />

      <div className="grid min-w-0 flex-1 grid-cols-1 gap-8 px-5 py-6 xl:grid-cols-12 xl:gap-10">
        {/* Stage — sticky so the reading survives the scan. */}
        <div className="min-w-0 xl:col-span-5 2xl:col-span-4">
          <div className="xl:sticky xl:top-[124px]">
            <HrLabStage
              row={stageRow}
              rank={stageRank}
              isLeader={isLeader}
              onAddToSlip={handleAddToSlip}
              onOpenResearch={handleOpenResearch}
            />
          </div>
        </div>

        {/* Register */}
        <div className="min-w-0 xl:col-span-7 2xl:col-span-8">
          {isLoading && rowItems.length === 0 ? (
            <p className="py-16 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-white/25">
              Loading slate
            </p>
          ) : rowItems.length === 0 ? (
            <p className="py-16 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-white/25">
              No candidates match the active filters
            </p>
          ) : (
            (() => {
              const shared = {
                items,
                activeId: stageRow?.stableId ?? null,
                onSelect: setFocusedId,
                savedMap,
                onToggleSaved: toggleSaved,
                onAddToSlip: handleAddToSlip,
              };

              // The page transforms into whichever projection is selected.
              if (view === 'matrix') {
                return (
                  <HrNextProjectionMatrix
                    rows={rawRows}
                    scopeLabel="Full slate"
                    savedMap={savedMap}
                    onToggleSaved={toggleSaved}
                    onAddToSlip={handleAddToSlip}
                    onOpenResearch={handleOpenResearchByPlayer}
                    onClose={() => selectView('tier')}
                    resolveStatcast={statcastResolved}
                    onToggleStatcast={() => setStatcastResolved((v) => !v)}
                  />
                );
              }

              if (view === 'team') {
                return (
                  <HrNextTeamRankView
                    rankings={teamRankings}
                    scopeLabel="Full slate"
                    savedMap={savedMap}
                    onToggleSaved={toggleSaved}
                    onAddToSlip={handleAddToSlip}
                    onOpenResearch={handleOpenResearchByPlayer}
                    onClose={() => selectView('tier')}
                  />
                );
              }

              // Pro Mode is the tier view's modifier, so it only applies there.
              return proMode && view === 'tier' ? (
                <HrLabProGrid {...shared} />
              ) : (
                <HrLabRegister {...shared} />
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}

export default HrLabShell;
