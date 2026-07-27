/**
 * MlbStatHubPage — MLB Stat Intelligence Hub (Z8 Design System)
 */

import React, { Suspense } from 'react';
import { StatHubHeader } from '../components/StatHubHeader';
import { StatCategoryGrid } from '../components/StatCategoryGrid';
import { StatLeaderboardTable } from '../components/StatLeaderboardTable';
import { StatResearchDrawer } from '../components/StatResearchDrawer';
import { useMlbStatHub } from '../hooks/useMlbStatHub';
import { STAT_CONFIG } from '../engine/statHubConfig';
import { Z8_PAGE, Z8_PAGE_SHELL, Z8_PANEL_PREMIUM, Z8_PANEL } from '../../../theme/z8Tokens';

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
    <div className={`${Z8_PAGE} w-full max-w-full overflow-x-hidden min-w-0 text-white pb-24`}>
      <div className={`${Z8_PAGE_SHELL} space-y-4 sm:space-y-6`}>

        {/* ── Top Header & Command Center Bar ──────────────────────────── */}
        <div className="rounded-2xl border border-white/12 bg-gradient-to-r from-[#0b1625]/90 via-[#07111e]/90 to-[#040810]/90 p-4 sm:p-5 shadow-2xl backdrop-blur-xl space-y-4">
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

          {/* Navigation View Mode Tabs */}
          <div className="flex items-center gap-2 pt-3 border-t border-white/10 overflow-x-auto no-scrollbar">
            {TABS.map((tab) => {
              const active = hub.filters.viewTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => hub.setViewTab(tab.id as typeof hub.filters.viewTab)}
                  className={`px-4 py-2 rounded-xl text-xs font-black font-mono uppercase tracking-wider transition ${
                    active
                      ? 'bg-vouch-cyan/20 border border-vouch-cyan/50 text-vouch-cyan shadow-[0_0_12px_rgba(79,184,220,0.2)]'
                      : 'border border-white/10 bg-black/40 text-slate-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {isPhase2 && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3.5 py-2 text-xs font-mono text-amber-300">
              <span className="font-bold uppercase tracking-wider text-amber-400 bg-amber-400/20 px-1.5 py-0.5 rounded mr-2">
                BETA
              </span>
              {config.label} scoring is Phase 2 — directional signal model active.
            </div>
          )}
        </div>

        {/* ── Main Data View ───────────────────────────────────────────── */}
        <div className="min-w-0 w-full">
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
        <div className="max-w-lg rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center shadow-2xl">
          <h2 className="text-sm font-black uppercase text-rose-300">Stat Hub Stream Unavailable</h2>
          <p className="mt-2 text-xs text-slate-300 leading-relaxed">{hub.error}</p>
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
  }
}

function LeadersView({ hub }: { hub: ReturnType<typeof useMlbStatHub> }) {
  return (
    <StatLeaderboardTable
      rows={hub.rows}
      statType={hub.filters.statType}
      sortField={hub.filters.sortField}
      sortDir={hub.filters.sortDir}
      onSort={hub.setSort}
      onSelect={hub.openDrawer}
    />
  );
}

function VsTeamView({ hub }: { hub: ReturnType<typeof useMlbStatHub> }) {
  return (
    <StatLeaderboardTable
      rows={hub.rows}
      statType={hub.filters.statType}
      sortField={hub.filters.sortField}
      sortDir={hub.filters.sortDir}
      onSort={hub.setSort}
      onSelect={hub.openDrawer}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-48 rounded-2xl border border-white/10 bg-black/40 animate-pulse" />
      ))}
    </div>
  );
}
