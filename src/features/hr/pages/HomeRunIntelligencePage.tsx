import React from 'react';
import { useHrBoardViewModel } from '../hooks/useHrBoardViewModel';
import { HrHeader } from '../components/Header/HrHeader';
import { HrToolbar } from '../components/Toolbar/HrToolbar';
import { HrBoard } from '../components/Columns/HrBoard';
import { HrPlayerDrawer } from '../components/Drawer/HrPlayerDrawer';

export default function HomeRunIntelligencePage() {
  const vm = useHrBoardViewModel();

  if (vm.error) {
    return <div className="p-6 text-red-400 bg-red-500/10 rounded-xl m-6">Failed to load HR Data: {String(vm.error)}</div>;
  }

  return (
    <div className="min-h-screen bg-[#05070B] text-zinc-300 font-sans selection:bg-indigo-500/30 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <HrHeader search={vm.search} onSearchChange={vm.setSearch} />
        
        <HrToolbar 
          stats={vm.stats} 
          viewMode={vm.viewMode}
          onViewModeChange={vm.setViewMode}
          onRefresh={vm.refresh}
          loading={vm.loading}
        />

        {vm.loading ? (
          <div className="flex items-center justify-center h-64 text-zinc-500 tracking-widest uppercase text-sm animate-pulse">
            Syncing MLB Data Feeds...
          </div>
        ) : (
          <HrBoard 
            buckets={vm.buckets} 
            onSelectPlayer={vm.setSelectedPlayer} 
          />
        )}
      </div>

      <HrPlayerDrawer 
        selectedPlayer={vm.selectedPlayer} 
        onClose={() => vm.setSelectedPlayer(null)} 
      />
    </div>
  );
}
