/**
 * MlbStatHubPage — MLB Stat Intelligence Hub
 */

import React, { Suspense } from 'react';
import { StatHubHeader } from '../components/StatHubHeader';
import { StatCategoryGrid } from '../components/StatCategoryGrid';
import { StatLeaderboardTable } from '../components/StatLeaderboardTable';
import { StatResearchDrawer } from '../components/StatResearchDrawer';
import { useMlbStatHub } from '../hooks/useMlbStatHub';
import { STAT_CONFIG } from '../engine/statHubConfig';
import '../../../styles/stat-hub.css';

const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'leaders', label: 'Leaders' },
  { id: 'vs_team', label: 'Vs Team' },
  { id: 'spreadsheet', label: 'Spreadsheet' },
] as const;

export default function MlbStatHubPage() {
  const hub = useMlbStatHub();
  const config = STAT_CONFIG[hub.filters.statType];
  const isPhase2 = config.phase === 2;

  return (
    <div className="ve-stat-hub-page flex h-full min-h-0 flex-col bg-transparent font-z8 text-white">
      <div className="ve-stat-hub-chrome sticky top-0 z-30 shrink-0 border-b border-white/8 px-3 pt-3 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[1600px] ve-stat-surface rounded-xl border border-white/10 p-3 sm:p-4">
          <StatHubHeader
            activeStatType={hub.filters.statType}
            date={hub.filters.date}
            statScope={hub.filters.statScope}
            search={hub.filters.search ?? ''}
            viewMode={hub.filters.viewMode}
            tierFilter={hub.filters.tierFilter}
            tierCounts={hub.tierCounts}
            rowCount={hub.allRows.length}
            loading={hub.loading}
            error={hub.error}
            onStatType={hub.setStatType}
            onDate={hub.setDate}
            onStatScope={hub.setStatScope}
            onSearch={hub.setSearch}
            onViewMode={hub.setViewMode}
            onToggleTier={hub.toggleTier}
          />

          <div
            role="tablist"
            aria-label="View mode"
            className="ve-stat-hub-view-tabs ve-stat-hub-scroll-x mt-3 border-t border-white/8 pt-2"
          >
            {TABS.map((tab) => {
              const active = hub.filters.viewTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => hub.setViewTab(tab.id as typeof hub.filters.viewTab)}
                  className={[
                    've-stat-hub-pill rounded-md border px-3 py-2 text-[11px] font-semibold transition',
                    active
                      ? 'border-white/20 bg-white/10 text-white'
                      : 'border-transparent text-white/40 hover:text-white/65',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {isPhase2 && (
          <div className="mx-auto mt-2 max-w-[1600px] rounded-lg border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-[11px] text-amber-100/80">
            <span className="font-mono text-[9px] font-bold uppercase tracking-wide text-amber-200/90">Beta</span>
            {' '}
            {config.label} scoring is Phase 2 — directional signal only, not backtested yet.
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5 lg:px-6">
          <Suspense fallback={<LoadingSkeleton />}>
            <TabContent hub={hub} />
          </Suspense>
        </div>
      </div>

      <StatResearchDrawer
        player={hub.selectedPlayer}
        statType={hub.filters.statType}
        statScope={hub.filters.statScope}
        open={hub.drawerOpen}
        onClose={hub.closeDrawer}
      />
    </div>
  );
}

function TabContent({ hub }: { hub: ReturnType<typeof useMlbStatHub> }) {
  const { filters, rows, setSort, openDrawer } = hub;

  if (hub.loading) return <LoadingSkeleton />;

  if (hub.error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="max-w-lg rounded-xl border border-red-500/25 bg-red-500/8 p-5 text-center">
          <h2 className="text-sm font-bold text-white">Stat Hub unavailable</h2>
          <p className="mt-2 text-xs leading-5 text-white/50">{hub.error}</p>
        </div>
      </div>
    );
  }

  switch (filters.viewTab) {
    case 'today':
      return filters.viewMode === 'cards'
        ? <StatCategoryGrid rows={rows} statType={filters.statType} onSelect={openDrawer} />
        : (
          <StatLeaderboardTable
            rows={rows}
            statType={filters.statType}
            sortField={filters.sortField}
            sortDir={filters.sortDir}
            onSort={setSort}
            onSelect={openDrawer}
          />
        );

    case 'leaders':
      return <LeadersView hub={hub} />;

    case 'vs_team':
      return <VsTeamView hub={hub} />;

    case 'spreadsheet':
      return (
        <StatLeaderboardTable
          rows={rows}
          statType={filters.statType}
          sortField={filters.sortField}
          sortDir={filters.sortDir}
          onSort={setSort}
          onSelect={openDrawer}
        />
      );

    default:
      return null;
  }
}

function LeadersView({ hub }: { hub: ReturnType<typeof useMlbStatHub> }) {
  const { filters, allRows, openDrawer, setSort } = hub;
  const bySeasonDesc = [...allRows].sort((a, b) => (b.seasonValue ?? 0) - (a.seasonValue ?? 0));
  const rangeLabel = filters.statScope === 'season' ? 'Season' : 'Career';

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-white/45">
        {rangeLabel} leaders by {STAT_CONFIG[filters.statType].label}. Tap a row for full research.
      </p>
      <StatLeaderboardTable
        rows={bySeasonDesc}
        statType={filters.statType}
        sortField="season"
        sortDir="desc"
        onSort={setSort}
        onSelect={openDrawer}
      />
    </div>
  );
}

function VsTeamView({ hub }: { hub: ReturnType<typeof useMlbStatHub> }) {
  const { filters, allRows, openDrawer, setTeam, setSort } = hub;
  const teams = Array.from(new Set(allRows.flatMap((r) => [r.team, r.opponent]))).sort();
  const filtered = filters.team
    ? allRows.filter((r) => r.team === filters.team || r.opponent === filters.team)
    : allRows;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <span className="shrink-0 text-xs text-white/45">Team filter</span>
        <div className="ve-stat-hub-scroll-x">
          <button
            type="button"
            onClick={() => setTeam(null)}
            className={[
              've-stat-hub-pill rounded-md border px-2.5 py-1 text-[11px] font-semibold',
              !filters.team ? 'border-white/20 bg-white/10 text-white' : 'border-white/8 text-white/40',
            ].join(' ')}
          >
            All
          </button>
          {teams.map((team) => (
            <button
              key={team}
              type="button"
              onClick={() => setTeam(team === filters.team ? null : team)}
              className={[
                've-stat-hub-pill rounded-md border px-2.5 py-1 text-[11px] font-semibold',
                filters.team === team ? 'border-white/20 bg-white/10 text-white' : 'border-white/8 text-white/40',
              ].join(' ')}
            >
              {team}
            </button>
          ))}
        </div>
      </div>

      <StatLeaderboardTable
        rows={filtered}
        statType={filters.statType}
        sortField={filters.sortField}
        sortDir={filters.sortDir}
        onSort={setSort}
        onSelect={openDrawer}
      />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse" aria-busy="true" aria-label="Loading">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="ve-stat-surface-raised h-20 rounded-xl border border-white/8" />
      ))}
    </div>
  );
}
