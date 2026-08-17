import { Activity, ArrowDownUp, CircleDot, Download, Filter, RefreshCw, Search } from 'lucide-react';
import type { HrWatchMode } from '../../hr/types/hrWatch';
import { SORT_LABELS, type DeskSortKey } from '../../hr-max/mapHrWatchToDesk';

const MODE_LABEL: Record<HrWatchMode, string> = {
  confirmed: 'Confirmed only',
  curated:   'Preview pool',
  all:       'All lineups',
  blocked:   'Blocked',
};

type Props = {
  date: string;
  maxDate: string;
  search: string;
  mode: HrWatchMode;
  sortKey: DeskSortKey;
  onSortChange: (key: DeskSortKey) => void;
  syncing: boolean;
  freshness: string;
  onDateChange: (d: string) => void;
  onSearchChange: (s: string) => void;
  onRefresh: () => void;
  onCycleMode: () => void;
  onCycleSort: () => void;
  onExport: () => void;
};

export function AuroraHqCommandBar({
  date,
  maxDate,
  search,
  mode,
  sortKey,
  syncing,
  freshness,
  onDateChange,
  onSearchChange,
  onRefresh,
  onCycleMode,
  onCycleSort,
  onExport,
}: Props) {
  const isConnected = freshness === 'fresh';
  const isDelayed   = freshness === 'delayed';

  return (
    <div className="aurora-hq__ops" role="toolbar" aria-label="Slate controls">
      {/* Live connectivity pill */}
      <div className="aurora-hq__feed-pill" aria-live="polite" aria-label={syncing ? 'Refreshing sources' : isConnected ? 'MLB feed connected' : isDelayed ? 'MLB feed delayed' : 'MLB feed stale'}>
        <span className={`aurora-hq__feed-dot ${!isConnected ? 'aurora-hq__feed-dot--stale' : ''}`} aria-hidden="true" />
        <Activity className="h-2.5 w-2.5" aria-hidden="true" />
        {syncing ? 'Refreshing' : isConnected ? 'MLB Feed Connected' : isDelayed ? 'Feed Delayed' : 'Feed Stale'}
      </div>

      {/* Date picker */}
      <label className="sr-only" htmlFor="aurora-hq-date">Slate date</label>
      <input
        id="aurora-hq-date"
        type="date"
        max={maxDate}
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        className="aurora-hq__control"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: 0, textTransform: 'none' }}
      />

      {/* Search */}
      <label className="sr-only" htmlFor="aurora-hq-search">Search slate</label>
      <div className="aurora-hq__search-wrap">
        <Search className="aurora-hq__search-icon h-3.5 w-3.5" aria-hidden="true" />
        <input
          id="aurora-hq-search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Player, team, pitcher, venue"
          className="aurora-hq__search"
        />
      </div>

      {/* Controls */}
      <button type="button" className="aurora-hq__control" onClick={onRefresh} disabled={syncing} aria-label="Refresh board">
        <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} aria-hidden="true" />
        Refresh
      </button>

      <button type="button" className="aurora-hq__control" onClick={onCycleMode} aria-label="Toggle lineup mode">
        <Filter className="h-3 w-3" aria-hidden="true" />
        {MODE_LABEL[mode]}
      </button>

      <button type="button" className="aurora-hq__control" onClick={onCycleSort} aria-label="Cycle sort order">
        <ArrowDownUp className="h-3 w-3" aria-hidden="true" />
        {SORT_LABELS[sortKey]}
      </button>

      <button type="button" className="aurora-hq__control aurora-hq__control--primary" onClick={onExport} aria-label="Export research receipts">
        <Download className="h-3 w-3" aria-hidden="true" />
        Export receipts
      </button>

      {/* Date / freshness display */}
      <span className="aurora-hq__eyebrow" style={{ marginLeft: 'auto' }}>
        <CircleDot className="h-2.5 w-2.5" aria-hidden="true" />
        {date}
      </span>
    </div>
  );
}
