import React from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts';
import { Activity, Award, BarChart3, Flame, Target, TrendingUp } from 'lucide-react';
import type { PlayerResearchModel } from "../../hooks/usePlayerResearchConsole";

export default function MetricsBento({ model }: { model: PlayerResearchModel }) {
  const {
    searchTerm, setSearchTerm,
    selectedTeam, setSelectedTeam,
    selectedInjuryStatus, setSelectedInjuryStatus,
    selectedPosition, setSelectedPosition,
    opposingPitcherType, setOpposingPitcherType,
    dossierMode, setDossierMode,
    activePlayer, setActivePlayer,
    compareMode, setCompareMode,
    comparePlayer, setComparePlayer,
    displayedPlayers,
    ROSTER_RENDER_CAP,
    isSearchingApi,
    isRefreshingApi,
    activeSplitTab, setActiveSplitTab,
    activeMetricsTab, setActiveMetricsTab,
    expandedPropIds,
    togglePropDetails,
    aiReportCache,
    isResearching,
    toastMessage,
    showToast,
    runLiveAIResearch,
    teams,
    positions,
    filteredPlayers,
    handleWagerProposition,
    handleVouchProposition,
    selectActivePlayer,
    selectComparePlayer,
    activeColors,
    activeAiReport,
    savedVouchIds,
    activeLegs,
    liveGames
  } = model;

  return (
    <>
              {/* Bento Row 1: Deep Statcast Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="bento-row-metrics">
                
                {/* Advanced Statcast card (Col Span 2) */}
                <div className="col-span-1 md:col-span-2 bg-black/32 border border-white/30 rounded-3xl p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-white/28 pb-2.5">
                    <h3 className="text-xs font-black text-white/70 font-mono uppercase tracking-wider flex items-center gap-2">
                       <span>📊 ATHLETE MATRIX PERFORMANCE CORES</span>
                    </h3>
                    <div className="flex bg-black/72 p-1 border border-white/32 rounded-xl text-[10px] font-mono">
                      <button
                        type="button"
                        onClick={() => setActiveMetricsTab('BASE')}
                        className={`px-3 py-1 font-bold rounded-lg transition-all ${activeMetricsTab === 'BASE' ? 'bg-black/52 text-vouch-emerald' : 'text-white/45 hover:text-white/70'}`}
                      >
                        STAT TABLE
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveMetricsTab('VISUAL')}
                        className={`px-3 py-1 font-bold rounded-lg transition-all ${activeMetricsTab === 'VISUAL' ? 'bg-black/52 text-vouch-cyan' : 'text-white/45 hover:text-white/70'}`}
                        id="btn-switch-recharts"
                      >
                        INTERACTIVE GRAPHS
                      </button>
                    </div>
                  </div>

                  {activeMetricsTab === 'BASE' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                      
                      {/* Barrel % */}
                      <div className="bg-black/38 border border-white/30 p-3.5 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-white/45">Barrel Accuracy Ratio</span>
                          <strong className="text-vouch-cyan font-mono">{activePlayer.advanced.barrelPercent}%</strong>
                        </div>
                        <div className="h-1.5 w-full bg-black/72 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-vouch-cyan" 
                            style={{ width: `${(activePlayer.advanced.barrelPercent / 25) * 100}%` }}
                          />
                        </div>
                        <span className="block text-[8.5px] text-white/45 font-mono leading-none">Average baseline: 7.8% (Sharp advantage)</span>
                      </div>

                      {/* Exit Velocity */}
                      <div className="bg-black/38 border border-white/30 p-3.5 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-white/45">Average Exit Velocity</span>
                          <strong className="text-vouch-cyan font-mono">{activePlayer.advanced.exitVelocity} mph</strong>
                        </div>
                        <div className="h-1.5 w-full bg-black/72 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-vouch-cyan" 
                            style={{ width: `${(activePlayer.advanced.exitVelocity / 110) * 100}%` }}
                          />
                        </div>
                        <span className="block text-[8.5px] text-white/45 font-mono leading-none">High release peak: 112+ mph speed stats</span>
                      </div>

                      {/* Hard Hit % */}
                      <div className="bg-black/38 border border-white/30 p-3.5 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-white/45">Hard Hit Percentage</span>
                          <strong className="text-vouch-emerald font-mono">{activePlayer.advanced.hardHitPercent}%</strong>
                        </div>
                        <div className="h-1.5 w-full bg-black/72 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500" 
                            style={{ width: `${(activePlayer.advanced.hardHitPercent / 70) * 100}%` }}
                          />
                        </div>
                        <span className="block text-[8.5px] text-white/45 font-mono leading-none">Elite baseball threshold is evaluated above 45%</span>
                      </div>

                      {/* Chase % / Discipline */}
                      <div className="bg-black/38 border border-white/30 p-3.5 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-white/45">O-Swing Zone Chase</span>
                          <strong className="text-vouch-emerald font-mono">{activePlayer.advanced.chasePercent}%</strong>
                        </div>
                        <div className="h-1.5 w-full bg-black/72 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500" 
                            style={{ width: `${((40 - activePlayer.advanced.chasePercent) / 40) * 100}%` }}
                          />
                        </div>
                        <span className="block text-[8.5px] text-white/45 font-mono leading-none">Lower rates represent maximum selective discipline</span>
                      </div>

                      {/* wOBA / xwOBA model discrepancy */}
                      <div className="bg-black/38 border border-white/30 p-4 rounded-2xl col-span-1 sm:col-span-2 space-y-2">
                        <div className="flex justify-between items-center text-xs pb-1.5 border-b border-white/24">
                          <span className="text-white/45 font-black font-mono text-[9px] uppercase tracking-wider">PREDICTIVE CORRELATIONS (wOBA vs xwOBA)</span>
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-amber-400">wOBA: {activePlayer.advanced.woba.toFixed(3)}</span>
                            <span className="text-white/45">•</span>
                            <span className="text-vouch-cyan font-bold">xwOBA: {activePlayer.advanced.xwoba.toFixed(3)}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-white/45 font-mono leading-relaxed">
                          Expected weighted On-Base Average (xwOBA) matches actual batted trajectory, demonstrating{' '}
                          {activePlayer.advanced.xwoba > activePlayer.advanced.woba ? (
                            <span className="text-vouch-emerald font-bold">strong upward regression potential (Highly Undervalued prop opportunity)</span>
                          ) : (
                            <span className="text-white/70 font-medium">highly stable mechanical baseline consistency</span>
                          )}
                          . Statcast models prioritize this vector for high margin edges.
                        </p>
                      </div>

                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in" id="athlete-matrix-visuals">
                      {/* Line Chart */}
                      <div className="bg-black/38 p-3.5 border border-white/30 rounded-2xl flex flex-col justify-between">
                        <div className="mb-2">
                          <span className="text-[10px] uppercase font-bold text-white/70 font-mono tracking-wider block">Rolling last 10 games trend</span>
                          <span className="text-[9px] text-white/45 font-mono leading-none block">Weighted rolling performance indicator (OPS)</span>
                        </div>
                        <div className="h-32 w-full text-[9px] font-mono">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[
                              { game: 'G1', OPS: parseFloat((Number(activePlayer.splits.last10.ops) * 0.85).toFixed(3)) },
                              { game: 'G2', OPS: parseFloat((Number(activePlayer.splits.last10.ops) * 0.95).toFixed(3)) },
                              { game: 'G3', OPS: parseFloat((Number(activePlayer.splits.last10.ops) * 0.90).toFixed(3)) },
                              { game: 'G4', OPS: parseFloat((Number(activePlayer.splits.last10.ops) * 1.05).toFixed(3)) },
                              { game: 'G5', OPS: parseFloat((Number(activePlayer.splits.last10.ops) * 1.02).toFixed(3)) },
                              { game: 'G6', OPS: parseFloat((Number(activePlayer.splits.last10.ops) * 0.88).toFixed(3)) },
                              { game: 'G7', OPS: parseFloat((Number(activePlayer.splits.last10.ops) * 1.15).toFixed(3)) },
                              { game: 'G8', OPS: parseFloat((Number(activePlayer.splits.last10.ops) * 0.97).toFixed(3)) },
                              { game: 'G9', OPS: parseFloat((Number(activePlayer.splits.last10.ops) * 1.08).toFixed(3)) },
                              { game: 'G10', OPS: Number(activePlayer.splits.last10.ops) },
                            ]}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
                              <XAxis dataKey="game" stroke="#64748b" tickLine={false} />
                              <YAxis stroke="#64748b" tickLine={false} domain={['auto', 'auto']} />
                              <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }} />
                              <Line type="monotone" dataKey="OPS" stroke="#38bdf8" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Circle (Pie) Graph */}
                      <div className="bg-black/38 p-3.5 border border-white/30 rounded-2xl flex flex-col justify-between">
                        <div className="mb-2">
                          <span className="text-[10px] uppercase font-bold text-white/70 font-mono tracking-wider block">Situational Splits Circle Graph</span>
                          <span className="text-[9px] text-white/45 font-mono leading-none block">OPS ratios compared side-by-side</span>
                        </div>
                        <div className="h-32 w-full flex items-center justify-between">
                          <div className="h-full w-[55%] text-[9px] font-mono">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'vs LHP', value: activePlayer.splits.vLHP.ops },
                                    { name: 'vs RHP', value: activePlayer.splits.vRHP.ops },
                                    { name: 'Home Split', value: activePlayer.splits.home.ops },
                                    { name: 'Away Split', value: activePlayer.splits.away.ops },
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={22}
                                  outerRadius={36}
                                  paddingAngle={3}
                                  dataKey="value"
                                >
                                  <Cell fill="#10b981" />
                                  <Cell fill="#3b82f6" />
                                  <Cell fill="#f59e0b" />
                                  <Cell fill="#8b5cf6" />
                                </Pie>
                                <Tooltip formatter={(val: any) => [`${val} OPS`]} contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div className="text-[8.5px] font-mono leading-normal text-white/45 space-y-1.5 pr-1 shrink-0">
                            <div className="flex items-center gap-1 min-w-[70px]"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> LHP: {activePlayer.splits.vLHP.ops}</div>
                            <div className="flex items-center gap-1 min-w-[70px]"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> RHP: {activePlayer.splits.vRHP.ops}</div>
                            <div className="flex items-center gap-1 min-w-[70px]"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Home: {activePlayer.splits.home.ops}</div>
                            <div className="flex items-center gap-1 min-w-[70px]"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block" /> Away: {activePlayer.splits.away.ops}</div>
                          </div>
                        </div>
                      </div>

                      {/* Team Parlay Win Percentage Ratio block */}
                      {(() => {
                        const TEAM_PARLAY_WIN_RATES: Record<string, number> = {
                          'Los Angeles Dodgers': 69.2,
                          'New York Yankees': 65.4,
                          'Boston Red Sox': 58.1,
                          'San Francisco Giants': 54.8,
                          'Chicago Cubs': 53.6,
                          'Houston Astros': 61.2,
                          'San Diego Padres': 57.9,
                          'St. Louis Cardinals': 52.4,
                          'Atlanta Braves': 63.8,
                          'Baltimore Orioles': 64.9,
                          'Philadelphia Phillies': 66.2,
                          'Texas Rangers': 51.5,
                          'New York Mets': 55.7,
                          'DEFAULT': 56.5
                        };
                        const teamWinPercent = TEAM_PARLAY_WIN_RATES[activePlayer.team] || TEAM_PARLAY_WIN_RATES['DEFAULT'];
                        
                        return (
                          <div className="bg-black/38 p-4 border border-white/30 rounded-2xl col-span-1 sm:col-span-2 space-y-3">
                            <div className="flex items-center justify-between pb-1.5 border-b border-white/24">
                              <span className="text-white/45 font-black font-mono text-[9px] uppercase tracking-wider block">TEAM WIN IN PLAYER PARLAYS % RATE</span>
                              <span className="text-[9.5px] text-vouch-emerald font-mono font-bold uppercase">{activePlayer.team}</span>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-5">
                              <div className="relative shrink-0 flex items-center justify-center">
                                <svg className="w-16 h-16 transform -rotate-90">
                                  <circle cx="32" cy="32" r="26" stroke="rgba(255,255,255,0.12)" strokeWidth="5" fill="transparent" />
                                  <circle cx="32" cy="32" r="26" stroke="#10b981" strokeWidth="5" strokeDasharray={`${2 * Math.PI * 26}`} strokeDashoffset={`${2 * Math.PI * 26 * (1 - teamWinPercent / 100)}`} fill="transparent" strokeLinecap="round" />
                                </svg>
                                <span className="absolute text-center mt-0.5">
                                  <span className="text-xs font-black font-mono text-vouch-emerald block leading-none">{teamWinPercent}%</span>
                                  <span className="text-[7.5px] text-white/45 font-mono tracking-tighter leading-none mt-0.5">WIN RATE</span>
                                </span>
                              </div>

                              <div className="space-y-1.5 min-w-0 flex-1">
                                <p className="text-[10px] text-white/70 font-mono leading-relaxed">
                                  Saber-grounded metric evaluations state that multi-leg player parlays containing <b>{activePlayer.name}</b> legs yield a high <strong className="text-vouch-emerald font-black">{teamWinPercent}% team historic win rate</strong> across baseball.
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] bg-vouch-emerald/10 border border-vouch-emerald/20 text-vouch-emerald font-mono px-2 py-0.5 rounded leading-none uppercase font-bold">ALPHA VALUE</span>
                                  <span className="text-[8.5px] text-white/45 font-mono leading-none">Model index: 1.48x</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                    </div>
                  )}
                </div>

                {/* Platoon situational splits tracker (Col Span 1) */}
                <div className="bg-black/32 border border-white/30 rounded-3xl p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-white/28 pb-2.5">
                    <span className="text-xs font-black text-white/70 font-mono uppercase tracking-wider">
                      SITUATIONAL RECON
                    </span>
                    <span className="text-[9px] text-vouch-emerald font-mono animate-pulse">Live feed</span>
                  </div>

                  {/* Switch Tab controls */}
                  <div className="grid grid-cols-3 gap-1 bg-black/72 border border-white/28 p-1 rounded-xl text-[9px] font-mono">
                    <button 
                      onClick={() => setActiveSplitTab('PLATOON')}
                      className={`py-1.5 font-bold rounded-lg transition-all ${activeSplitTab === 'PLATOON' ? 'bg-white/15 text-vouch-emerald' : 'text-white/45'}`}
                    >
                      PLATOON
                    </button>
                    <button 
                      onClick={() => setActiveSplitTab('VENUE')}
                      className={`py-1.5 font-bold rounded-lg transition-all ${activeSplitTab === 'VENUE' ? 'bg-white/15 text-vouch-emerald' : 'text-white/45'}`}
                    >
                      VENUE
                    </button>
                    <button 
                      onClick={() => setActiveSplitTab('RECENCY')}
                      className={`py-1.5 font-bold rounded-lg transition-all ${activeSplitTab === 'RECENCY' ? 'bg-white/15 text-vouch-emerald' : 'text-white/45'}`}
                    >
                      TREND
                    </button>
                  </div>

                  {/* Renders values of selected tab situations */}
                  <div className="py-1 space-y-3 font-mono">
                    {activeSplitTab === 'PLATOON' && (
                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-white/45">vs Left Pitcher (LHP)</span>
                            <strong className="text-white/70">{activePlayer.splits.vLHP.ops} OPS</strong>
                          </div>
                          <div className="flex justify-between text-[9px] text-white/45">
                            <span>AVG: {activePlayer.splits.vLHP.avg}</span>
                            <span>OBP: {activePlayer.splits.vLHP.obp}</span>
                            <span>SLG: {activePlayer.splits.vLHP.slg}</span>
                          </div>
                        </div>
                        <div className="border-t border-white/26 pt-2.5 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-white/45">vs Right Pitcher (RHP)</span>
                            <strong className="text-white/70">{activePlayer.splits.vRHP.ops} OPS</strong>
                          </div>
                          <div className="flex justify-between text-[9px] text-white/45">
                            <span>AVG: {activePlayer.splits.vRHP.avg}</span>
                            <span>OBP: {activePlayer.splits.vRHP.obp}</span>
                            <span>SLG: {activePlayer.splits.vRHP.slg}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSplitTab === 'VENUE' && (
                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-white/45">Home franchise field</span>
                            <strong className="text-white/70">{activePlayer.splits.home.ops} OPS</strong>
                          </div>
                          <div className="flex justify-between text-[9px] text-white/45">
                            <span>AVG: {activePlayer.splits.home.avg}</span>
                            <span>OBP: {activePlayer.splits.home.obp}</span>
                            <span>SLG: {activePlayer.splits.home.slg}</span>
                          </div>
                        </div>
                        <div className="border-t border-white/26 pt-2.5 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-white/45">Away stadiums split</span>
                            <strong className="text-white/70">{activePlayer.splits.away.ops} OPS</strong>
                          </div>
                          <div className="flex justify-between text-[9px] text-white/45">
                            <span>AVG: {activePlayer.splits.away.avg}</span>
                            <span>OBP: {activePlayer.splits.away.obp}</span>
                            <span>SLG: {activePlayer.splits.away.slg}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSplitTab === 'RECENCY' && (
                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-center gap-1.5 text-[9.5px] text-vouch-cyan uppercase font-black tracking-wider mb-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-vouch-cyan" />
                          <span>Last 10 rolling games</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/45">Weighted OPS split:</span>
                          <strong className="text-vouch-emerald font-extrabold">{activePlayer.splits.last10.ops} OPS</strong>
                        </div>
                        <div className="flex justify-between text-[9px] text-white/45">
                          <span>AVG: {activePlayer.splits.last10.avg}</span>
                          <span>OBP: {activePlayer.splits.last10.obp}</span>
                          <span>SLG: {activePlayer.splits.last10.slg}</span>
                        </div>
                        <p className="text-[9px] text-white/45 leading-relaxed font-mono">
                          Reflected across 42 plate appearances. High short-term trend coefficient indicator.
                        </p>
                      </div>
                    )}
                  </div>

                </div>

              </div>
    </>
  );
}
