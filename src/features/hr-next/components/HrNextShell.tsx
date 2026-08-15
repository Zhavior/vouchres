import { Search, Sparkles } from 'lucide-react';
import { useReducer, useCallback, useState } from 'react';
import { useHrNextData } from '../hooks/useHrNextData';
import { HrNextBoard } from './HrNextBoard';
import { openParlayAdd } from '../../../lib/parlays/parlayAddContract';
import { toHrParlayPickerPlayer } from '../../hr/utils/hrDecisionBrief';
import { extractCardData } from '../utils/cardUtils';
import { HrNextSortMenu } from './HrNextSortMenu';
import { HrNextResearchView } from './HrNextResearchView';
import { useResearchStore } from '../../../stores/useResearchStore';

type SavedAction = { type: 'toggle'; id: string };
function savedReducer(state: Record<string, true>, action: SavedAction): Record<string, true> {
  if (state[action.id]) {
    const { [action.id]: _, ...rest } = state;
    return rest;
  }
  return { ...state, [action.id]: true };
}

export function HrNextShell() {
  const { 
    items, isLoading, error, 
    sortKey, setSortKey,
    groupBy, setGroupBy,
    searchQuery, setSearchQuery,
    mode, setMode
  } = useHrNextData();
  const [savedMap, dispatchSaved] = useReducer(savedReducer, {});
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [is3DLayerEnabled, setIs3DLayerEnabled] = useState(true);

  const selectedPlayer = useResearchStore((s) => s.selectedPlayer);
  const isDrawerOpen = useResearchStore((s) => s.isDrawerOpen);
  const closeDrawer = useResearchStore((s) => s.closeDrawer);

  const toggleSaved = useCallback((id: string) => {
    dispatchSaved({ type: 'toggle', id });
  }, []);

  const handleAddToSlip = useCallback((row: any) => {
    openParlayAdd({
      player: toHrParlayPickerPlayer(row),
      source: 'hr_intelligence',
      dataStatus: row.truthStatus === 'official' ? 'official' : row.truthStatus === 'projected' ? 'projected' : 'unknown',
      reasoningSnapshot: row.reasons[0]?.trim() || 'No model rationale was supplied for this signal.',
      riskSnapshot: row.warnings[0]?.trim() || 'No specific risk note was supplied. Verify the lineup and market before adding.',
    });
  }, []);

  const handleExport = useCallback(() => {
    const savedKeys = Object.keys(savedMap);
    const targetItems = savedKeys.length > 0 
      ? items.filter(item => item.type === 'row' && savedMap[item.row.stableId])
      : items.filter(item => item.type === 'row');

    const payload = targetItems.map((item: any) => {
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
        signal: data.catalyst,
        read: row.reasons[0]?.trim(),
        evidence: data.pips.map((p) => ({ label: p.label, tone: p.tone })),
        receipt: data.receipt,
      };
    });

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hr-next-receipts.json`;
    link.click();
    URL.revokeObjectURL(url);

    setExportStatus(`${targetItems.length} receipt${targetItems.length === 1 ? '' : 's'} prepared`);
    window.setTimeout(() => setExportStatus(null), 2200);
  }, [savedMap, items]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-vouch-cyan font-mono animate-pulse">Loading HR Intelligence...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-red-500 font-mono text-center">
          <p>Failed to load HR board</p>
          <p className="text-sm opacity-70">{String(error)}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 min-w-0 min-h-screen relative z-10 overscroll-none">
      <header className="sticky top-0 z-30 px-8 py-4 bg-[#080d0d]/95 backdrop-blur-sm border-b border-white/5">
        <h1 className="text-xl font-bold text-white mb-2">HRNext — Admin Preview</h1>
        
        {/* Search Bar */}
        <div className="relative mb-4 max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input 
            type="text" 
            placeholder="Search player, team, or matchup..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-vouch-cyan focus:ring-1 focus:ring-vouch-cyan transition-all"
          />
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <HrNextSortMenu sortKey={sortKey} onSortChange={setSortKey} />
          
          <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
            <button 
              onClick={() => setGroupBy('tier')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors ${groupBy === 'tier' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/80'}`}
            >
              By Tier
            </button>
            <button 
              onClick={() => setGroupBy('matchup')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors ${groupBy === 'matchup' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/80'}`}
            >
              By Game
            </button>
            <button 
              onClick={() => setGroupBy('none')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors ${groupBy === 'none' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/80'}`}
            >
              Flat Sort
            </button>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
            <button 
              onClick={() => setMode('all')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors ${mode === 'all' ? 'bg-vouch-cyan/20 text-vouch-cyan' : 'text-white/40 hover:text-white/80'}`}
            >
              All
            </button>
            <button 
              onClick={() => setMode('curated')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors ${mode === 'curated' ? 'bg-vouch-cyan/20 text-vouch-cyan' : 'text-white/40 hover:text-white/80'}`}
            >
              Projected
            </button>
            <button 
              onClick={() => setMode('confirmed')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors ${mode === 'confirmed' ? 'bg-vouch-cyan/20 text-vouch-cyan' : 'text-white/40 hover:text-white/80'}`}
            >
              Confirmed
            </button>
          </div>

          <span className="text-xs font-mono text-white/50 ml-auto">
            {Object.keys(savedMap).length} Saved
          </span>
          <button 
            onClick={handleExport}
            className="rounded bg-vouch-cyan/20 px-3 py-1 text-xs font-mono text-vouch-cyan hover:bg-vouch-cyan/30 transition-colors"
          >
            {exportStatus || 'Export JSON'}
          </button>
          
          <button 
            onClick={() => setIs3DLayerEnabled(prev => !prev)}
            className={`rounded px-3 py-1 text-xs font-mono transition-colors ${
              is3DLayerEnabled 
                ? 'bg-[var(--aurora-max-emerald)]/20 text-[var(--aurora-max-emerald)] hover:bg-[var(--aurora-max-emerald)]/30' 
                : 'bg-white/10 text-white/50 hover:bg-white/20'
            }`}
          >
            3D Layer: {is3DLayerEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </header>
      
      {/* Responsive Content: Dual-mode layout (Side Dock on >=2xl, Top Bar on <2xl) */}
      <div className="w-full max-w-[1600px] px-8 py-6 flex flex-col 2xl:flex-row gap-8 items-start">
        {/* Main Board Column */}
        <div className="flex-1 min-w-0 w-full max-w-5xl space-y-3">
          {/* Top Bar on compact/narrow screens when player is selected */}
          {isDrawerOpen && selectedPlayer && (
            <div className="w-full 2xl:hidden animate-in fade-in slide-in-from-top-4 duration-200">
              <HrNextResearchView 
                playerId={selectedPlayer.id}
                playerName={selectedPlayer.name}
                mode="topbar"
                onClose={closeDrawer}
              />
            </div>
          )}

          <HrNextBoard 
            items={items} 
            savedMap={savedMap} 
            onToggleSaved={toggleSaved} 
            onAddToSlip={handleAddToSlip} 
            is3DLayerEnabled={is3DLayerEnabled} 
            groupBy={groupBy}
          />
        </div>

        {/* Side Dock on wide screens (>= 1536px / 2xl) */}
        <aside className="hidden 2xl:block w-[420px] sticky top-28 shrink-0">
          {isDrawerOpen && selectedPlayer ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-200">
              <HrNextResearchView 
                playerId={selectedPlayer.id}
                playerName={selectedPlayer.name}
                mode="dock"
                onClose={closeDrawer}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-white/5 bg-[#060a0a]/50 p-6 text-center font-mono text-xs text-white/40 flex flex-col items-center justify-center min-h-[300px] border-dashed">
              <Sparkles className="w-6 h-6 text-white/20 mb-2" />
              <p className="font-bold text-white/60 mb-1">Deep Research Telemetry</p>
              <p className="text-[11px] max-w-[240px]">
                Click the search icon on any player card to inspect live pitch arsenals, park factors, and odds matrix.
              </p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
