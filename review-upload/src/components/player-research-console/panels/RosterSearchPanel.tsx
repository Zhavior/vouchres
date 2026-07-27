import React from 'react';
import { Activity, BarChart3, Check, RefreshCw, Search, User } from 'lucide-react';
import { MLB_PLAYER_RECORDS } from '../../../data/playerData';
import { Z8_SECTION_HEADER, Z8_SURFACE } from '../../../theme/z8Tokens';
import type { PlayerResearchModel } from "../hooks/usePlayerResearchConsole";

export default function RosterSearchPanel({ model }: { model: PlayerResearchModel }) {
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
        {/* ================= LEFT COLUMN: Roster Search & Filters (Col Span 4) ================= */}
        <div className="col-span-1 lg:col-span-4 space-y-6" id="console-roster-sidebar">
          
          {/* Controls Panel */}
          <div className="bg-black/34 border border-white/30 p-5 rounded-3xl shadow-xl space-y-5 backdrop-blur-sm">
            <h2 className="text-xs font-black text-white/70 flex items-center justify-between border-b border-white/28 pb-3">
              <span className="flex items-center gap-2 tracking-wider uppercase font-mono"><Search className="w-4 h-4 text-vouch-emerald" /> Controller Index</span>
              <span className="text-[9px] text-white/45 font-mono">Live filters</span>
            </h2>

            {/* Input Search bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-white/45 absolute left-3.5 top-3.5" />
              <input 
                type="text" 
                placeholder="Search MLB player or position..." 
                className="w-full bg-black/72 border border-white/32 rounded-2xl py-3 pl-10 pr-10 text-xs text-white/70 placeholder:text-white/45 focus:outline-none focus:border-vouch-cyan/40 focus:ring-1 focus:ring-vouch-cyan/40 transition-all font-mono"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {isSearchingApi && (
                <RefreshCw className="w-3.5 h-3.5 text-vouch-emerald animate-spin absolute right-3.5 top-3.5" />
              )}
            </div>

            {isRefreshingApi && (
              <div className="bg-emerald-950/20 border border-vouch-emerald/50/10 text-[10px] text-vouch-emerald font-mono px-3 py-2.5 rounded-xl flex items-center gap-2 animate-pulse justify-center">
                <RefreshCw className="w-3 h-3 animate-spin text-vouch-emerald" />
                <span>SYNCING MLB.COM STATS API LIFE...</span>
              </div>
            )}

            {/* Dropdown Filters Grid */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-[9px] text-white/45 font-mono uppercase mb-1.5 tracking-wider">FILTER FRANCHISE TEAM</label>
                <div className="flex flex-wrap gap-1">
                  {['ALL', 'Dodgers', 'Yankees', 'Padres', 'Astros', 'Braves'].map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTeam(t === 'ALL' ? 'ALL' : MLB_PLAYER_RECORDS.find(p => p.team.includes(t))?.team || 'ALL')}
                      className={`text-[10px] font-mono px-2.5 py-1.5 rounded-lg border transition-all ${
                        selectedTeam.includes(t) || (t === 'ALL' && selectedTeam === 'ALL')
                          ? 'bg-vouch-emerald/10 border-vouch-emerald/50/30 text-vouch-emerald font-bold'
                          : 'bg-black/72 border-white/30 text-white/45 hover:text-white hover:border-white/50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <div>
                  <label className="block text-[9.5px] text-white/45 font-mono uppercase mb-1 tracking-wider">Position</label>
                  <select 
                    className="w-full bg-black/72 border border-white/32 rounded-xl p-2.5 text-xs text-white/70 outline-none focus:border-vouch-cyan/40"
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                  >
                    {positions.map(p => (
                      <option key={p} value={p}>{p === 'ALL' ? 'All Positions' : p.split('/')[0].trim()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9.5px] text-white/45 font-mono uppercase mb-1 tracking-wider">Health Alert</label>
                  <select 
                    className="w-full bg-black/72 border border-white/32 rounded-xl p-2.5 text-xs text-white/70 outline-none focus:border-vouch-cyan/40"
                    value={selectedInjuryStatus}
                    onChange={(e) => setSelectedInjuryStatus(e.target.value)}
                  >
                    <option value="ALL">All Healths</option>
                    <option value="CLEARED">Cleared Only</option>
                    <option value="RISK">Injured (Caution)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Interactive Compare Mode Toggle */}
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-black font-mono transition-all flex items-center justify-center gap-2 border ${
                compareMode 
                  ? 'bg-vouch-cyan/10 border-vouch-cyan/40 text-vouch-cyan shadow-lg shadow-vouch-cyan/5 animate-pulse'
                  : 'bg-black/72 hover:bg-black/50 border-white/32 text-white/70'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{compareMode ? 'CLOSE SYSTEM COMPARISON' : 'COMPARE TWO ATHLETES'}</span>
            </button>
          </div>

          {/* Roster Athletes Feed List */}
          <div className="bg-black/34 border border-white/30 rounded-3xl overflow-hidden shadow-xl">
            <div className="bg-black/42 px-5 py-4 border-b border-white/30 flex items-center justify-between">
              <span className="text-xs font-black text-white/70 font-mono tracking-wider">ATHLETE MATRIX ({filteredPlayers.length})</span>
              <span className="text-[10px] text-white/45 font-mono">BAT RATING</span>
            </div>

            <div className="divide-y divide-white/24 max-h-[520px] overflow-y-auto custom-scrollbar" id="roster-athlete-list">
              {filteredPlayers.length === 0 ? (
                <div className="p-10 text-center" id="no-matching-athletes">
                  <p className="text-white/45 text-xs font-mono">No matching athletes find list filters.</p>
                  <button 
                    onClick={() => { setSearchTerm(''); setSelectedTeam('ALL'); setSelectedPosition('ALL'); setSelectedInjuryStatus('ALL'); }}
                    className="text-xs text-vouch-emerald font-mono underline mt-2 inline-block hover:text-vouch-emerald"
                  >
                    Hard Reset Filters
                  </button>
                </div>
              ) : (
                filteredPlayers.slice(0, ROSTER_RENDER_CAP).map((player) => {
                  const isSelectedPrimary = activePlayer.id === player.id;
                  const isSelectedSecondary = compareMode && comparePlayer.id === player.id;
                  const scoreGrounded = aiReportCache[player.id]?.score || player.batterScore;
                  
                  return (
                    <div 
                      key={player.id}
                      onClick={() => {
                        if (compareMode) {
                          if (isSelectedPrimary) return; // can't compare to self
                          selectComparePlayer(player);
                        } else {
                          selectActivePlayer(player);
                        }
                      }}
                      className={`p-4 transition-all cursor-pointer flex items-center justify-between select-none ${
                        isSelectedPrimary
                          ? 'bg-emerald-950/20 border-l-4 border-vouch-emerald/50'
                          : isSelectedSecondary
                          ? 'bg-vouch-cyan/10 border-l-4 border-vouch-cyan'
                          : 'hover:bg-black/36 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Player headshot image from MLB static CDN */}
                        <div className="relative">
                          <img
                            src={player.headshot}
                            alt={player.name}
                            referrerPolicy="no-referrer"
                            loading="eager" decoding="async" fetchPriority="high"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/generic/headshot/67/current'; }}
                            className="w-11 h-11 rounded-2xl object-cover bg-black/72 border border-white/32 flex-shrink-0"
                          />
                          <span className="absolute -bottom-1 -right-1 text-[8.5px] font-black bg-black/74 text-white/70 border border-white/36 px-1 rounded-md font-mono">
                            #{player.number}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-white truncate leading-tight tracking-tight">{player.name}</h4>
                          <span className="text-[10px] text-white/45 font-mono block mt-0.5 truncate uppercase">
                            {player.team.replace('Los Angeles Dodgers', 'Dodgers').replace('New York Yankees', 'Yankees').replace('Houston Astros', 'Astros').replace('San Diego Padres', 'Padres').replace('Boston Red Sox', 'Red Sox').replace('Atlanta Braves', 'Braves')}
                          </span>
                          <span className="text-[9.5px] text-white/45 font-mono block">{player.position}</span>
                        </div>
                      </div>

                      {/* Batter score badge with dynamic warning status */}
                      <div className="flex items-center gap-2">
                        {player.injurySeverity !== 'NONE' && (
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" title="Injury alert" />
                        )}
                        <span className={`text-xs font-black font-mono px-2.5 py-1 rounded-lg min-w-[34px] text-center ${
                          scoreGrounded >= 90 
                            ? 'bg-vouch-emerald/10 text-vouch-emerald border border-vouch-emerald/50/25 shadow-sm shadow-emerald-500/5'
                            : scoreGrounded >= 70
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                            : 'bg-red-500/10 text-red-400 border border-red-500/25'
                        }`}>
                          {scoreGrounded}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              {filteredPlayers.length > ROSTER_RENDER_CAP && (
                <div className="p-4 text-center bg-black/30">
                  <p className="text-[11px] text-white/45 font-mono">
                    Showing {ROSTER_RENDER_CAP} of {filteredPlayers.length} players · search a name or pick a team to narrow
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
    </>
  );
}
