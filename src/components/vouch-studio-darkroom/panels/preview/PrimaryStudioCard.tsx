import React from 'react';
import { Activity, ChevronRight, Crown } from 'lucide-react';
import { MLB_PLAYER_RECORDS } from '../../../../data/playerData';
import { getPlayerSpotlightMetrics } from '../../../../utils/spotlightMath';
import type { CardStyleConfig, VouchStudioDarkroomProps } from '../../types';

interface Props extends VouchStudioDarkroomProps {
  activeStyle: CardStyleConfig;
}

export default function PrimaryStudioCard(props: Props) {
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
    setStudioSectionRationale,
    activeStyle
  } = props;

  return (
    <>
                    {(!showSecondCard || postSideways || activePreviewCardIndex === 0) && (
                      <div 
                        className={`relative group/studio-card ${activeStyle.bg} rounded-3xl p-6 overflow-hidden shadow-2xl flex flex-col justify-between aspect-[3/4.2] min-h-[420px] sm:min-h-[520px] lg:min-h-[580px] max-w-[420px] w-full flex-1 transition-all duration-300 border border-white/[0.04]`}
                        style={customCardPhoto ? {
                          backgroundImage: `linear-gradient(${cardStyle === 'minimal' ? 'rgba(255, 255, 255, 0.88)' : 'rgba(10, 15, 30, 0.85)'}, ${cardStyle === 'minimal' ? 'rgba(255, 255, 255, 0.94)' : 'rgba(10, 15, 30, 0.95)'}), url(${customCardPhoto})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        } : undefined}
                      >
                        {/* Next Arrow on hover to move to Card 2 */}
                        {showSecondCard && !postSideways && activePreviewCardIndex === 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePreviewCardIndex(1);
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-obsidian-900/90 hover:bg-black/30 border border-white/10 text-sky-400 rounded-full transition-all duration-250 opacity-0 group-hover/studio-card:opacity-100 shadow-2xl cursor-pointer z-50 flex items-center justify-center hover:scale-105 active:scale-95"
                            title="Slide to Analytics Card"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        )}

                        {/* Radial dynamic background glow */}
                        <div className={`absolute inset-0 ${activeStyle.radialGrad} pointer-events-none`} />
                        <div className={`absolute top-0 right-0 w-28 h-28 ${activeStyle.cornerLight1} rounded-full blur-3xl pointer-events-none`} />
                        <div className={`absolute bottom-0 left-0 w-28 h-28 ${activeStyle.cornerLight2} rounded-full blur-3xl pointer-events-none`} />

                        {/* CARD HEADER */}
                        <div className={`flex justify-between items-center pb-3.5 border-b ${cardStyle === 'minimal' ? 'border-slate-200' : 'border-white/[0.08]'} z-10 relative`}>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${activeStyle.hubVeBg} flex items-center justify-center text-white font-black text-xs border`}>
                              VE
                            </div>
                            <div className="leading-none text-left">
                              <span className={`text-[10px] font-black tracking-widest ${activeStyle.headerTitleColor} uppercase`}>Vouch<span className={cardStyle === 'minimal' ? 'text-slate-900' : 'text-sky-400'}>Edge</span></span>
                              <span className={`text-[7.5px] font-mono font-bold ${activeStyle.headerSubTitleColor} block uppercase mt-0.5`}>Analytic Core Certified</span>
                            </div>
                          </div>

                          <div className="text-right flex items-center gap-2">
                            <div className="text-right leading-none">
                              <span className={`text-[9px] font-extrabold block uppercase ${cardStyle === 'minimal' ? 'text-slate-800' : 'text-white/80'}`}>
                                {profile?.displayName || "Zhavior"}
                              </span>
                              <span className="text-[8px] text-sky-400 font-mono tracking-tight block mt-0.5">
                                @{profile?.username || "zhavior"}
                              </span>
                            </div>
                            <img
                              src={profile?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"}
                              alt={profile?.displayName || "Zhavior"}
                              className="w-6.5 h-6.5 rounded-full border border-sky-500/20 object-cover bg-obsidian-900 shadow-inner"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                        </div>

                        {/* PROMO STYLES STRIP */}
                        {(showWinRate || showDailyWinRate || showMonthlyWinRate || showMlbPicks || showProBadge || showUnitsProfit) && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5 justify-start items-center z-10 relative">
                            {showProBadge && (
                              <span className="text-[7px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded bg-fuchsia-500 text-white shadow-sm border border-fuchsia-400 leading-none">
                                ★ {customProTag}
                              </span>
                            )}
                            {showWinRate && (
                              <span className={`text-[7px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded leading-none ${cardStyle === 'minimal' ? 'bg-sky-100 text-sky-800 border border-sky-200' : 'bg-sky-500/15 border border-sky-500/35 text-sky-400'}`}>
                                🎯 WR: {customWinRate}
                              </span>
                            )}
                            {showDailyWinRate && (
                              <span className={`text-[7px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded leading-none ${cardStyle === 'minimal' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-amber-500/15 border border-amber-500/35 text-amber-450'}`}>
                                ⚡ DAILY: {customDailyWinRate}
                              </span>
                            )}
                            {showMonthlyWinRate && (
                              <span className={`text-[7px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded leading-none ${cardStyle === 'minimal' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-rose-500/15 border border-rose-500/35 text-rose-400'}`}>
                                📆 MONTH: {customMonthlyWinRate}
                              </span>
                            )}
                            {showMlbPicks && (
                              <span className={`text-[7px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded leading-none ${cardStyle === 'minimal' ? 'bg-teal-100 text-teal-850 border border-teal-200' : 'bg-teal-500/15 border border-teal-500/35 text-teal-400'}`}>
                                ⚾ PICKS: {customMlbPicks}
                              </span>
                            )}
                            {showUnitsProfit && (
                              <span className={`text-[7px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded leading-none ${cardStyle === 'minimal' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-400'}`}>
                                📈 {unitsProfitValue}
                              </span>
                            )}
                          </div>
                        )}

                        {/* MAIN VISUAL DISPLAY AREA */}
                        <div className="flex-1 flex flex-col justify-center my-4">
                          {activeCardLayout === 'orbit' ? (
                            /* Orbit Link Map layout */
                            <div className="w-48 h-48 sm:w-56 sm:h-56 mx-auto relative flex items-center justify-center z-10 animate-fade-in">
                              <div className={`absolute w-[76%] h-[76%] border ${activeStyle.orbitDashed} rounded-full animate-[spin_120s_linear_infinite]`} />
                              <div className={`absolute w-[56%] h-[56%] border ${activeStyle.orbitRing} rounded-full animate-[spin_80s_linear_infinite_reverse]`} />

                              <div className={`absolute z-30 flex flex-col items-center justify-center w-12 h-12 rounded-full ${activeStyle.hubBg} shadow-inner`}>
                                {showLogo ? (
                                  <div className="flex flex-col items-center justify-center">
                                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${activeStyle.hubVeBg} flex items-center justify-center font-black text-white text-[10px] shadow border`}>
                                      VE
                                    </div>
                                  </div>
                                ) : (
                                  <div className={`w-3.5 h-3.5 rounded-full ${activeStyle.ambientPingColor} animate-ping`} />
                                )}
                              </div>

                              {selectedPlayers.map((ps, idx) => {
                                const { x, y } = calculateOrbitPos(idx);
                                return (
                                  <div 
                                    key={ps.player.id} 
                                    className="absolute flex flex-col items-center group transition-all"
                                    style={{ 
                                      left: `${x}%`, 
                                      top: `${y}%`, 
                                      transform: 'translate(-50%, -50%)',
                                      zIndex: 25 
                                    }}
                                  >
                                    <div className={`relative p-0.5 ${cardStyle === 'minimal' ? 'bg-white' : 'bg-obsidian-900'} rounded-full border ${activeStyle.nodeBorder} shadow-lg`}>
                                      <img
                                        src={ps.player.headshot}
                                        alt={ps.player.name}
                                        referrerPolicy="no-referrer"
                                        loading="lazy"
                                        decoding="async"
                                        className="w-10 h-10 rounded-full object-cover bg-black/25"
                                      />
                                      <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 ${activeStyle.nodeValueBg} text-[6.5px] font-bold font-mono px-1 rounded-full shadow leading-none truncate max-w-[65px] text-center`}>
                                        {ps.customVal.split('(')[0].trim()}
                                      </div>
                                    </div>
                                    <span className={`text-[7.5px] font-black ${cardStyle === 'minimal' ? 'text-slate-800' : 'text-white/80'} mt-1 font-mono uppercase px-1 py-0.2 rounded ${activeStyle.nodeTagBg} leading-none`}>
                                      {ps.player.name.split(' ').pop()}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : activeCardLayout === 'potd' ? (
                            /* Featured spotlight star layout */
                            (() => {
                              const featured = selectedPlayers[potdIndex] || selectedPlayers[0] || {
                                player: MLB_PLAYER_RECORDS[0],
                                statType: 'Homeruns' as const,
                                customVal: 'Over 0.5 HRs'
                              };
                              const metrics = getPlayerSpotlightMetrics(featured);
                              return (
                                <div className="h-44 relative flex items-center gap-3.5 z-10 p-3 rounded-2xl bg-black/55 border border-white/[0.06] backdrop-blur-md animate-fade-in text-left">
                                  <div className="relative flex-shrink-0">
                                    <div className={`absolute -inset-1.5 rounded-full bg-gradient-to-tr ${activeStyle.hubVeBg} opacity-80 blur group-hover:scale-105 transition-all animate-[spin_15s_linear_infinite]`} />
                                    <div className={`relative w-18 h-18 sm:w-20 sm:h-20 rounded-full p-0.5 bg-ve-obsidian overflow-hidden border flex items-center justify-center shadow-lg ${activeStyle.nodeBorder}`}>
                                      <img
                                        src={featured.player.headshot}
                                        alt={featured.player.name}
                                        referrerPolicy="no-referrer"
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full rounded-full object-cover bg-obsidian-900"
                                      />
                                    </div>
                                    <span className={`absolute -top-1 -right-1 py-0.5 px-1.5 text-[6.5px] font-mono font-black rounded border whitespace-nowrap uppercase ${activeStyle.brandBadge}`}>
                                      {featured.player.team.split(' ').pop()}
                                    </span>
                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 py-0.5 px-1.5 bg-ve-obsidian text-[#cbd5e1] text-[7px] font-mono font-black rounded-full border border-white/10 leading-none">
                                      #{featured.player.number}
                                    </span>
                                  </div>

                                  <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <div className="flex items-center gap-1">
                                          <Crown className="w-2.5 h-2.5 text-amber-400" />
                                          <span className="text-[6px] font-mono font-black text-amber-400 uppercase tracking-widest">SPOTLIGHT HERO MATCHUP</span>
                                        </div>
                                        <span className={`text-xs sm:text-sm font-black tracking-tight uppercase block leading-tight ${cardStyle === 'minimal' ? 'text-slate-900' : 'text-white/90'}`}>
                                          {featured.player.name}
                                        </span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-[6px] font-mono uppercase text-white/40 block leading-none">VAI EDGE</span>
                                        <span className="text-[11px] font-mono font-black text-emerald-400">{metrics.edgeFactorVal}</span>
                                      </div>
                                    </div>

                                    <div className="flex gap-1.5 text-[7px] font-mono leading-none py-0.5">
                                      <span className="bg-black/30 text-white/45 px-1 py-0.5 rounded border border-white/[0.04]">
                                        10G HIT: <strong className="text-white">{metrics.hitRateLast10}%</strong>
                                      </span>
                                      <span className="bg-black/30 text-white/45 px-1 py-0.5 rounded border border-white/[0.04]">
                                        PA RATE: <strong className="text-white">{metrics.playRatePercent}%</strong>
                                      </span>
                                    </div>

                                    <div className={`p-1.5 rounded-lg border ${activeStyle.nodeTagBg} backdrop-blur-sm space-y-0.5`}>
                                      <div className="flex justify-between items-center text-[6px] font-mono text-white/40 font-bold leading-none">
                                        <span>VS {metrics.pitcherName.toUpperCase()} ({metrics.pitcherHand} · ERA: {metrics.pitcherEra})</span>
                                        <span className="text-amber-400 text-[6.5px]">{metrics.pitchTypeFavored}</span>
                                      </div>
                                      <span className={`text-[10px] font-mono font-black block leading-none ${cardStyle === 'minimal' ? 'text-slate-900' : 'text-white/80'}`}>
                                        {featured.customVal.split('(')[0].trim()}
                                      </span>
                                    </div>

                                    <div className="bg-emerald-950/20 border border-emerald-900/30 p-1 rounded-md flex items-center justify-between text-[6px] font-mono">
                                      <span className="text-emerald-400 truncate max-w-[210px]" title={metrics.mathFormula}>
                                        {metrics.mathFormula}
                                      </span>
                                      <span className="text-[5.5px] text-emerald-500 uppercase shrink-0 font-extrabold font-mono tracking-widest pl-1">SABERMETRIC EDGE</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            /* Combined parlay tickets layout */
                            <div className="space-y-1.5 animate-fade-in text-left">
                              <div className="flex justify-between items-center bg-black/20 p-1.5 rounded-lg border border-white/10 px-2">
                                <span className="text-[7px] font-mono text-slate-505 uppercase tracking-wider">Multi-correlated parlay voucher</span>
                                <span className="text-[7.5px] font-mono text-vouch-cyan font-bold bg-indigo-950/20 px-1 py-0.2 rounded border border-indigo-900/40 uppercase">PRO SELECTIONS</span>
                              </div>
                              <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                                {selectedPlayers.map((ps, index) => (
                                  <div key={ps.player.id} className="bg-ve-obsidian/50 p-1.5 rounded-xl border border-white/[0.06] flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <img src={ps.player.headshot} alt={ps.player.name} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="w-5.5 h-5.5 rounded-full object-cover shrink-0" />
                                      <div className="min-w-0 leading-none">
                                        <span className="text-[9.5px] font-black text-white/80 block uppercase truncate">{ps.player.name}</span>
                                        <span className="text-[6.5px] font-mono text-white/40">{ps.player.team.split(' ').pop()} · No. {ps.player.number}</span>
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="text-[9.5px] font-mono font-black text-emerald-400 block leading-none">{ps.customVal.split('(')[0].trim()}</span>
                                      <span className="text-[6px] font-mono text-white/40 block mt-0.5">STABILITY: {ps.playerConfidence ?? 80}%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* CREATOR VERIFIED RATIONALE BOX */}
                        {showReasons && activeCardLayout !== 'parlay' && (
                          <div className={`${activeStyle.reasonsBg} rounded-xl p-2.5 z-10 relative space-y-1 text-left`}>
                            <span className={`text-[7.5px] font-mono ${cardStyle === 'minimal' ? 'text-white/40' : 'text-white/45'} uppercase font-black block tracking-wider leading-none`}>
                              Verified Creator Analytical Rationale:
                            </span>
                            <p className={`text-[8.5px] ${cardStyle === 'minimal' ? 'text-slate-700' : 'text-white/65'} font-medium italic leading-relaxed`}>
                              "{reasonsText}"
                            </p>
                          </div>
                        )}

                        {/* OPTIONAL HISTORIC PERFORMANCE GRAPH */}
                        {showCharts && activeCardLayout !== 'parlay' && (
                          <div className={`${cardStyle === 'minimal' ? 'bg-slate-50 border-slate-200' : 'bg-obsidian-900'} rounded-xl border ${activeStyle.cardBorder} p-2 z-10 relative mt-1.5`}>
                            <div className="flex justify-between items-center text-[7px] font-mono text-white/40 uppercase">
                              <span>PERFORMANCE TRACKING INDEX</span>
                              <span className="text-sky-400 font-bold">Source: VAI Core</span>
                            </div>
                            <div className="h-10 w-full mt-1">
                              <svg className="w-full h-full" viewBox="0 0 300 60">
                                <polyline fill="none" stroke={activeStyle.activeLineColor1} strokeWidth="1.5" points="5,45 60,15 120,35 180,8 240,28 295,12" />
                                <circle cx="295" cy="12" r="2.5" fill={activeStyle.activeLineColor1} />
                              </svg>
                            </div>
                          </div>
                        )}

                        {/* FOOTER WATERMARK / BRAND */}
                        <div className="mt-3.5 pt-3 border-t border-white/[0.08] flex items-center justify-between z-10 relative">
                          <span className="text-[7.5px] font-mono text-slate-550 tracking-tight leading-none uppercase">CERTIFICATE ID: #VOUCH-{formattedToday.split(',')[1]?.trim() || "OBT"}-OBT</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${activeStyle.footerPingColor} animate-pulse`} />
                            <span className={`text-[7.5px] font-mono font-bold uppercase tracking-widest ${activeStyle.footerUrlColor}`}>VOUCHEDGE.APP</span>
                          </div>
                        </div>

                      </div>
                    )}
    </>
  );
}
