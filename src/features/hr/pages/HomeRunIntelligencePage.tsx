import React from 'react';
import { useHrBoardViewModel } from '../hooks/useHrBoardViewModel';
import { HrHeader } from '../components/Header/HrHeader';
import { HrToolbar } from '../components/Toolbar/HrToolbar';
import { HrBoard } from '../components/Columns/HrBoard';
import { HrPlayerDrawer } from '../components/Drawer/HrPlayerDrawer';

export default function HomeRunIntelligencePage() {
  const vm = useHrBoardViewModel();

  if (vm.error) {
    return (
      <div className="m-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
        Failed to load HR Data: {String(vm.error)}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070B] px-3 py-3 text-zinc-300 sm:px-4 lg:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
        <HrHeader
          viewMode={vm.viewMode}
          onViewModeChange={vm.setViewMode}
          mode={vm.mode}
        />

        <HrToolbar
          searchValue={vm.search}
          onSearchChange={vm.setSearch}
          mode={vm.mode}
          onModeChange={vm.setMode}
          selectedTiers={vm.selectedTiers}
          onToggleTier={vm.onToggleTier}
          visibleCount={vm.rows?.length ?? 0}
          totalCount={vm.stats?.total ?? 0}
          onExportCsv={() => {}}
        />

        {vm.loading ? (
          <div className="flex h-64 items-center justify-center text-xs uppercase tracking-[0.24em] text-zinc-500">
            Syncing MLB Data Feeds...
          </div>
        ) : (
          <HrBoard buckets={vm.buckets} onSelectPlayer={vm.setSelectedPlayer} />
        )}
      </div>

      <HrPlayerDrawer
        row={vm.selectedPlayer}
        onClose={() => vm.setSelectedPlayer(null)}
      />
    </div>
  );
}
