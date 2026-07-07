/**
 * MlbStatHubPage — Single page with nested tab state
 *
 * Judge panel decisions applied:
 * - Single page (Judge 4): no separate sub-pages, nested tab state only
 * - Tabs: today | leaders | vs_team | spreadsheet
 * - Phase 2 stats show beta banner
 * - All colors via CSS tokens
 * - Responsive: full-screen inset-0, scrollable content area
 */

import React, { Suspense } from 'react';
import { StatHubHeader }       from '../components/StatHubHeader';
import { StatCategoryGrid }    from '../components/StatCategoryGrid';
import { StatLeaderboardTable } from '../components/StatLeaderboardTable';
import { StatResearchDrawer }  from '../components/StatResearchDrawer';
import { useMlbStatHub }       from '../hooks/useMlbStatHub';
import { STAT_CONFIG }         from '../engine/statHubConfig';

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'today',       label: "Today's Board",  icon: '📅' },
  { id: 'leaders',     label: 'Leaders',         icon: '🏆' },
  { id: 'vs_team',     label: 'vs Team',         icon: '⚔️' },
  { id: 'spreadsheet', label: 'Spreadsheet',     icon: '📋' },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MlbStatHubPage() {
  const hub     = useMlbStatHub();
  const config  = STAT_CONFIG[hub.filters.statType];
  const isPhase2 = config.phase === 2;
  const rangeLabel = hub.filters.statScope === 'season'
    ? `${hub.filters.date.slice(0, 4)} season`
    : 'overall career';
  const loadingRangeLabel = hub.filters.statScope === 'season'
    ? 'selected-season'
    : 'overall career';

  return (
    <div className="flex flex-col h-full min-h-0 bg-[hsl(var(--ve-bg))]">
      {/* Sticky top section */}
      <div className="shrink-0 px-4 pt-4 sm:px-6 lg:px-8 bg-[hsl(var(--ve-bg)/0.97)] backdrop-blur-sm sticky top-0 z-30">
        <StatHubHeader
          activeStatType={hub.filters.statType}
          date={hub.filters.date}
          statScope={hub.filters.statScope}
          search={hub.filters.search ?? ''}
          viewMode={hub.filters.viewMode}
          tierFilter={hub.filters.tierFilter}
          tierCounts={hub.tierCounts}
          onStatType={hub.setStatType}
          onDate={hub.setDate}
          onStatScope={hub.setStatScope}
          onSearch={hub.setSearch}
          onViewMode={hub.setViewMode}
          onToggleTier={hub.toggleTier}
        />

        {/* View tabs */}
        <div
          role="tablist"
          aria-label="View mode"
          className="flex gap-1 mt-3 border-b border-[hsl(var(--ve-border)/0.4)] overflow-x-auto pb-0"
          style={{ scrollbarWidth: 'none' }}
        >
          {TABS.map(tab => {
            const active = hub.filters.viewTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                onClick={() => hub.setViewTab(tab.id as typeof hub.filters.viewTab)}
                className={[
                  'flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap',
                  'border-b-2 transition-all duration-[var(--ve-duration-fast)] -mb-px',
                  'focus-visible:outline focus-visible:outline-2',
                  active
                    ? 'border-[hsl(var(--ve-accent-cyan))] text-[hsl(var(--ve-accent-cyan))]'
                    : 'border-transparent text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text-primary))]',
                ].join(' ')}
              >
                <span aria-hidden="true">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Beta banner for Phase 2 stats */}
      {isPhase2 && (
        <div className="shrink-0 mx-4 mt-3 sm:mx-6 lg:mx-8 px-4 py-2.5 rounded-xl flex items-center gap-3 bg-[hsl(var(--ve-accent-pink)/0.08)] border border-[hsl(var(--ve-accent-pink)/0.3)]">
          <span className="text-xs font-bold text-[hsl(var(--ve-accent-pink))] bg-[hsl(var(--ve-accent-pink)/0.15)] px-1.5 py-0.5 rounded border border-[hsl(var(--ve-accent-pink)/0.4)]">
            β BETA
          </span>
          <p className="text-xs text-[hsl(var(--ve-text-muted))]">
            <strong className="text-[hsl(var(--ve-accent-pink)/0.9)]">{config.label}</strong> scoring is Phase 2 — model not yet backtested. Use as a directional signal only.
          </p>
        </div>
      )}

      <div className={[
        'shrink-0 mx-4 mt-3 sm:mx-6 lg:mx-8 px-4 py-2.5 rounded-xl flex items-center gap-3',
        hub.error
          ? 'bg-[hsl(var(--ve-danger)/0.10)] border border-[hsl(var(--ve-danger)/0.32)]'
          : 'bg-[hsl(var(--ve-accent-cyan)/0.08)] border border-[hsl(var(--ve-accent-cyan)/0.24)]',
      ].join(' ')}>
        <span className={[
          'text-xs font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide',
          hub.error
            ? 'text-[hsl(var(--ve-danger))] bg-[hsl(var(--ve-danger)/0.12)] border-[hsl(var(--ve-danger)/0.35)]'
            : 'text-[hsl(var(--ve-accent-cyan))] bg-[hsl(var(--ve-accent-cyan)/0.12)] border-[hsl(var(--ve-accent-cyan)/0.30)]',
        ].join(' ')}>
          MLB API
        </span>
        <p className="text-xs text-[hsl(var(--ve-text-muted))]">
          {hub.error
            ? `${hub.error}. No mock Stat Hub rows are being shown.`
            : hub.loading
              ? `Loading today’s schedule, active rosters, and ${loadingRangeLabel} stats from MLB Stats API.`
              : `${hub.allRows.length} real MLB API row${hub.allRows.length === 1 ? '' : 's'} loaded for ${config.label} (${rangeLabel}). Official lineups are not inferred.`}
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-4 py-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
          <Suspense fallback={<LoadingSkeleton />}>
            <TabContent hub={hub} />
          </Suspense>
        </div>
      </div>

      {/* Research drawer */}
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

// ─── Tab content switcher ─────────────────────────────────────────────────────

function TabContent({ hub }: { hub: ReturnType<typeof useMlbStatHub> }) {
  const { filters, rows, setSort, openDrawer } = hub;

  if (hub.loading) {
    return <LoadingSkeleton />;
  }

  if (hub.error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="max-w-lg rounded-xl border border-[hsl(var(--ve-danger)/0.30)] bg-[hsl(var(--ve-danger)/0.08)] p-5 text-center">
          <h2 className="text-sm font-bold text-[hsl(var(--ve-text-primary))]">MLB Stat Hub unavailable</h2>
          <p className="mt-2 text-xs leading-5 text-[hsl(var(--ve-text-muted))]">
            {hub.error}. No mock rows are shown when the MLB API is unavailable.
          </p>
        </div>
      </div>
    );
  }

  switch (filters.viewTab) {
    case 'today':
      return filters.viewMode === 'cards'
        ? <StatCategoryGrid rows={rows} statType={filters.statType} onSelect={openDrawer} />
        : <StatLeaderboardTable
            rows={rows}
            statType={filters.statType}
            sortField={filters.sortField}
            sortDir={filters.sortDir}
            onSort={setSort}
            onSelect={openDrawer}
          />;

    case 'leaders':
      return (
        <LeadersView hub={hub} />
      );

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

// ─── Leaders view ─────────────────────────────────────────────────────────────

function LeadersView({ hub }: { hub: ReturnType<typeof useMlbStatHub> }) {
  const { filters, allRows, openDrawer, setSort } = hub;
  const bySeasonDesc = [...allRows].sort((a, b) => (b.seasonValue ?? 0) - (a.seasonValue ?? 0));
  const rangeLabel = filters.statScope === 'season' ? 'Season' : 'Career';

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-[hsl(var(--ve-text-muted))]">
        {rangeLabel} leaders ranked by {STAT_CONFIG[filters.statType].label} total. Click any row to open full research.
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

// ─── vs Team view ─────────────────────────────────────────────────────────────

function VsTeamView({ hub }: { hub: ReturnType<typeof useMlbStatHub> }) {
  const { filters, allRows, openDrawer, setTeam, setSort } = hub;

  // Get unique teams
  const teams = Array.from(new Set(allRows.flatMap(r => [r.team, r.opponent]))).sort();
  const filtered = filters.team
    ? allRows.filter(r => r.team === filters.team || r.opponent === filters.team)
    : allRows;

  return (
    <div className="flex flex-col gap-5">
      {/* Team selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-[hsl(var(--ve-text-muted))]">Filter by team:</span>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setTeam(null)}
            className={[
              'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
              !filters.team
                ? 'bg-[hsl(var(--ve-accent-cyan)/0.18)] text-[hsl(var(--ve-accent-cyan))] border border-[hsl(var(--ve-accent-cyan)/0.4)]'
                : 'text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text-primary))] bg-[hsl(var(--ve-surface)/0.4)] border border-[hsl(var(--ve-border)/0.4)]',
            ].join(' ')}
          >
            All
          </button>
          {teams.map(team => (
            <button
              key={team}
              onClick={() => setTeam(team === filters.team ? null : team)}
              className={[
                'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
                filters.team === team
                  ? 'bg-[hsl(var(--ve-accent-cyan)/0.18)] text-[hsl(var(--ve-accent-cyan))] border border-[hsl(var(--ve-accent-cyan)/0.4)]'
                  : 'text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text-primary))] bg-[hsl(var(--ve-surface)/0.4)] border border-[hsl(var(--ve-border)/0.4)]',
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

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse" aria-busy="true" aria-label="Loading...">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-24 rounded-xl bg-[hsl(var(--ve-surface)/0.4)] border border-[hsl(var(--ve-border)/0.3)]"
        />
      ))}
    </div>
  );
}
