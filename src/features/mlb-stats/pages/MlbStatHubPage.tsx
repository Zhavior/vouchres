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
import {
  Z8_LABEL,
  Z8_PAGE,
  Z8_PAGE_PAD_X,
  Z8_PANEL_PREMIUM,
} from '../../../theme/z8Tokens';

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
    <div className={`flex h-full min-h-0 flex-col ${Z8_PAGE}`}>
      {/* Sticky top section */}
      <div className={`sticky top-0 z-30 shrink-0 ${Z8_PAGE_PAD_X} pt-4 sm:px-6 lg:px-8`}>
        <div className={`${Z8_PANEL_PREMIUM} rounded-2xl p-4 sm:p-5`}>
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
          className="mt-3 flex gap-1 overflow-x-auto border-b border-white/10 pb-0"
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
                  'flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-xs font-semibold',
                  'border-b-2 -mb-px transition-all duration-200 focus-visible:outline focus-visible:outline-2',
                  active ? 'border-vouch-cyan text-vouch-cyan' : 'border-transparent text-white/45 hover:text-white',
                ].join(' ')}
              >
                <span aria-hidden="true">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
        </div>
      </div>

      {/* Beta banner for Phase 2 stats */}
      {isPhase2 && (
        <div className={`mx-4 mt-3 flex shrink-0 items-center gap-3 rounded-xl border border-vouch-amber/30 bg-vouch-amber/8 px-4 py-2.5 sm:mx-6 lg:mx-8`}>
          <span className={`${Z8_LABEL} rounded border border-vouch-amber/40 bg-vouch-amber/15 px-1.5 py-0.5 text-vouch-amber`}>
            β BETA
          </span>
          <p className="text-xs text-white/45">
            <strong className="text-vouch-amber/90">{config.label}</strong> scoring is Phase 2 — model not yet backtested. Use as a directional signal only.
          </p>
        </div>
      )}

      <div className={[
        'mx-4 mt-3 flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 sm:mx-6 lg:mx-8',
        hub.error
          ? 'border border-red-500/30 bg-red-500/10'
          : `${Z8_PANEL_PREMIUM} border-vouch-cyan/20`,
      ].join(' ')}>
        <span className={[
          `${Z8_LABEL} rounded border px-1.5 py-0.5 uppercase tracking-wide`,
          hub.error
            ? 'border-red-500/35 bg-red-500/12 text-red-400'
            : 'border-vouch-cyan/30 bg-vouch-cyan/12 text-vouch-cyan',
        ].join(' ')}>
          MLB API
        </span>
        <p className="text-xs text-white/45">
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
