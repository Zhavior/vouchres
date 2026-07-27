import React from 'react';
import { Crown } from 'lucide-react';
import type { VouchStudioDarkroomProps } from '../../types';

export default function PromoSection(props: VouchStudioDarkroomProps) {
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
          {/* ACCORDION 3: PROMO SUITE & SOCIAL STAMPS */}
          <div className="border-b border-white/10">
            <button
              type="button"
              onClick={() => setStudioSectionPromo(!studioSectionPromo)}
              className="w-full px-4 py-3 min-h-11 bg-ve-graphite/45 flex items-center justify-between text-left border-b border-slate-950 hover:bg-ve-graphite/75 transition-colors"
            >
              <span className="text-[10px] font-mono font-black text-white/80 uppercase tracking-wider flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-sky-400" />
                3. Promotion & Stamp Overlays
              </span>
              <span className="text-white/40 font-mono text-[9px] font-black">{studioSectionPromo ? '[-]' : '[+]'}</span>
            </button>

            {studioSectionPromo && (
              <div className="p-4 space-y-3.5 bg-ve-obsidian/70 animate-fade-in text-left">
                <span className="text-[7.5px] font-mono bg-red-950/40 text-red-400 border border-red-900/30 px-2 py-0.5 rounded font-bold uppercase block tracking-wider text-center">
                  ⚡ High Conversion Marketing Overlays
                </span>

                <div className="space-y-3.5">
                  {/* Win Rates Toggles */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-obsidian-900 p-2.5 rounded-xl border border-white/10 space-y-1.5 text-left">
                      <label className="flex items-center gap-1.5 text-[8px] font-mono text-white/45 font-black cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={showWinRate} 
                          onChange={(e) => setShowWinRate(e.target.checked)}
                          className="rounded bg-black/25 border-white/10 text-sky-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer" 
                        />
                        SHOW WIN RATE
                      </label>
                      <input 
                        type="text" 
                        disabled={!showWinRate}
                        value={customWinRate}
                        onChange={(e) => setCustomWinRate(e.target.value)}
                        className="w-full bg-black/25 disabled:opacity-40 border border-white/10 rounded p-1 text-[10.5px] font-bold text-sky-400 outline-none font-mono" 
                      />
                    </div>

                    <div className="bg-obsidian-900 p-2.5 rounded-xl border border-white/10 space-y-1.5 text-left">
                      <label className="flex items-center gap-1.5 text-[8px] font-mono text-white/45 font-black cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={showDailyWinRate} 
                          onChange={(e) => setShowDailyWinRate(e.target.checked)}
                          className="rounded bg-black/25 border-white/10 text-sky-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer" 
                        />
                        DAILY WIN RATE
                      </label>
                      <input 
                        type="text" 
                        disabled={!showDailyWinRate}
                        value={customDailyWinRate}
                        onChange={(e) => setCustomDailyWinRate(e.target.value)}
                        className="w-full bg-black/25 disabled:opacity-40 border border-white/10 rounded p-1 text-[10.5px] font-bold text-amber-400 outline-none font-mono" 
                      />
                    </div>
                  </div>

                  {/* Monthly & Picks Toggles */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-obsidian-900 p-2.5 rounded-xl border border-white/10 space-y-1.5 text-left">
                      <label className="flex items-center gap-1.5 text-[8px] font-mono text-white/45 font-black cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={showMonthlyWinRate} 
                          onChange={(e) => setShowMonthlyWinRate(e.target.checked)}
                          className="rounded bg-black/25 border-white/10 text-sky-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer" 
                        />
                        MONTHLY RATE
                      </label>
                      <input 
                        type="text" 
                        disabled={!showMonthlyWinRate}
                        value={customMonthlyWinRate}
                        onChange={(e) => setCustomMonthlyWinRate(e.target.value)}
                        className="w-full bg-black/25 disabled:opacity-40 border border-white/10 rounded p-1 text-[10.5px] font-bold text-rose-400 outline-none font-mono" 
                      />
                    </div>

                    <div className="bg-obsidian-900 p-2.5 rounded-xl border border-white/10 space-y-1.5 text-left">
                      <label className="flex items-center gap-1.5 text-[8px] font-mono text-white/45 font-black cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={showMlbPicks} 
                          onChange={(e) => setShowMlbPicks(e.target.checked)}
                          className="rounded bg-black/25 border-white/10 text-sky-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer" 
                        />
                        MLB RUN PICKS
                      </label>
                      <input 
                        type="text" 
                        disabled={!showMlbPicks}
                        value={customMlbPicks}
                        onChange={(e) => setCustomMlbPicks(e.target.value)}
                        className="w-full bg-black/25 disabled:opacity-40 border border-white/10 rounded p-1 text-[10.5px] font-bold text-teal-400 outline-none font-mono" 
                      />
                    </div>
                  </div>

                  {/* Pro Badge & Units Net Profit */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-obsidian-900 p-2.5 rounded-xl border border-white/10 space-y-1.5 text-left">
                      <label className="flex items-center gap-1.5 text-[8px] font-mono text-white/45 font-black cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={showProBadge} 
                          onChange={(e) => setShowProBadge(e.target.checked)}
                          className="rounded bg-black/25 border-white/10 text-sky-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer" 
                        />
                        PRO LEVEL STAMP
                      </label>
                      <input 
                        type="text" 
                        disabled={!showProBadge}
                        value={customProTag}
                        onChange={(e) => setCustomProTag(e.target.value)}
                        className="w-full bg-black/25 disabled:opacity-40 border border-white/10 rounded p-1 text-[10.5px] font-bold text-fuchsia-400 outline-none font-mono" 
                      />
                    </div>

                    <div className="bg-obsidian-900 p-2.5 rounded-xl border border-white/10 space-y-1.5 text-left">
                      <label className="flex items-center gap-1.5 text-[8px] font-mono text-white/45 font-black cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={showUnitsProfit} 
                          onChange={(e) => setShowUnitsProfit(e.target.checked)}
                          className="rounded bg-black/25 border-white/10 text-sky-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer" 
                        />
                        UNITS NET PROFIT
                      </label>
                      <input 
                        type="text" 
                        disabled={!showUnitsProfit}
                        value={unitsProfitValue}
                        onChange={(e) => setUnitsProfitValue(e.target.value)}
                        className="w-full bg-black/25 disabled:opacity-40 border border-white/10 rounded p-1 text-[10.5px] font-bold text-emerald-450 outline-none font-mono" 
                      />
                    </div>
                  </div>

                  {/* Correlated Parlay Desc */}
                  <div className="bg-obsidian-900 p-2.5 rounded-xl border border-white/10 space-y-1.5 text-left">
                    <label className="flex items-center gap-1.5 text-[8px] font-mono text-white/45 font-black cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={showBestParlay} 
                        onChange={(e) => setShowBestParlay(e.target.checked)}
                        className="rounded bg-black/25 border-white/10 text-sky-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer" 
                      />
                      BEST PARLAY PICK (HERO STICKER)
                    </label>
                    <input 
                      type="text" 
                      disabled={!showBestParlay}
                      value={bestParlayDesc}
                      onChange={(e) => setBestParlayDesc(e.target.value)}
                      className="w-full bg-black/25 disabled:opacity-40 border border-[#1e293b] rounded p-1.5 text-[10.5px] text-white/80 outline-none font-mono" 
                    />
                  </div>

                  {/* Promo coupon inputs */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-obsidian-900 p-2.5 rounded-xl border border-white/10 space-y-1.5 text-left">
                      <label className="flex items-center gap-1.5 text-[8px] font-mono text-white/40 font-bold cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={showCoupon} 
                          onChange={(e) => setShowCoupon(e.target.checked)}
                          className="rounded bg-black/25 border-white/10 text-sky-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer" 
                        />
                        COUPON CODE
                      </label>
                      <input 
                        type="text" 
                        disabled={!showCoupon}
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="w-full bg-black/25 disabled:opacity-40 border border-white/10 rounded p-1 text-[10.5px] font-bold uppercase text-amber-500 outline-none font-mono" 
                      />
                    </div>

                    <div className="bg-obsidian-900 p-2.5 rounded-xl border border-white/10 space-y-1.5 text-left">
                      <span className="text-[8px] font-mono text-white/40 block">COUPON DESC TEXT</span>
                      <input 
                        type="text" 
                        disabled={!showCoupon}
                        value={couponText}
                        onChange={(e) => setCouponText(e.target.value)}
                        className="w-full bg-black/25 disabled:opacity-40 border border-white/10 rounded p-1 text-[10px] font-bold text-white/65 outline-none font-mono" 
                      />
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
</>
  );
}
