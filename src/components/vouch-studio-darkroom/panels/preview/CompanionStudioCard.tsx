import React from 'react';
import { Activity, ChevronLeft } from 'lucide-react';
import { MLB_PLAYER_RECORDS } from '../../../../data/playerData';
import { getPlayerSpotlightMetrics } from '../../../../utils/spotlightMath';
import type { CardStyleConfig, VouchStudioDarkroomProps } from '../../types';

interface Props extends VouchStudioDarkroomProps {
  activeStyle: CardStyleConfig;
}

export default function CompanionStudioCard(props: Props) {
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
                    {/* COMPANION CARD RENDER (CARD 2) */}
                    {showSecondCard && (postSideways || activePreviewCardIndex === 1) && (
                      <div 
                        className={`relative group/studio-card ${activeStyle.bg} rounded-3xl p-6 overflow-hidden shadow-2xl flex flex-col justify-between aspect-[3/4.2] min-h-[420px] sm:min-h-[520px] lg:min-h-[580px] max-w-[420px] w-full flex-1 transition-all duration-300 border border-white/[0.04]`}
                        style={customCardPhoto ? {
                          backgroundImage: `linear-gradient(${cardStyle === 'minimal' ? 'rgba(255, 255, 255, 0.90)' : 'rgba(10, 15, 30, 0.88)'}, ${cardStyle === 'minimal' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(10, 15, 30, 0.96)'}), url(${customCardPhoto})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        } : undefined}
                      >
                        {/* Slide Back Arrow to Card 1 */}
                        {showSecondCard && !postSideways && activePreviewCardIndex === 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePreviewCardIndex(0);
                            }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-obsidian-900/90 hover:bg-black/30 border border-white/10 text-sky-400 rounded-full transition-all duration-250 opacity-0 group-hover/studio-card:opacity-100 shadow-2xl cursor-pointer z-50 flex items-center justify-center hover:scale-105 active:scale-95"
                            title="Slide back to Circular Card"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                        )}

                        {/* Background details */}
                        <div className={`absolute inset-0 ${activeStyle.radialGrad} pointer-events-none`} />
                        <div className={`absolute top-0 right-0 w-28 h-28 ${activeStyle.cornerLight1} rounded-full blur-3xl pointer-events-none`} />
                        <div className={`absolute bottom-0 left-0 w-28 h-28 ${activeStyle.cornerLight2} rounded-full blur-3xl pointer-events-none`} />

                        {/* COMPANION HEADER */}
                        <div className={`flex justify-between items-center pb-3.5 border-b ${cardStyle === 'minimal' ? 'border-slate-200' : 'border-white/[0.08]'} z-10 relative`}>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${activeStyle.hubVeBg} flex items-center justify-center text-white font-black text-xs border`}>
                              VE
                            </div>
                            <div className="leading-none text-left">
                              <span className={`text-[10px] font-black tracking-widest ${activeStyle.headerTitleColor} uppercase`}>Vouch<span className={cardStyle === 'minimal' ? 'text-slate-900' : 'text-sky-400'}>Edge</span></span>
                              <span className={`text-[7.5px] font-mono font-bold ${activeStyle.headerSubTitleColor} block uppercase mt-0.5`}>Scout Analytics Slate</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`text-[9px] font-black font-mono tracking-tight uppercase px-1.5 py-0.5 rounded leading-none ${cardStyle === 'minimal' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'}`}>
                              ANALYTICAL DECK
                            </span>
                          </div>
                        </div>

                        {/* HIGH CONVERTING PROMO STATS ON COMPANION */}
                        {(showWinRate || showDailyWinRate || showMonthlyWinRate || showMlbPicks || showUnitsProfit) && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5 justify-start items-center z-10 relative">
                            {showWinRate && (
                              <span className={`text-[7px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded leading-none ${cardStyle === 'minimal' ? 'bg-sky-100 text-sky-855 border border-sky-200' : 'bg-sky-500/15 border border-sky-500/35 text-sky-400'}`}>
                                🎯 WR: {customWinRate}
                              </span>
                            )}
                            {showDailyWinRate && (
                              <span className={`text-[7px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded leading-none ${cardStyle === 'minimal' ? 'bg-amber-100 text-amber-855 border border-amber-250' : 'bg-amber-500/15 border border-amber-500/35 text-amber-400'}`}>
                                ⚡ DAILY: {customDailyWinRate}
                              </span>
                            )}
                            {showMonthlyWinRate && (
                              <span className={`text-[7px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded leading-none ${cardStyle === 'minimal' ? 'bg-rose-100 text-rose-855 border border-rose-200' : 'bg-rose-500/15 border border-rose-500/35 text-rose-400'}`}>
                                📆 MONTH: {customMonthlyWinRate}
                              </span>
                            )}
                            {showMlbPicks && (
                              <span className={`text-[7px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded leading-none ${cardStyle === 'minimal' ? 'bg-teal-100 text-teal-855 border border-teal-200' : 'bg-teal-500/15 border border-teal-500/35 text-teal-400'}`}>
                                ⚾ PICKS: {customMlbPicks}
                              </span>
                            )}
                            {showUnitsProfit && (
                              <span className={`text-[7px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded leading-none ${cardStyle === 'minimal' ? 'bg-emerald-100 text-emerald-855 border border-emerald-200' : 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-450'}`}>
                                📈 {unitsProfitValue}
                              </span>
                            )}
                          </div>
                        )}

                        {/* COMPANION MAIN SECTIONS (STARS DATA LIST) */}
                        <div className="space-y-2.5 my-3.5 z-10 relative flex-1 flex flex-col justify-center max-h-[300px] overflow-y-auto pr-1 scrollbar-none">
                          {activeCardLayout === 'potd' ? (
                            /* Spotlight Star Splits & Savant values */
                            (() => {
                              const ps = selectedPlayers[potdIndex] || selectedPlayers[0];
                              if (!ps) return <div className="text-center text-[10px] text-slate-505">No Star Selected</div>;
                              const explanation = ps.customExplanation || "Extreme velocity projections coupled with favorable horizontal break offsets.";
                              const player = ps.player;
                              const metrics = getPlayerSpotlightMetrics(ps);

                              return (
                                <div className="space-y-3 animate-fade-in text-left">
                                  <div className={`p-2.5 rounded-xl border ${activeStyle.nodeTagBg} ${activeStyle.cardBorder} flex items-center justify-between gap-3`}>
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={player.headshot}
                                        alt={player.name}
                                        className="w-10 h-10 rounded-full object-cover border border-white/10 bg-obsidian-900"
                                        referrerPolicy="no-referrer"
                                        loading="lazy"
                                        decoding="async"
                                      />
                                      <div className="leading-tight">
                                        <span className={`text-xs font-black uppercase block ${cardStyle === 'minimal' ? 'text-slate-900' : 'text-amber-300'}`}>
                                          {player.name}
                                        </span>
                                        <span className="text-[7.5px] font-mono text-white/40 uppercase mt-0.5 block">
                                          {player.team} · #{player.number}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[6.5px] font-mono text-white/40 uppercase block leading-none">VAI SABER EDGE</span>
                                      <span className={`text-sm font-black font-mono tracking-tight uppercase ${cardStyle === 'minimal' ? 'text-slate-900' : 'text-emerald-400'}`}>
                                        {metrics.edgeFactorVal} Index
                                      </span>
                                    </div>
                                  </div>

                                  {/* Pitcher Matchup Stats Grid */}
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-black/25 p-2 rounded-xl border border-white/[0.06] text-center font-mono">
                                      <span className="text-[5.5px] text-white/40 uppercase block tracking-wider leading-none mb-1">VS PITCHER ERA</span>
                                      <span className="text-rose-400 text-xs font-black block leading-none">{metrics.pitcherEra}</span>
                                      <span className="text-[5px] text-slate-650 block mt-1 uppercase truncate">{metrics.pitcherName}</span>
                                    </div>
                                    <div className="bg-black/25 p-2 rounded-xl border border-white/[0.06] text-center font-mono">
                                      <span className="text-[5.5px] text-white/40 uppercase block tracking-wider leading-none mb-1">10G HIT RATE</span>
                                      <span className="text-emerald-400 text-xs font-black block leading-none">{metrics.hitRateLast10}%</span>
                                      <span className="text-[5px] text-slate-650 block mt-1 uppercase">LAST 10 MATCHUPS</span>
                                    </div>
                                    <div className="bg-black/25 p-2 rounded-xl border border-white/[0.06] text-center font-mono">
                                      <span className="text-[5.5px] text-white/40 uppercase block tracking-wider leading-none mb-1">PLAY/START RATE</span>
                                      <span className="text-sky-400 text-xs font-black block leading-none">{metrics.playRatePercent}%</span>
                                      <span className="text-[5px] text-slate-650 block mt-1 uppercase">PLATE SECURE</span>
                                    </div>
                                  </div>

                                  {/* Deep Splits Comparison */}
                                  <div className="grid grid-cols-2 gap-2 text-[9px] font-mono bg-black/15 p-2 rounded-xl border border-white/[0.04]">
                                    <div className="space-y-1">
                                      <span className="text-[6.5px] font-black text-slate-550 uppercase block tracking-wider border-b border-white/10 pb-0.5">PLAYER PLURALS</span>
                                      <div className="space-y-0.5 text-white/65">
                                        <div className="flex justify-between"><span>vs {metrics.pitcherHand}:</span><strong className="text-white">{metrics.pitcherHand === 'RHP' ? player.splits?.vRHP?.ops || "1.067" : player.splits?.vLHP?.ops || "0.958"} OPS</strong></div>
                                        <div className="flex justify-between"><span>Last 10 OPS:</span><strong className="text-emerald-400">{player.splits?.last10?.ops || "1.150"}</strong></div>
                                        <div className="flex justify-between"><span>Exit Vel:</span><strong className="text-sky-400">{player.advanced?.exitVelocity || "94.7"} mph</strong></div>
                                      </div>
                                    </div>
                                    <div className="space-y-1 border-l border-white/[0.06] pl-2">
                                      <span className="text-[6.5px] font-black text-slate-550 uppercase block tracking-wider border-b border-white/10 pb-0.5">PITCHER BREAKS</span>
                                      <div className="space-y-0.5 text-white/65">
                                        <div className="flex justify-between"><span>ERA Baseline:</span><strong className="text-rose-400">{metrics.pitcherEra}</strong></div>
                                        <div className="flex justify-between"><span>Favored Mix:</span><strong className="text-amber-400 truncate max-w-[65px]" title={metrics.pitchTypeFavored}>{metrics.pitchTypeFavored.split('(')[0].replace('vs ', '')}</strong></div>
                                        <div className="flex justify-between"><span>Launch Target:</span><strong className="text-sky-400">{player.advanced?.launchAngle || "15.2"}°</strong></div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Formula Explain Block */}
                                  <div className="bg-emerald-950/15 border border-emerald-900/30 p-2 rounded-lg text-left text-[8.5px] font-mono leading-relaxed space-y-1">
                                    <div className="flex items-center gap-1.5 font-bold text-emerald-450 uppercase tracking-widest text-[7px]">
                                      <Activity className="w-3 h-3 text-emerald-400 shrink-0" />
                                      <span>Sabermetric Modeling Equation:</span>
                                    </div>
                                    <p className="text-white/65 font-mono text-[8px] bg-black/35 px-1.5 py-0.5 rounded border border-white/[0.05]">
                                      {metrics.mathFormula}
                                    </p>
                                    <p className="text-white/45 leading-normal text-[8px] italic">
                                      {metrics.edgeMathProof}
                                    </p>
                                  </div>

                                  {/* Narrative explanation */}
                                  <div className={`p-2.5 rounded-xl border ${activeStyle.reasonsBg} text-left space-y-0.5`}>
                                    <span className="text-[7px] font-mono uppercase font-black text-white/45 block tracking-widest leading-none">Scouting Narrative & Matchup Splits:</span>
                                    <p className={`text-[9px] italic leading-normal ${cardStyle === 'minimal' ? 'text-slate-800' : 'text-white/80'}`}>
                                      "{explanation}"
                                    </p>
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            /* Roster list with confidence percentages */
                            selectedPlayers.map((ps, idx) => {
                              const aiConf = ps.aiConfidence ?? (idx % 3 === 0 ? 94 : idx % 3 === 1 ? 91 : 88);
                              const pConf = ps.playerConfidence ?? (idx % 3 === 0 ? 88 : idx % 3 === 1 ? 85 : 92);
                              const explanation = ps.customExplanation || "Analytical projection suggests favorable batting matchup criteria.";

                              return (
                                <div 
                                  key={ps.player.id} 
                                  className={`p-2.5 rounded-xl border ${activeStyle.nodeTagBg} ${activeStyle.cardBorder} flex flex-col gap-1.5 text-left`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <img src={ps.player.headshot} alt={ps.player.name} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full object-cover border border-white/10 bg-obsidian-900" />
                                      <div className="leading-none text-left">
                                        <span className={`text-[10px] font-black uppercase block ${cardStyle === 'minimal' ? 'text-slate-900' : 'text-slate-105'}`}>
                                          {ps.player.name}
                                        </span>
                                        <span className="text-[7px] font-mono text-white/40 uppercase">{ps.player.team.split(' ').pop()} · No. {ps.player.number}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-2 text-[8px] font-mono bg-black/15 px-2 py-0.5 rounded border border-white/10">
                                      <div>
                                        <span className="text-slate-505">VAI: </span>
                                        <span className={`font-extrabold ${cardStyle === 'minimal' ? 'text-sky-600' : 'text-sky-405'}`}>{aiConf}%</span>
                                      </div>
                                      <div className="border-l border-white/10 pl-2">
                                        <span className="text-slate-505">STB: </span>
                                        <span className={`font-extrabold ${cardStyle === 'minimal' ? 'text-amber-600' : 'text-amber-505'}`}>{pConf}%</span>
                                      </div>
                                    </div>
                                  </div>

                                  <p className={`text-[8.5px] italic leading-tight ${cardStyle === 'minimal' ? 'text-white/35' : 'text-slate-350'} truncate`}>
                                    "{explanation}"
                                  </p>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* BEST PARLAY HERO STICKER ON COMPANION */}
                        {showBestParlay && (
                          <div className={`p-2 rounded-xl border relative overflow-hidden z-10 text-left ${cardStyle === 'minimal' ? 'bg-amber-50/60 border-amber-250' : 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30'}`}>
                            <div className="absolute top-0 right-0 py-0.5 px-1.5 bg-amber-505 text-slate-950 text-[6.5px] font-mono font-black uppercase tracking-wider rounded-bl-lg">
                              HOT PARLAY
                            </div>
                            <span className="text-[7px] font-mono uppercase font-black text-slate-550 block mb-0.5 leading-none">⭐ HIGH CORRELATED PARLAY REC:</span>
                            <span className={`text-[9.5px] font-bold block leading-tight ${cardStyle === 'minimal' ? 'text-slate-900' : 'text-amber-300'}`}>
                              {bestParlayDesc}
                            </span>
                          </div>
                        )}

                        {/* COUPON SPECIAL OFFER ON COMPANION */}
                        {showCoupon && (
                          <div className={`p-2 rounded-xl border flex justify-between items-center relative overflow-hidden z-10 text-left mt-1.5 ${cardStyle === 'minimal' ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-sky-500/5 border-sky-500/20 text-[#38bdf8]'}`}>
                            <div className="flex items-center gap-1.5 leading-tight">
                              <span className="text-sm">🎟️</span>
                              <div>
                                <span className="text-[6.5px] font-mono text-white/40 block leading-none">PREMIUM SUBSCRIBER SPECIAL:</span>
                                <span className={`text-[9px] font-black ${cardStyle === 'minimal' ? 'text-slate-805' : 'text-slate-250'}`}>{couponText}</span>
                              </div>
                            </div>
                            <div className="bg-sky-500 text-white text-[8.5px] font-mono font-extrabold px-2 py-0.5 rounded border border-sky-450 leading-none">
                              CODE: {couponCode}
                            </div>
                          </div>
                        )}

                        {/* COMPANION FOOTER */}
                        <div className="mt-3.5 pt-3 border-t border-white/[0.08] flex items-center justify-between z-10 relative">
                          <span className="text-[7.5px] font-mono text-slate-550 tracking-tight leading-none uppercase">CERTIFICATE ID: #VOUCH-{formattedToday.split(',')[1]?.trim() || "ANL"}-ANL</span>
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
