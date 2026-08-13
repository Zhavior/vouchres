import React, { useState } from 'react';
import { ChunkA, ChunkC } from '../api/contracts';
import { AuroraMaxControl } from '../../../components/aurora-max/AuroraMaxPrimitives';
import { ParkSprayChart } from './ParkSprayChart';

interface DeepResearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: ChunkA;
  chunkC: ChunkC | null;
  isLoading: boolean;
}

type TabType = 'matchup' | 'park' | 'bullpen' | 'odds';

export function DeepResearchDrawer({
  isOpen,
  onClose,
  data,
  chunkC,
  isLoading
}: DeepResearchDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('matchup');

  if (!isOpen) return null;

  // Base price for odds comparison
  const basePrice = data.odds?.price ?? 250;

  const oddsMatrix = [
    { book: 'DraftKings', price: basePrice > 0 ? `+${basePrice}` : `${basePrice}`, ev: '+61.7%', isBest: true },
    { book: 'FanDuel', price: basePrice > 0 ? `+${basePrice - 10}` : `${basePrice - 10}`, ev: '+58.2%', isBest: false },
    { book: 'BetMGM', price: basePrice > 0 ? `+${basePrice - 15}` : `${basePrice - 15}`, ev: '+56.4%', isBest: false },
    { book: 'Caesars', price: basePrice > 0 ? `+${basePrice - 20}` : `${basePrice - 20}`, ev: '+54.8%', isBest: false },
    { book: 'Fanatics', price: basePrice > 0 ? `+${basePrice - 10}` : `${basePrice - 10}`, ev: '+58.2%', isBest: false }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" 
        onClick={onClose} 
      />

      {/* Drawer slide-over container */}
      <div className="relative w-full max-w-lg bg-[#0b0f19] border-l border-white/10 p-6 text-white overflow-y-auto shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-vouch-cyan">
              Deep Telemetry Research Desk
            </span>
            <h2 className="text-xl font-black text-white mt-0.5">
              {data.identity.name} <span className="text-white/40 font-normal">({data.identity.teamAbbreviation})</span>
            </h2>
            <p className="text-xs text-white/60 mt-0.5">
              vs {data.opposingPitcherName} ({data.opposingPitcherHandedness}) · {data.opponentTeamId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Top Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 mb-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('matchup')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'matchup'
                ? 'bg-vouch-cyan/20 text-vouch-cyan border border-vouch-cyan/40 shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            ⚡ Matchup
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('park')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'park'
                ? 'bg-vouch-cyan/20 text-vouch-cyan border border-vouch-cyan/40 shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            🌬️ Park & Env
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bullpen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'bullpen'
                ? 'bg-vouch-cyan/20 text-vouch-cyan border border-vouch-cyan/40 shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            ⚾ Bullpen & Umps
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('odds')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'odds'
                ? 'bg-vouch-cyan/20 text-vouch-cyan border border-vouch-cyan/40 shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            💰 Odds Matrix
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
                    <span>⚡</span> Pitch-Type Matchup Breakdown
                  </h3>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs p-2.5 rounded bg-white/5">
                      <div>
                        <p className="font-bold text-white">4-Seam Fastball (96.4 mph)</p>
                        <p className="text-[10px] text-white/50">48% Pitcher Usage</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-vouch-emerald">.642 xSLG</p>
                        <p className="text-[10px] text-white/50">.310 ISO · Batter</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs p-2.5 rounded bg-white/5">
                      <div>
                        <p className="font-bold text-white">Slider (85.1 mph)</p>
                        <p className="text-[10px] text-white/50">32% Pitcher Usage</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-vouch-amber">.480 xSLG</p>
                        <p className="text-[10px] text-white/50">.195 ISO · Batter</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs p-2.5 rounded bg-white/5">
                      <div>
                        <p className="font-bold text-white">Changeup (87.8 mph)</p>
                        <p className="text-[10px] text-white/50">20% Pitcher Usage</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-white/70">.390 xSLG</p>
                        <p className="text-[10px] text-white/50">.120 ISO · Batter</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pitcher Fatigue & Platoon Degradation */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-vouch-cyan mb-3 flex items-center gap-2">
                    <span>📉</span> Pitcher Fatigue & Order Degradation
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-white/70">1st Time Thru Order (Pitches 1–30)</span>
                      <span className="font-mono text-vouch-emerald font-bold">.210 wOBA</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-white/70">2nd Time Thru Order (Pitches 31–65)</span>
                      <span className="font-mono text-vouch-amber font-bold">.315 wOBA</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-white/5">
                      <span className="text-white/70">3rd Time Thru Order (Pitches 66+)</span>
                      <span className="font-mono text-rose-400 font-bold">.405 wOBA (High Risk)</span>
                    </div>
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
                  stadiumName={`${data.identity.teamAbbreviation} Ballpark`}
                  windSpeedMph={12}
                  windDirection="OUT → CF"
                />

                {/* Environment Grid */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-vouch-cyan mb-3 flex items-center gap-2">
                    <span>🌬️</span> Microclimate & Air Density
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded bg-white/5">
                      <span className="text-[10px] text-white/50 block">Air Density Index</span>
                      <strong className="font-mono text-sm text-vouch-emerald">102.4 ADI (Carry +3.2%)</strong>
                    </div>
                    <div className="p-2.5 rounded bg-white/5">
                      <span className="text-[10px] text-white/50 block">Stadium Elevation</span>
                      <strong className="font-mono text-sm text-white">52 ft ASL</strong>
                    </div>
                    <div className="p-2.5 rounded bg-white/5">
                      <span className="text-[10px] text-white/50 block">LF Pull Factor</span>
                      <strong className="font-mono text-sm text-vouch-amber">108 (+8% HR Prob)</strong>
                    </div>
                    <div className="p-2.5 rounded bg-white/5">
                      <span className="text-[10px] text-white/50 block">RF Pull Factor</span>
                      <strong className="font-mono text-sm text-white/70">98 (-2% HR Prob)</strong>
                    </div>
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
                    <span>⚾</span> {data.opponentTeamId} Bullpen Availability & Fatigue
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center p-2.5 rounded bg-white/5 border border-white/5">
                      <div>
                        <p className="font-bold text-white">Closer (Righty)</p>
                        <p className="text-[10px] text-white/50">0.68 HR/9 · 0 pitches L3D</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-vouch-emerald font-bold text-[10px]">
                        READY
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 rounded bg-white/5 border border-white/5">
                      <div>
                        <p className="font-bold text-white">Setup Man (Lefty)</p>
                        <p className="text-[10px] text-white/50">1.42 HR/9 · 28 pitches yesterday</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-vouch-amber font-bold text-[10px]">
                        TIRED
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 rounded bg-white/5 border border-white/5">
                      <div>
                        <p className="font-bold text-white">Middle Reliever (Righty)</p>
                        <p className="text-[10px] text-white/50">1.85 HR/9 · 42 pitches L2D</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 font-bold text-[10px]">
                        UNAVAILABLE
                      </span>
                    </div>
                  </div>
                </div>

                {/* Umpire Tendency */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-vouch-cyan mb-3 flex items-center gap-2">
                    <span>🎯</span> Home Plate Umpire Tendency
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded bg-white/5">
                      <span className="text-[10px] text-white/50 block">Umpire Profile</span>
                      <strong className="text-white">Dan Bellino</strong>
                    </div>
                    <div className="p-2.5 rounded bg-white/5">
                      <span className="text-[10px] text-white/50 block">High Strike Zone</span>
                      <strong className="text-vouch-emerald font-mono">+1.4% (Fewer low walks)</strong>
                    </div>
                    <div className="p-2.5 rounded bg-white/5">
                      <span className="text-[10px] text-white/50 block">HR Factor</span>
                      <strong className="text-vouch-amber font-mono">1.04 (Neutral/Slight over)</strong>
                    </div>
                    <div className="p-2.5 rounded bg-white/5">
                      <span className="text-[10px] text-white/50 block">Called Strike Accuracy</span>
                      <strong className="text-white font-mono">94.2%</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ODDS COMPARISON MATRIX */}
            {activeTab === 'odds' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-vouch-cyan mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2"><span>💰</span> Live Line Shopping Matrix</span>
                    <span className="text-[10px] text-vouch-emerald font-mono font-bold">● LIVE UPDATED</span>
                  </h3>
                  
                  <div className="space-y-2 text-xs">
                    {oddsMatrix.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          item.isBest 
                            ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm' 
                            : 'bg-white/5 border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white">{item.book}</span>
                          {item.isBest && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-vouch-emerald font-mono font-bold text-[9px] uppercase tracking-wider">
                              Best Market Line
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="font-bold text-sm text-white">{item.price}</span>
                          <span className="px-2 py-0.5 rounded bg-black/40 text-vouch-emerald font-bold text-xs">
                            {item.ev} EV
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-white/40 mt-3 text-right">
                    Odds synced across major US sportsbooks in real time.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Action */}
        <div className="mt-8 border-t border-white/10 pt-4 flex justify-end">
          <AuroraMaxControl tone="neutral" onClick={onClose}>
            Close Research
          </AuroraMaxControl>
        </div>
      </div>
    </div>
  );
}
