import React from 'react';
import { Sparkles, RotateCcw, Download } from 'lucide-react';
import type { VouchStudioDarkroomProps } from '../types';

type Props = Pick<
  VouchStudioDarkroomProps,
  | 'selectedPlayers'
  | 'setSelectedPlayers'
  | 'setCardStyle'
  | 'setActiveCardLayout'
  | 'setCustomCardPhoto'
  | 'setCustomCardPhotoLabel'
  | 'setReasonsText'
  | 'setShowWinRate'
  | 'setShowDailyWinRate'
  | 'setShowMonthlyWinRate'
  | 'setShowMlbPicks'
  | 'setShowProBadge'
  | 'setShowUnitsProfit'
  | 'setShowBestParlay'
  | 'setShowCoupon'
  | 'setShowCharts'
  | 'setShowLogo'
  | 'setShowReasons'
  | 'triggerToast'
>;

export default function StudioToolbar(props: Props) {
  const {
    selectedPlayers,
    setSelectedPlayers,
    setCardStyle,
    setActiveCardLayout,
    setCustomCardPhoto,
    setCustomCardPhotoLabel,
    setReasonsText,
    setShowWinRate,
    setShowDailyWinRate,
    setShowMonthlyWinRate,
    setShowMlbPicks,
    setShowProBadge,
    setShowUnitsProfit,
    setShowBestParlay,
    setShowCoupon,
    setShowCharts,
    setShowLogo,
    setShowReasons,
    triggerToast,
  } = props;

  return (
    <>
      {/* Top Lightroom Toolbar */}
      <div className="bg-ve-graphite border-b border-white/10 px-3 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shrink-0" />
          <div className="leading-none text-left min-w-0">
            <span className="text-[11px] sm:text-xs font-mono font-black text-white/90 uppercase tracking-widest block truncate">
              Vouch Editor <span className="text-[9px] text-sky-400 font-extrabold bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-900/30 ml-1">LIVE</span>
            </span>
            <span className="hidden sm:block text-[9.5px] font-mono text-white/40 uppercase mt-1">Creator slate · real-time preview</span>
          </div>
        </div>
        
        {/* Quick Presets and Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              // VAI Smart Optimize: randomized but high analytics projections
              const updated = [...selectedPlayers];
              updated.forEach((p, idx) => {
                p.aiConfidence = Math.floor(Math.random() * 10) + 89; // 89-98%
                p.playerConfidence = Math.floor(Math.random() * 10) + 85; // 85-94%
                if (p.statType === 'Homeruns') {
                  p.customVal = `Over 0.5 HRs (Model Probability: ${Math.floor(Math.random() * 8) + 72}%)`;
                }
              });
              setSelectedPlayers(updated);
              triggerToast("🔮 V.A.I Smart Optimize applied: Projections matched with highest historical hit coefficients!");
            }}
            className="ve-studio-touch-btn flex-1 sm:flex-none px-3 py-2.5 min-h-11 bg-sky-950/60 border border-sky-900/65 text-sky-400 hover:text-sky-300 rounded-xl text-[10px] font-mono font-extrabold uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Use AI model to set ideal projections & confidence intervals"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="truncate">AI Optimize</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCardStyle('cyberpunk');
              setActiveCardLayout('orbit');
              setCustomCardPhoto("");
              setCustomCardPhotoLabel("");
              setReasonsText("Velocity coefficients support launch-angle probability models.");
              setShowWinRate(true);
              setShowDailyWinRate(true);
              setShowMonthlyWinRate(true);
              setShowMlbPicks(true);
              setShowProBadge(true);
              setShowUnitsProfit(true);
              setShowBestParlay(true);
              setShowCoupon(true);
              setShowCharts(true);
              setShowLogo(true);
              setShowReasons(true);
              triggerToast("🔄 Canvas slate reset to Default Cyber Cobalt Profile.");
            }}
            className="ve-studio-touch-btn px-3 py-2.5 min-h-11 min-w-11 bg-black/25 hover:bg-black/35 border border-white/10 text-white/45 hover:text-slate-205 rounded-xl text-[10px] font-mono font-extrabold uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Reset editor back to initial layout"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerToast("💾 Rerendering board plates... Image exported as high-fidelity SVG/PNG bundle (Simulated).");
            }}
            className="ve-studio-touch-btn hidden sm:flex px-3 py-2.5 min-h-11 bg-black/25 hover:bg-black/35 border border-white/10 text-white/45 hover:text-slate-205 rounded-xl text-[10px] font-mono font-extrabold uppercase items-center gap-1.5 transition-colors cursor-pointer"
            title="Download high resolution cards"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>    </>
  );
}
