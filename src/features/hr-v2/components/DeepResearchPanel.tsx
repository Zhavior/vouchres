import React, { useState } from 'react';
import { Zap, Wind, Users, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { ChunkA, ChunkC } from '../api/contracts';
import { ParkSprayChart } from './ParkSprayChart';

export interface DeepResearchPanelProps {
  data: ChunkA;
  chunkC: ChunkC | null;
  isLoading: boolean;
}

type TabType = 'matchup' | 'park' | 'bullpen' | 'odds';

export function DeepResearchPanel({
  data,
  chunkC,
  isLoading
}: DeepResearchPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('matchup');

  const boardOdds = data.odds;

  return (
    <div className="flex flex-col w-full h-full">
      {/* Top Tab Switcher */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 mb-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('matchup')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'matchup'
              ? 'bg-vouch-cyan/20 text-vouch-cyan border border-vouch-cyan/40 shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" /> Matchup
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('park')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'park'
              ? 'bg-vouch-cyan/20 text-vouch-cyan border border-vouch-cyan/40 shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Wind className="w-3.5 h-3.5" /> Park & Env
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bullpen')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'bullpen'
              ? 'bg-vouch-cyan/20 text-vouch-cyan border border-vouch-cyan/40 shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Bullpen & Umps
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('odds')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'odds'
              ? 'bg-vouch-cyan/20 text-vouch-cyan border border-vouch-cyan/40 shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Odds Matrix
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-32 w-full bg-white/5 rounded-xl" />
          <div className="h-36 w-full bg-white/5 rounded-xl" />
          <div className="h-28 w-full bg-white/5 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: MATCHUP */}
          {activeTab === 'matchup' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Pitch-Type Matchup Breakdown */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-vouch-cyan mb-3 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" /> Pitch-Type Matchup Breakdown
                </h3>
                <div className="space-y-2.5">
                  <p className="text-xs text-white/60 p-2.5 rounded bg-white/5">
                    Pitch-type xSLG is UNKNOWN — not on the HR board payload.
                  </p>
                </div>
              </div>

              {/* Pitcher Fatigue & Platoon Degradation */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-vouch-cyan mb-3 flex items-center gap-2">
                  <TrendingDown className="w-3.5 h-3.5" /> Pitcher Fatigue & Order Degradation
                </h3>
                <div className="space-y-2 text-xs">
                  <p className="p-2 rounded bg-white/5 text-white/60">
                    Times-through-order wOBA is UNKNOWN — not on the HR board payload.
                  </p>
                </div>
              </div>

              {/* Raw Batted Ball Telemetry */}
              {chunkC && chunkC.battedBallEvents.length > 0 && (
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-vouch-cyan mb-2">
                    Statcast Peak Power Profile
                  </h3>
                  <p className="font-mono text-vouch-emerald text-sm">
                    Max Exit Velo: {chunkC.battedBallEvents[0].exitVelocity} mph @ {chunkC.battedBallEvents[0].launchAngle}° ({chunkC.battedBallEvents[0].distance} ft)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PARK & ENVIRONMENT */}
          {activeTab === 'park' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Stadium Field Graphic */}
              <ParkSprayChart
                stadiumName={
                  data.gameState?.stadiumId && data.gameState?.stadiumId !== 'unknown'
                    ? data.gameState.stadiumId
                    : undefined
                }
              />

              {/* Environment Grid */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-vouch-cyan mb-3 flex items-center gap-2">
                  <Wind className="w-3.5 h-3.5" /> Microclimate & Air Density
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <p className="col-span-2 p-2.5 rounded bg-white/5 text-white/60">
                    Air density, elevation, and pull factors are UNKNOWN — not on the HR board payload.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BULLPEN & UMPS */}
          {activeTab === 'bullpen' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Opposing Bullpen Status */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-vouch-cyan mb-3 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> {data.opponentTeamId} Bullpen Availability & Fatigue
                </h3>
                <div className="space-y-2.5 text-xs">
                  <p className="p-2.5 rounded bg-white/5 text-white/60">
                    Bullpen HR/9 and pitch counts are UNKNOWN — not on the HR board payload.
                  </p>
                </div>
              </div>

              {/* Umpire Tendency */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-vouch-cyan mb-3 flex items-center gap-2">
                  <Target className="w-3.5 h-3.5" /> Home Plate Umpire Tendency
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <p className="col-span-2 p-2.5 rounded bg-white/5 text-white/60">
                    Umpire identity and zone rates are UNKNOWN — not on the HR board payload.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ODDS COMPARISON MATRIX */}
          {activeTab === 'odds' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-vouch-cyan mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" /> Live Line Shopping Matrix</span>
                  <span className="text-[10px] text-white/40 font-mono font-bold">BOARD LINE</span>
                </h3>
                
                <div className="space-y-2 text-xs">
                  {boardOdds ? (
                    <div className="flex items-center justify-between p-3 rounded-xl border bg-white/5 border-white/5">
                      <span className="font-bold text-white">{boardOdds.provider}</span>
                      <span className="font-mono font-bold text-sm text-white">
                        {boardOdds.price > 0 ? `+${boardOdds.price}` : `${boardOdds.price}`}
                      </span>
                    </div>
                  ) : (
                    <p className="p-3 rounded-xl bg-white/5 text-white/60">
                      Book odds are UNKNOWN — not on this board row.
                    </p>
                  )}
                </div>

                <p className="text-[10px] text-white/40 mt-3 text-right">
                  Single board line only — no invented sportsbook matrix.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
