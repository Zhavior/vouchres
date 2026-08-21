import React from 'react';
import { Sparkles, Activity, ShieldCheck, Loader2, RotateCw } from 'lucide-react';
import { useNflTouchdownData } from '../hooks/useNflTouchdownData';
import { NflMatchupCard } from './NflMatchupCard';

export function NflTouchdownShell() {
  const { games, isLoading, error, refetch, isSyncing } = useNflTouchdownData();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-ve-silver-400 gap-4">
        <Activity className="w-12 h-12 text-ve-red" />
        <p className="text-lg">Failed to load NFL Intelligence</p>
        <button onClick={() => refetch()} className="px-4 py-2 bg-ve-obsidian border border-ve-obsidian-border rounded-lg hover:text-white transition-colors">
          Retry Network
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col relative">
      {/* Premium Header Rail */}
      <div className="flex-none bg-ve-obsidian/80 backdrop-blur-xl border-b border-ve-obsidian-border/50 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-ve-gold/10 text-ve-gold ring-1 ring-ve-gold/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              NFL Touchdown Intelligence
              <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-widest bg-ve-green/10 text-ve-green border border-ve-green/20">
                LIVE
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-ve-silver-400">
              {isSyncing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  SYNCING
                </span>
              ) : (
                <span className="flex items-center gap-2 text-ve-silver-500">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  SECURE
                </span>
              )}
            </div>
            <button 
              onClick={() => refetch()}
              className="p-2 rounded-md text-ve-silver-400 hover:text-white hover:bg-ve-obsidian-hover transition-colors"
            >
              <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Board */}
      <div className="flex-1 overflow-y-auto ve-scroll-pane scroll-smooth">
        <div className="max-w-[1600px] mx-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-[50vh]">
              <div className="flex flex-col items-center gap-4 text-ve-silver-400">
                <Loader2 className="w-8 h-8 animate-spin text-ve-gold" />
                <span className="font-mono text-sm tracking-widest animate-pulse">BOOTING INTELLIGENCE ENGINE...</span>
              </div>
            </div>
          ) : games.length === 0 ? (
            <div className="flex items-center justify-center h-[50vh]">
              <div className="text-center">
                <p className="text-ve-silver-400 font-medium">No NFL games scheduled for today.</p>
                <p className="text-ve-silver-500 text-sm mt-2">Check back during the season.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {games.map((game) => (
                <NflMatchupCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </div>
        
        {/* Safe area for scroll */}
        <div className="h-24 w-full" />
      </div>
    </div>
  );
}
