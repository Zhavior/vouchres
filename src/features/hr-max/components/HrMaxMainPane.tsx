import React from 'react';
import { ArrowDownUp, Download, Filter } from 'lucide-react';
import { AuroraMaxControl, AuroraMaxRankedWorkspace } from '../../../components/aurora-max/AuroraMaxPrimitives';
import type { HrDeskViewMode } from './HrMaxDesk';
import { SORT_LABELS, type DeskSortKey, type HrMaxDeskRow } from '../mapHrWatchToDesk';
import { HrMaxSlateQueue } from './HrMaxSlateQueue';
import { HrMaxCardBoard } from './HrMaxCardBoard';
import { HrMaxTableView } from './HrMaxTableView';
import { HrMaxGameStacksView } from './HrMaxGameStacksView';

export interface HrMaxMainPaneProps {
  viewMode: HrDeskViewMode;
  rows: HrMaxDeskRow[];
  activeId: string | null;
  receiptId: string | null;
  confirmedOnly: boolean;
  confirmedCount: number;
  sortKey: DeskSortKey;
  isSaved: (id: string) => boolean;
  onSelect: (id: string) => void;
  onToggleSaved: (id: string) => void;
  onToggleReceipt: (id: string) => void;
  onAddToSlip: (row: HrMaxDeskRow) => void;
  onCycleSort: () => void;
  onToggleMode: () => void;
  onExport: () => void;
  selectedTiers: string[];
}

export const HrMaxMainPane = React.memo(function HrMaxMainPane({
  viewMode,
  rows,
  activeId,
  receiptId,
  confirmedOnly,
  confirmedCount,
  sortKey,
  isSaved,
  onSelect,
  onToggleSaved,
  onToggleReceipt,
  onAddToSlip,
  onCycleSort,
  onToggleMode,
  onExport,
  selectedTiers,
}: HrMaxMainPaneProps) {
  if (rows.length === 0) return null;

  const Controls = (
    <div className="flex flex-wrap gap-2">
      <AuroraMaxControl
        aria-pressed={confirmedOnly}
        onClick={onToggleMode}
      >
        <Filter className="h-3.5 w-3.5" aria-hidden="true" />
        {confirmedOnly ? 'Confirmed only' : 'All lineups'}
      </AuroraMaxControl>
      <AuroraMaxControl onClick={onCycleSort}>
        <ArrowDownUp className="h-3.5 w-3.5" aria-hidden="true" />
        {SORT_LABELS[sortKey]}
      </AuroraMaxControl>
      <AuroraMaxControl onClick={onExport}>
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        Export receipts
      </AuroraMaxControl>
    </div>
  );

  if (viewMode === 'queue') {
    return (
      <AuroraMaxRankedWorkspace
        title="Daily slate"
        subtitle={`${rows.length} ranked matchups · ${confirmedCount} confirmed`}
        controls={Controls}
      >
        <HrMaxSlateQueue
          rows={rows}
          activeId={activeId}
          isSaved={isSaved}
          receiptId={receiptId}
          onSelect={onSelect}
          onToggleSaved={onToggleSaved}
          onToggleReceipt={onToggleReceipt}
        />
      </AuroraMaxRankedWorkspace>
    );
  }

  if (viewMode === 'cards') {
    return (
      <AuroraMaxRankedWorkspace
        title="4-Tier Signal Board"
        subtitle={`${rows.length} total players categorized by machine-scored HRPI`}
        controls={Controls}
      >
        <div className="p-2 sm:p-4">
          <HrMaxCardBoard
            rows={rows}
            activeId={activeId}
            receiptId={receiptId}
            isSaved={isSaved}
            onSelect={onSelect}
            onToggleSaved={onToggleSaved}
            onToggleReceipt={onToggleReceipt}
            onAddToSlip={onAddToSlip}
            selectedTiers={selectedTiers}
          />
        </div>
      </AuroraMaxRankedWorkspace>
    );
  }

  if (viewMode === 'games') {
    return (
      <AuroraMaxRankedWorkspace
        title="Game Matchup Stacks"
        subtitle={`${rows.length} batters organized by game matchup and opposing starting pitchers`}
        controls={Controls}
      >
        <div className="p-2 sm:p-4">
          <HrMaxGameStacksView
            rows={rows}
            activeId={activeId}
            isSaved={isSaved}
            onSelect={onSelect}
            onToggleSaved={onToggleSaved}
            onAddToSlip={onAddToSlip}
          />
        </div>
      </AuroraMaxRankedWorkspace>
    );
  }

  return (
    <AuroraMaxRankedWorkspace
      title="HRPI table"
      subtitle={`${rows.length} ranked batters · HRPI, matchup, lineup, and research signal`}
      controls={Controls}
    >
      <div className="p-2 sm:p-4">
        <HrMaxTableView
          rows={rows}
          activeId={activeId}
          isSaved={isSaved}
          onSelect={onSelect}
          onToggleSaved={onToggleSaved}
          onAddToSlip={onAddToSlip}
        />
      </div>
    </AuroraMaxRankedWorkspace>
  );
});
