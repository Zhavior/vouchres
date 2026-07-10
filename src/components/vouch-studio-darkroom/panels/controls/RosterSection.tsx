import React from 'react';
import { Activity, Plus, X, Flame, Award, Info } from 'lucide-react';
import { MLB_PLAYER_RECORDS } from '../../../../data/playerData';
import type { CustomPlayerSelection, VouchStudioDarkroomProps } from '../../types';

export default function RosterSection(props: VouchStudioDarkroomProps) {
  const {
    profile,
    savedVouches,
    selectedPlayers,
    setSelectedPlayers,
    cardStyle,
    setCardStyle,
    activeCardLayout,
    setActiveCardLayout,
    potdIndex,
    setPotdIndex,
    customCardPhoto,
    setCustomCardPhoto,
    customCardPhotoLabel,
    setCustomCardPhotoLabel,
    showWinRate,
    setShowWinRate,
    customWinRate,
    setCustomWinRate,
    showDailyWinRate,
    setShowDailyWinRate,
    customDailyWinRate,
    setCustomDailyWinRate,
    showMonthlyWinRate,
    setShowMonthlyWinRate,
    customMonthlyWinRate,
    setCustomMonthlyWinRate,
    showMlbPicks,
    setShowMlbPicks,
    customMlbPicks,
    setCustomMlbPicks,
    showProBadge,
    setShowProBadge,
    customProTag,
    setCustomProTag,
    showUnitsProfit,
    setShowUnitsProfit,
    unitsProfitValue,
    setUnitsProfitValue,
    showBestParlay,
    setShowBestParlay,
    bestParlayDesc,
    setBestParlayDesc,
    showCoupon,
    setShowCoupon,
    couponCode,
    setCouponCode,
    couponText,
    setCouponText,
    reasonsText,
    setReasonsText,
    showCharts,
    setShowCharts,
    showLogo,
    setShowLogo,
    showReasons,
    setShowReasons,
    previewScale,
    setPreviewScale,
    activePreviewCardIndex,
    setActivePreviewCardIndex,
    showSecondCard,
    setShowSecondCard,
    postSideways,
    setPostSideways,
    isPublishingToFeed,
    handlePublishAsFeedPost,
    handleSimulateXPost,
    triggerToast,
    formattedToday,
    calculateOrbitPos,
    handleAddPlayerToCircle,
    handleRemovePlayerFromCircle,
    handleStatTypeChange,
    handleCustomValChange,
    studioSectionPreset,
    setStudioSectionPreset,
    studioSectionRoster,
    setStudioSectionRoster,
    studioSectionPromo,
    setStudioSectionPromo,
    studioSectionRationale,
    setStudioSectionRationale
  } = props;

  return (
<>
          {/* ACCORDION 2: ROSTER LINEUP & PLAYER TUNING */}
          <div className="border-b border-white/10">
            <button
              type="button"
              onClick={() => setStudioSectionRoster(!studioSectionRoster)}
              className="w-full px-4 py-3 min-h-11 bg-ve-graphite/45 flex items-center justify-between text-left border-b border-slate-950 hover:bg-ve-graphite/75 transition-colors"
            >
              <span className="text-[10px] font-mono font-black text-white/80 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                2. Roster & Player Tuning
              </span>
              <span className="text-white/40 font-mono text-[9px] font-black">{studioSectionRoster ? '[-]' : '[+]'}</span>
            </button>

            {studioSectionRoster && (
              <div className="p-4 space-y-4 bg-ve-obsidian/70 animate-fade-in text-left">
                {/* Star list */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[8.5px] uppercase font-mono font-bold text-white/45 block tracking-wider">
                      {activeCardLayout === 'potd' ? "Featured Spotlight Player:" : "Active Roster Stars:"}
                    </label>
                    {activeCardLayout !== 'potd' && (
                      <span className="text-[7.5px] font-mono font-extrabold text-white/45 bg-obsidian-900 px-2 py-0.5 rounded border border-white/10">
                        {selectedPlayers.length} / 5 Stars
                      </span>
                    )}
                  </div>

                  {activeCardLayout === 'potd' ? (
                    <div className="p-2 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between px-3 py-2 animate-fade-in">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={(selectedPlayers[potdIndex] || selectedPlayers[0])?.player.headshot}
                          alt={(selectedPlayers[potdIndex] || selectedPlayers[0])?.player.name}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          decoding="async"
                          className="w-7 h-7 rounded-full border border-white/10 object-cover bg-obsidian-900 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-black text-amber-300 block truncate">{(selectedPlayers[potdIndex] || selectedPlayers[0])?.player.name}</span>
                          <span className="text-[7.5px] font-mono text-white/40 uppercase block mt-0.5 leading-none">
                            {(selectedPlayers[potdIndex] || selectedPlayers[0])?.player.team.split(' ').pop()} · No. {(selectedPlayers[potdIndex] || selectedPlayers[0])?.player.number}
                          </span>
                        </div>
                      </div>
                      <span className="text-[7px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 tracking-wider flex-shrink-0">SPOTLIGHT</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1 py-1">
                      {selectedPlayers.map((ps, idx) => (
                        <div key={ps.player.id} className="bg-obsidian-900 border border-white/10 rounded-lg py-1 px-2.5 flex items-center gap-1.5 text-[10px] text-slate-205 font-mono font-bold">
                          <img src={ps.player.headshot} alt={ps.player.name} referrerPolicy="no-referrer" loading="lazy" decoding="async" className="w-4 h-4 rounded-full object-cover bg-black/25 shrink-0" />
                          <span className="truncate max-w-[100px]">{ps.player.name.split(' ').pop()}</span>
                          <button 
                            onClick={() => handleRemovePlayerFromCircle(ps.player.id)}
                            className="text-white/40 hover:text-rose-400 font-bold transition-all p-0.5"
                            title="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dropdown for Add/Swap */}
                  <div className="space-y-1">
                    <span className="text-[7.5px] text-white/40 uppercase block font-mono">
                      {activeCardLayout === 'potd' ? "Swap featured spotlight player:" : "Quick add from rosters:"}
                    </span>
                    <div className="max-h-[140px] overflow-y-auto bg-obsidian-900 rounded-xl border border-white/10 p-1 space-y-1 scrollbar-thin">
                      {MLB_PLAYER_RECORDS.map((player) => {
                        const isActive = activeCardLayout === 'potd'
                          ? (selectedPlayers[potdIndex] || selectedPlayers[0])?.player.id === player.id
                          : selectedPlayers.some(p => p.player.id === player.id);
                        return (
                          <div 
                            key={player.id} 
                            className={`flex items-center justify-between p-1.5 px-2 rounded-lg text-[9.5px] uppercase font-bold transition-all ${
                              isActive ? 'bg-black/30 text-white/40 cursor-not-allowed' : 'hover:bg-black/30 cursor-pointer text-slate-350 hover:text-white/90'
                            }`}
                            onClick={() => {
                              if (activeCardLayout === 'potd') {
                                const indexInSelected = selectedPlayers.findIndex(p => p.player.id === player.id);
                                if (indexInSelected !== -1) {
                                  setPotdIndex(indexInSelected);
                                } else {
                                  const newSelection = {
                                    player,
                                    statType: 'Homeruns' as const,
                                    customVal: `Over 0.5 HRs (Season: ${player.seasonStats.hr})`,
                                    aiConfidence: 94,
                                    playerConfidence: 85,
                                    customExplanation: `${player.name.split(' ').pop()} exhibits extremely solid exit velocity index and high launch angle potential.`
                                  };
                                  const updated = [...selectedPlayers];
                                  if (updated.length > 0) {
                                    updated[potdIndex] = newSelection;
                                  } else {
                                    updated.push(newSelection);
                                  }
                                  setSelectedPlayers(updated);
                                }
                                triggerToast(`Featured Spotlight Star changed to: ${player.name}`);
                              } else {
                                if (!isActive) handleAddPlayerToCircle(player);
                              }
                            }}
                          >
                            <div className="flex items-center gap-1.5 text-left min-w-0">
                              <img
                                src={player.headshot}
                                alt={player.name}
                                referrerPolicy="no-referrer"
                                loading="lazy"
                                decoding="async"
                                className="w-4 h-4 rounded bg-black/25 border border-white/10 object-cover shrink-0"
                              />
                              <span className="truncate">{player.name} <span className="text-[7.5px] text-white/35 font-mono">({player.team.split(' ').pop()})</span></span>
                            </div>
                            {isActive ? (
                              <span className="text-[7px] text-slate-650 font-mono">SELECTED</span>
                            ) : (
                              <Plus className="w-3 h-3 text-sky-400 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Fine-Tuning individual stats & projections */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <label className="text-[8.5px] uppercase font-mono font-bold text-white/45 block tracking-wider">Fine-Tune Stats & Coefficients:</label>
                  <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                    {selectedPlayers
                      .map((ps, index) => ({ ps, originalIndex: index }))
                      .filter(({ originalIndex }) => activeCardLayout !== 'potd' || originalIndex === potdIndex)
                      .map(({ ps, originalIndex }) => (
                        <div key={ps.player.id} className="bg-obsidian-900 p-3 rounded-xl border border-white/10 space-y-2.5">
                          <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                            <span className="font-bold text-[10.5px] text-white/80 truncate flex items-center gap-1.5">
                              <span className="text-[8px] font-mono text-sky-400 bg-sky-950 px-1 py-0.2 rounded border border-sky-900">STAR</span>
                              {ps.player.name}
                            </span>
                            <span className="text-[7.5px] font-mono text-white/40 uppercase">
                              {ps.player.team.split(' ').pop()} · No. {ps.player.number}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                            <div className="space-y-1">
                              <span className="text-[7.5px] uppercase font-mono text-white/40 block">Metric Highlight</span>
                              <select
                                value={ps.statType}
                                onChange={(e) => handleStatTypeChange(originalIndex, e.target.value as CustomPlayerSelection['statType'])}
                                className="w-full bg-black/25 border border-white/10 text-white/80 text-[10px] p-1 rounded outline-none font-medium cursor-pointer"
                              >
                                <option value="Homeruns">Homeruns (HR)</option>
                                <option value="Runs">Runs Scored</option>
                                <option value="Hits">Hits Line</option>
                                <option value="RBIs">RBIs Line</option>
                                <option value="AVG">Season AVG</option>
                                <option value="OPS">Season OPS</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[7.5px] uppercase font-mono text-white/40 block">Line Proj. Marker</span>
                              <input
                                type="text"
                                value={ps.customVal}
                                onChange={(e) => handleCustomValChange(originalIndex, e.target.value)}
                                className="w-full bg-black/25 border border-white/10 text-white/80 text-[10px] p-1 rounded outline-none font-mono font-bold"
                                placeholder="e.g. Over 0.5 HRs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-[10.5px] pt-1.5 border-t border-white/[0.06]">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[7.5px] font-mono text-white/40">
                                <span>VAI CONFID.</span>
                                <span className="text-sky-400 font-bold">{ps.aiConfidence ?? 85}%</span>
                              </div>
                              <input
                                type="range"
                                min="50"
                                max="99"
                                value={ps.aiConfidence ?? 85}
                                onChange={(e) => {
                                  const updated = [...selectedPlayers];
                                  updated[originalIndex].aiConfidence = parseInt(e.target.value);
                                  setSelectedPlayers(updated);
                                }}
                                className="w-full accent-sky-500 h-1 bg-black/25 rounded-lg cursor-pointer"
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[7.5px] font-mono text-white/40">
                                <span>PLAYER COEF.</span>
                                <span className="text-amber-400 font-bold">{ps.playerConfidence ?? 80}%</span>
                              </div>
                              <input
                                type="range"
                                min="50"
                                max="99"
                                value={ps.playerConfidence ?? 80}
                                onChange={(e) => {
                                  const updated = [...selectedPlayers];
                                  updated[originalIndex].playerConfidence = parseInt(e.target.value);
                                  setSelectedPlayers(updated);
                                }}
                                className="w-full accent-amber-500 h-1 bg-black/25 rounded-lg cursor-pointer"
                              />
                            </div>
                          </div>

                          <div className="space-y-1 text-left">
                            <div className="flex justify-between items-center text-[7.5px] font-mono text-white/40">
                              <span>Narrative Insight Hook</span>
                              <span className="text-[6.5px] text-white/35 uppercase">Displays on Card 2</span>
                            </div>
                            <textarea
                              rows={2}
                              value={ps.customExplanation ?? ""}
                              onChange={(e) => {
                                const updated = [...selectedPlayers];
                                updated[originalIndex].customExplanation = e.target.value;
                                setSelectedPlayers(updated);
                              }}
                              placeholder="Insights on launch rate, pitch matchup or historical batting averages..."
                              className="w-full bg-black/25 border border-white/10 text-white/80 text-[10px] p-1.5 rounded-lg outline-none focus:border-sky-500/30 resize-none font-medium leading-normal"
                            />
                          </div>

                          {activeCardLayout === 'potd' && (
                            <div className="mt-3 pt-3 border-t border-white/10 space-y-2.5 text-left animate-fade-in">
                              <span className="text-[7.5px] font-mono uppercase font-black text-amber-500 block tracking-widest">
                                🎯 SPOTLIGHT MATCHUP MATH
                              </span>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[7px] font-mono text-white/40 uppercase">Pitcher Name</label>
                                  <input
                                    type="text"
                                    value={ps.pitcherName ?? ""}
                                    onChange={(e) => {
                                      const updated = [...selectedPlayers];
                                      updated[originalIndex].pitcherName = e.target.value;
                                      setSelectedPlayers(updated);
                                    }}
                                    placeholder="Luis Castillo"
                                    className="w-full bg-black/25 border border-white/10 text-white/80 text-[9px] p-1.5 rounded-lg outline-none focus:border-amber-500/30 font-medium"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[7px] font-mono text-white/40 uppercase">Throws</label>
                                  <select
                                    value={ps.pitcherHand ?? "RHP"}
                                    onChange={(e) => {
                                      const updated = [...selectedPlayers];
                                      updated[originalIndex].pitcherHand = e.target.value as 'RHP' | 'LHP';
                                      setSelectedPlayers(updated);
                                    }}
                                    className="w-full bg-black/25 border border-white/10 text-white/80 text-[9px] p-1.5 rounded-lg outline-none focus:border-amber-500/30 font-medium"
                                  >
                                    <option value="RHP">RHP</option>
                                    <option value="LHP">LHP</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-1.5">
                                <div className="space-y-1">
                                  <label className="text-[7px] font-mono text-white/40 uppercase">Pitcher ERA</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0.00"
                                    max="12.00"
                                    value={ps.pitcherEra ?? ""}
                                    onChange={(e) => {
                                      const updated = [...selectedPlayers];
                                      updated[originalIndex].pitcherEra = e.target.value ? parseFloat(e.target.value) : undefined;
                                      setSelectedPlayers(updated);
                                    }}
                                    placeholder="3.55"
                                    className="w-full bg-black/25 border border-white/10 text-white/80 text-[9px] p-1.5 rounded-lg outline-none focus:border-amber-500/30 font-medium"
                                  />
                                </div>
                                <div className="space-y-1 col-span-2">
                                  <label className="text-[7px] font-mono text-white/40 uppercase">Favored Pitch Type Segment</label>
                                  <input
                                    type="text"
                                    value={ps.pitchTypeFavored ?? ""}
                                    onChange={(e) => {
                                      const updated = [...selectedPlayers];
                                      updated[originalIndex].pitchTypeFavored = e.target.value;
                                      setSelectedPlayers(updated);
                                    }}
                                    placeholder="vs Sweeper Slider (.342 AVG)"
                                    className="w-full bg-black/25 border border-white/10 text-white/80 text-[9px] p-1.5 rounded-lg outline-none focus:border-amber-500/30 font-medium"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[7.5px] font-mono text-white/40">
                                  <span>10G HIT RATE</span>
                                  <span className="text-emerald-450 font-bold text-emerald-450">{ps.hitRateLast10 ?? 80}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={ps.hitRateLast10 ?? 80}
                                  onChange={(e) => {
                                    const updated = [...selectedPlayers];
                                    updated[originalIndex].hitRateLast10 = parseInt(e.target.value);
                                    setSelectedPlayers(updated);
                                  }}
                                  className="w-full accent-emerald-500 h-1 bg-black/25 rounded-lg cursor-pointer"
                                />
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[7.5px] font-mono text-white/40">
                                  <span>PLATE SECURITY (PLAY/START RATE)</span>
                                  <span className="text-sky-400 font-bold">{ps.playRatePercent ?? 95}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={ps.playRatePercent ?? 95}
                                  onChange={(e) => {
                                    const updated = [...selectedPlayers];
                                    updated[originalIndex].playRatePercent = parseInt(e.target.value);
                                    setSelectedPlayers(updated);
                                  }}
                                  className="w-full accent-sky-500 h-1 bg-black/25 rounded-lg cursor-pointer"
                                />
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[7.5px] font-mono text-white/40">
                                  <span>Sabermetric Proof Narrative</span>
                                </div>
                                <textarea
                                  rows={2}
                                  value={ps.edgeMathProof ?? ""}
                                  onChange={(e) => {
                                    const updated = [...selectedPlayers];
                                    updated[originalIndex].edgeMathProof = e.target.value;
                                    setSelectedPlayers(updated);
                                  }}
                                  placeholder="E.g., Matchup modeling verifies +12.4% success corridor..."
                                  className="w-full bg-black/25 border border-white/10 text-white/80 text-[9px] p-1.5 rounded-lg outline-none focus:border-amber-500/30 resize-none font-medium leading-normal"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
</>
  );
}
