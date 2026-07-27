import React from 'react';
import { FileText } from 'lucide-react';
import type { VouchStudioDarkroomProps } from '../../types';

export default function RationaleSection(props: VouchStudioDarkroomProps) {
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
          {/* ACCORDION 4: ANALYTICAL SCOUT REASONING */}
          <div className="border-b border-white/10">
            <button
              type="button"
              onClick={() => setStudioSectionRationale(!studioSectionRationale)}
              className="w-full px-4 py-3 min-h-11 bg-ve-graphite/45 flex items-center justify-between text-left border-b border-slate-950 hover:bg-ve-graphite/75 transition-colors"
            >
              <span className="text-[10px] font-mono font-black text-white/80 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                4. Analytical Scout Narrative
              </span>
              <span className="text-white/40 font-mono text-[9px] font-black">{studioSectionRationale ? '[-]' : '[+]'}</span>
            </button>

            {studioSectionRationale && (
              <div className="p-4 bg-ve-obsidian/70 animate-fade-in text-left space-y-2.5">
                <div className="space-y-1.5 text-left">
                  <label className="text-[8.5px] uppercase font-mono font-bold text-white/45 block tracking-wider">Scouter Playbook reasoning:</label>
                  <textarea
                    value={reasonsText}
                    onChange={(e) => setReasonsText(e.target.value)}
                    rows={3}
                    placeholder="Detail the primary sabermetric, wind speed, velocity coefficients or pitch leverage indexes..."
                    className="w-full bg-obsidian-900 border border-white/10 text-white/80 text-xs p-2.5 rounded-xl outline-none focus:border-sky-500/30 resize-none font-medium leading-normal"
                  />
                </div>
              </div>
            )}
          </div>

          {/* WATERMARKS & TOGGLES FOOTER BAR */}
          <div className="p-4 bg-ve-storm space-y-3.5 mt-auto border-t border-white/10 text-left">
            <span className="text-[8px] font-mono text-white/40 uppercase block tracking-wider">Canvas Overlay Elements:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setShowCharts(!showCharts);
                  triggerToast(`Game charts overlay: ${!showCharts ? 'ENABLED' : 'DISABLED'}`);
                }}
                className={`ve-studio-touch-btn flex flex-col items-center justify-center min-h-11 p-2.5 rounded-xl outline-none border transition-all ${
                  showCharts 
                    ? 'bg-sky-950/20 border-sky-850 text-sky-400 font-black' 
                    : 'bg-obsidian-900 border-white/10 text-white/35'
                }`}
              >
                <span className="font-mono text-[7px] font-black uppercase">GAME CHARTS</span>
                <span className="text-[9px] font-black uppercase mt-0.5">{showCharts ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => {
                  setShowLogo(!showLogo);
                  triggerToast(`VouchEdge Watermark overlay: ${!showLogo ? 'ENABLED' : 'DISABLED'}`);
                }}
                className={`ve-studio-touch-btn flex flex-col items-center justify-center min-h-11 p-2.5 rounded-xl outline-none border transition-all ${
                  showLogo 
                    ? 'bg-sky-950/20 border-sky-850 text-sky-400 font-black' 
                    : 'bg-obsidian-900 border-white/10 text-white/35'
                }`}
              >
                <span className="font-mono text-[7px] font-black uppercase">WATERMARK</span>
                <span className="text-[9px] font-black uppercase mt-0.5">{showLogo ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => {
                  setShowReasons(!showReasons);
                  triggerToast(`Scout rationale text block: ${!showReasons ? 'ENABLED' : 'DISABLED'}`);
                }}
                className={`ve-studio-touch-btn flex flex-col items-center justify-center min-h-11 p-2.5 rounded-xl outline-none border transition-all ${
                  showReasons 
                    ? 'bg-sky-950/20 border-sky-850 text-sky-400 font-black' 
                    : 'bg-obsidian-900 border-white/10 text-white/35'
                }`}
              >
                <span className="font-mono text-[7px] font-black uppercase">RATIONALE TXT</span>
                <span className="text-[9px] font-black uppercase mt-0.5">{showReasons ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>
</>
  );
}
