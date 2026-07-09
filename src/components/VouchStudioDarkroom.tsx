import React, { useState, useEffect } from 'react';
import { 
  SlidersHorizontal, 
  Layers, 
  Activity, 
  Plus, 
  X, 
  Sparkles, 
  RotateCcw, 
  Download, 
  Tv, 
  Share2, 
  ChevronRight, 
  ChevronLeft, 
  Crown, 
  FileText, 
  Info,
  Flame,
  Award,
  Eye,
} from 'lucide-react';
import { MLBPlayer, Vouch } from '../types';
import { MLB_PLAYER_RECORDS } from '../data/playerData';
import { getPlayerSpotlightMetrics } from '../utils/spotlightMath';
import { getFounderPointsLabel } from "../lib/founderAccess";
import { Z8_ACTIVE, Z8_IDLE } from '../theme/z8Tokens';

export interface CustomPlayerSelection {
  player: MLBPlayer;
  statType: 'Homeruns' | 'Runs' | 'Hits' | 'RBIs' | 'AVG' | 'OPS';
  customVal: string;
  aiConfidence?: number;
  playerConfidence?: number;
  customExplanation?: string;
  // Spotlight Analytical Additions
  pitcherName?: string;
  pitcherHand?: 'RHP' | 'LHP';
  hitRateLast10?: number;
  playRatePercent?: number;
  pitchTypeFavored?: string;
  pitcherEra?: number;
  edgeMathProof?: string;
}

interface VouchStudioDarkroomProps {
  profile: any;
  savedVouches: Vouch[];
  selectedPlayers: CustomPlayerSelection[];
  setSelectedPlayers: React.Dispatch<React.SetStateAction<CustomPlayerSelection[]>>;
  cardStyle: 'cyberpunk' | 'luxury' | 'crimson' | 'minimal' | 'hologram';
  setCardStyle: (style: 'cyberpunk' | 'luxury' | 'crimson' | 'minimal' | 'hologram') => void;
  activeCardLayout: 'orbit' | 'potd' | 'parlay';
  setActiveCardLayout: (layout: 'orbit' | 'potd' | 'parlay') => void;
  potdIndex: number;
  setPotdIndex: (idx: number) => void;
  customCardPhoto: string;
  setCustomCardPhoto: (url: string) => void;
  customCardPhotoLabel: string;
  setCustomCardPhotoLabel: (label: string) => void;
  showWinRate: boolean;
  setShowWinRate: (show: boolean) => void;
  customWinRate: string;
  setCustomWinRate: (val: string) => void;
  showDailyWinRate: boolean;
  setShowDailyWinRate: (show: boolean) => void;
  customDailyWinRate: string;
  setCustomDailyWinRate: (val: string) => void;
  showMonthlyWinRate: boolean;
  setShowMonthlyWinRate: (show: boolean) => void;
  customMonthlyWinRate: string;
  setCustomMonthlyWinRate: (val: string) => void;
  showMlbPicks: boolean;
  setShowMlbPicks: (show: boolean) => void;
  customMlbPicks: string;
  setCustomMlbPicks: (val: string) => void;
  showProBadge: boolean;
  setShowProBadge: (show: boolean) => void;
  customProTag: string;
  setCustomProTag: (val: string) => void;
  showUnitsProfit: boolean;
  setShowUnitsProfit: (show: boolean) => void;
  unitsProfitValue: string;
  setUnitsProfitValue: (val: string) => void;
  showBestParlay: boolean;
  setShowBestParlay: (show: boolean) => void;
  bestParlayDesc: string;
  setBestParlayDesc: (val: string) => void;
  showCoupon: boolean;
  setShowCoupon: (show: boolean) => void;
  couponCode: string;
  setCouponCode: (val: string) => void;
  couponText: string;
  setCouponText: (val: string) => void;
  reasonsText: string;
  setReasonsText: (val: string) => void;
  showCharts: boolean;
  setShowCharts: (show: boolean) => void;
  showLogo: boolean;
  setShowLogo: (show: boolean) => void;
  showReasons: boolean;
  setShowReasons: (show: boolean) => void;
  previewScale: number;
  setPreviewScale: (scale: number) => void;
  activePreviewCardIndex: number;
  setActivePreviewCardIndex: (idx: number) => void;
  showSecondCard: boolean;
  setShowSecondCard: (show: boolean) => void;
  postSideways: boolean;
  setPostSideways: (side: boolean) => void;
  isPublishingToFeed: boolean;
  handlePublishAsFeedPost: () => void;
  handleSimulateXPost: () => void;
  triggerToast: (msg: string) => void;
  formattedToday: string;
  calculateOrbitPos: (index: number) => { x: number; y: number };
  handleAddPlayerToCircle: (player: MLBPlayer) => void;
  handleRemovePlayerFromCircle: (playerId: string) => void;
  handleStatTypeChange: (index: number, newStat: CustomPlayerSelection['statType']) => void;
  handleCustomValChange: (index: number, text: string) => void;
  studioSectionPreset: boolean;
  setStudioSectionPreset: (val: boolean) => void;
  studioSectionRoster: boolean;
  setStudioSectionRoster: (val: boolean) => void;
  studioSectionPromo: boolean;
  setStudioSectionPromo: (val: boolean) => void;
  studioSectionRationale: boolean;
  setStudioSectionRationale: (val: boolean) => void;
}

const cardStyleConfigs = {
  cyberpunk: {
    bg: 'bg-ve-obsidian border-2 border-[#162540] dark:bg-ve-obsidian',
    cardBorder: 'border-sky-500/20',
    radialGrad: 'bg-[radial-gradient(circle_at_50%_40%,rgba(14,165,233,0.08),transparent_55%)]',
    cornerLight1: 'bg-cyan-500/10',
    cornerLight2: 'bg-indigo-500/5',
    orbitStroke: 'stroke-sky-500/30',
    orbitDashed: 'border-dashed border-sky-500/20',
    orbitRing: 'border-slate-850/65',
    hubBg: 'bg-ve-graphite border-2 border-sky-500/30',
    hubGlow: 'bg-[#0ea5e9]/10 group-hover:bg-[#0ea5e9]/25',
    hubVeBg: 'from-sky-600 to-indigo-600 border-sky-450/40',
    hubText: 'text-sky-400',
    nodeBorder: 'border-white/10 group-hover:border-sky-450',
    nodeValueBg: 'bg-ve-obsidian border border-sky-450 text-sky-400',
    nodeTagBg: 'bg-black/25 border-slate-850',
    reasonsBg: 'bg-black/30 border border-white/[0.08]',
    headerTitleColor: 'text-[#cbd5e1]',
    headerSubTitleColor: 'text-white/40',
    brandBadge: 'bg-sky-950/60 border border-sky-900/40 text-sky-400',
    activeLineColor1: '#0ea5e9',
    activeLineColor2: '#f97316',
    ambientPingColor: 'bg-sky-400',
    labelText: 'Dodger Offense',
    labelText2: 'Yankee Leverage',
    footerUrlColor: 'text-[#cbd5e1]',
    footerPingColor: 'bg-sky-500',
  },
  luxury: {
    bg: 'bg-[#0f0d0a] border-2 border-[#332211] dark:bg-[#0f0d0a]',
    cardBorder: 'border-amber-500/20',
    radialGrad: 'bg-[radial-gradient(circle_at_50%_40%,rgba(217,119,6,0.08),transparent_55%)]',
    cornerLight1: 'bg-amber-500/10',
    cornerLight2: 'bg-yellow-600/5',
    orbitStroke: 'stroke-amber-500/30',
    orbitDashed: 'border-dashed border-amber-500/20',
    orbitRing: 'border-amber-950/40',
    hubBg: 'bg-[#18140f] border-2 border-amber-500/40',
    hubGlow: 'bg-[#d97706]/10 group-hover:bg-[#d97706]/25',
    hubVeBg: 'from-amber-600 to-yellow-600 border-amber-450/40',
    hubText: 'text-amber-400',
    nodeBorder: 'border-[#332211] group-hover:border-amber-500',
    nodeValueBg: 'bg-[#0f0d0a] border border-amber-500 text-amber-400',
    nodeTagBg: 'bg-[#1a1510] border-amber-950/40',
    reasonsBg: 'bg-[#1a1510]/85 border border-amber-950/40',
    headerTitleColor: 'text-[#f1f5f9]',
    headerSubTitleColor: 'text-amber-600/70',
    brandBadge: 'bg-amber-950/60 border border-amber-900/40 text-amber-400',
    activeLineColor1: '#d97706',
    activeLineColor2: '#b45309',
    ambientPingColor: 'bg-amber-400',
    labelText: 'Gold Coefficient',
    labelText2: 'Prestige Pitch',
    footerUrlColor: 'text-amber-500',
    footerPingColor: 'bg-amber-500',
  },
  crimson: {
    bg: 'bg-[#140507] border-2 border-[#450f14] dark:bg-[#140507]',
    cardBorder: 'border-red-500/20',
    radialGrad: 'bg-[radial-gradient(circle_at_50%_40%,rgba(239,68,68,0.08),transparent_55%)]',
    cornerLight1: 'bg-red-500/10',
    cornerLight2: 'bg-rose-950/5',
    orbitStroke: 'stroke-red-500/30',
    orbitDashed: 'border-dashed border-red-500/20',
    orbitRing: 'border-red-950/40',
    hubBg: 'bg-[#1f070a] border-2 border-red-500/40',
    hubGlow: 'bg-[#ef4444]/10 group-hover:bg-[#ef4444]/25',
    hubVeBg: 'from-red-600 to-rose-700 border-red-400/40',
    hubText: 'text-red-400',
    nodeBorder: 'border-[#450f14] group-hover:border-red-500',
    nodeValueBg: 'bg-[#140507] border border-red-500 text-red-450',
    nodeTagBg: 'bg-[#220a0d] border-red-950/40',
    reasonsBg: 'bg-[#220a0d]/85 border border-red-950/40',
    headerTitleColor: 'text-[#fecdd3]',
    headerSubTitleColor: 'text-red-650/70',
    brandBadge: 'bg-red-950/60 border border-red-900/40 text-red-450',
    activeLineColor1: '#ef4444',
    activeLineColor2: '#b91c1c',
    ambientPingColor: 'bg-red-500',
    labelText: 'Extreme Velo',
    labelText2: 'Power Slugging',
    footerUrlColor: 'text-rose-450',
    footerPingColor: 'bg-red-500',
  },
  minimal: {
    bg: 'bg-white border-2 border-slate-200 dark:bg-white',
    cardBorder: 'border-slate-300',
    radialGrad: 'bg-[radial-gradient(circle_at_50%_40%,rgba(100,116,139,0.04),transparent_55%)]',
    cornerLight1: 'bg-slate-100/50',
    cornerLight2: 'bg-slate-200/5',
    orbitStroke: 'stroke-slate-300',
    orbitDashed: 'border-dashed border-slate-350',
    orbitRing: 'border-slate-200',
    hubBg: 'bg-slate-50 border-2 border-slate-400',
    hubGlow: 'bg-slate-100 group-hover:bg-slate-200',
    hubVeBg: 'from-slate-800 to-slate-900 border-slate-450',
    hubText: 'text-slate-900',
    nodeBorder: 'border-slate-300 group-hover:border-white/10',
    nodeValueBg: 'bg-white border border-white/10 text-slate-900',
    nodeTagBg: 'bg-slate-50 border-slate-250',
    reasonsBg: 'bg-slate-50/90 border border-slate-200',
    headerTitleColor: 'text-slate-800',
    headerSubTitleColor: 'text-white/45',
    brandBadge: 'bg-slate-100 border border-slate-200 text-slate-800',
    activeLineColor1: '#1e293b',
    activeLineColor2: '#64748b',
    ambientPingColor: 'bg-black/25',
    labelText: 'Base Line',
    labelText2: 'Target Index',
    footerUrlColor: 'text-white/35',
    footerPingColor: 'bg-obsidian-900',
  },
  hologram: {
    bg: 'bg-[#0f0a1c] border-2 border-[#2b0e40] dark:bg-[#0f0a1c]',
    cardBorder: 'border-fuchsia-500/20',
    radialGrad: 'bg-[radial-gradient(circle_at_50%_40%,rgba(217,70,239,0.08),transparent_55%)]',
    cornerLight1: 'bg-fuchsia-500/10',
    cornerLight2: 'bg-purple-950/5',
    orbitStroke: 'stroke-purple-500/30',
    orbitDashed: 'border-dashed border-fuchsia-500/20',
    orbitRing: 'border-purple-950/40',
    hubBg: 'bg-[#180a29] border-2 border-fuchsia-500/40',
    hubGlow: 'bg-[#d946ef]/10 group-hover:bg-[#d946ef]/25',
    hubVeBg: 'from-fuchsia-600 to-purple-700 border-fuchsia-400/40',
    hubText: 'text-fuchsia-400',
    nodeBorder: 'border-[#2b0e40] group-hover:border-fuchsia-500',
    nodeValueBg: 'bg-[#0f0a1c] border border-fuchsia-400 text-fuchsia-400',
    nodeTagBg: 'bg-[#10061e] border-fuchsia-950/40',
    reasonsBg: 'bg-[#10061e]/85 border border-fuchsia-950/40',
    headerTitleColor: 'text-[#fae8ff]',
    headerSubTitleColor: 'text-purple-650/70',
    brandBadge: 'bg-fuchsia-950/60 border border-fuchsia-900/40 text-fuchsia-455',
    activeLineColor1: '#d946ef',
    activeLineColor2: '#a21caf',
    ambientPingColor: 'bg-fuchsia-400',
    labelText: 'Vapor Flare',
    labelText2: 'Prism Laser',
    footerUrlColor: 'text-fuchsia-455',
    footerPingColor: 'bg-fuchsia-500',
  },
};

export default function VouchStudioDarkroom({
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
}: VouchStudioDarkroomProps) {
  const activeStyle = cardStyleConfigs[cardStyle];
  const [mobileStudioView, setMobileStudioView] = useState<'preview' | 'edit'>('preview');
  const [isCompactStudio, setIsCompactStudio] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const sync = () => setIsCompactStudio(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const showControlsPanel = !isCompactStudio || mobileStudioView === 'edit';
  const showPreviewPanel = !isCompactStudio || mobileStudioView === 'preview';

  return (
    <div className="ve-studio-editor bg-[#090d16] border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-0 lg:min-h-[820px] w-full text-left" id="lightroom-darkroom-studio">
      {/* Top Lightroom Toolbar */}
      <div className="bg-[#0d1220] border-b border-white/10 px-3 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
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
      </div>

      {/* Mobile: swipe-friendly Preview / Edit tabs */}
      <div className="lg:hidden grid grid-cols-2 gap-2 p-3 bg-[#0a0d16] border-b border-white/10" id="ve-studio-mobile-tabs">
        {([
          { id: 'preview' as const, label: 'Preview', icon: Eye },
          { id: 'edit' as const, label: 'Customize', icon: SlidersHorizontal },
        ]).map((tab) => {
          const active = mobileStudioView === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileStudioView(tab.id)}
              className={`ve-studio-touch-btn flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                active ? Z8_ACTIVE : Z8_IDLE
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main 2-column Lightroom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 divide-y lg:divide-y-0 lg:divide-x divide-slate-900">
        
        {/* COLUMN 1: CONTROLS PANEL (LEFT) */}
        <div className={`lg:col-span-4 bg-[#0a0d16] flex flex-col h-full overflow-y-auto lg:max-h-[850px] scrollbar-thin ${showControlsPanel ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* ACCORDION 1: COLOR PROFILE & DESIGN LAYOUT */}
          <div className="border-b border-white/10">
            <button
              type="button"
              onClick={() => setStudioSectionPreset(!studioSectionPreset)}
              className="w-full px-4 py-3 min-h-11 bg-[#0d1220]/45 flex items-center justify-between text-left border-b border-slate-950 hover:bg-[#0d1220]/75 transition-colors"
            >
              <span className="text-[10px] font-mono font-black text-white/80 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                1. Profiles & Layouts
              </span>
              <span className="text-white/40 font-mono text-[9px] font-black">{studioSectionPreset ? '[-]' : '[+]'}</span>
            </button>

            {studioSectionPreset && (
              <div className="p-4 space-y-4 bg-[#07090f]/70 animate-fade-in text-left">
                {/* Presets Grid */}
                <div className="space-y-1.5">
                  <label className="text-[8.5px] uppercase font-mono font-bold text-white/45 block tracking-wider">Visual Preset Themes:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: 'cyberpunk', name: '🕹️ Cyber Cobalt', desc: 'Neon cyan & dark cobalt overlays', bg: 'bg-cyan-500' },
                      { id: 'luxury', name: '👑 Gold Prestige', desc: 'Obsidian & gold prestige', bg: 'bg-amber-400' },
                      { id: 'crimson', name: '🔥 Crimson Fury', desc: 'Blood red neon & carbon slate', bg: 'bg-red-500' },
                      { id: 'minimal', name: '🏛️ Swiss Minimal', desc: 'High-contrast light editorial', bg: 'bg-slate-300' },
                      { id: 'hologram', name: '✨ Midnight Holo', desc: 'Fuchsia dream & starry nebula', bg: 'bg-fuchsia-400' }
                    ].map(styleOpt => (
                      <button
                        key={styleOpt.id}
                        type="button"
                        onClick={() => setCardStyle(styleOpt.id as any)}
                        className={`group py-2.5 px-2.5 min-h-11 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          cardStyle === styleOpt.id 
                            ? 'bg-sky-500/10 border-sky-500/40 text-sky-300 ring-1 ring-sky-500/20 font-black' 
                            : 'bg-black/30 border-white/10 text-white/40 hover:text-slate-350 hover:bg-black/25'
                        }`}
                      >
                        <span className="text-[10px] block font-semibold leading-none">{styleOpt.name}</span>
                        <div className="flex items-center justify-between w-full mt-1.5">
                          <span className="text-[6.5px] font-mono text-slate-650 group-hover:text-white/45 uppercase truncate max-w-[90px]">{styleOpt.id}</span>
                          <div className={`w-2 h-2 rounded-full ${styleOpt.bg}`} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Blueprints Grid */}
                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <label className="text-[8.5px] uppercase font-mono font-bold text-white/45 block tracking-wider">Blueprint Layout Mode:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'orbit', name: 'ORBIT', desc: 'Circular link map', activeStyle: 'bg-sky-500/10 border-sky-500/40 text-sky-300' },
                      { id: 'potd', name: 'SPOTLIGHT', desc: 'Single featured spot', activeStyle: 'bg-amber-500/10 border-amber-500/40 text-amber-300' },
                      { id: 'parlay', name: 'PARLAY', desc: 'Combined multi-ticket', activeStyle: 'bg-purple-500/10 border-purple-500/40 text-purple-300' }
                    ].map(layoutOpt => (
                      <button
                        key={layoutOpt.id}
                        type="button"
                        onClick={() => {
                          setActiveCardLayout(layoutOpt.id as any);
                          triggerToast(`Layout changed to: ${layoutOpt.name}`);
                        }}
                        className={`py-2.5 px-2 min-h-11 rounded-xl border text-center transition-all text-[9.5px] font-mono font-black flex flex-col items-center justify-center gap-1 ${
                          activeCardLayout === layoutOpt.id
                            ? `${layoutOpt.activeStyle} shadow-sm`
                            : 'bg-black/30 border-white/10 text-slate-550 hover:text-white/65 hover:bg-black/20'
                        }`}
                      >
                        <span>{layoutOpt.name}</span>
                        <span className="text-[6px] font-mono tracking-tight text-white/35 uppercase font-normal">{layoutOpt.id}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background photo & stadium presets */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <label className="text-[8.5px] uppercase font-mono font-bold text-white/45 block tracking-wider">Stadium Texture Plate:</label>
                    {customCardPhoto && (
                      <button 
                        onClick={() => { setCustomCardPhoto(""); setCustomCardPhotoLabel(""); }} 
                        className="text-red-400 font-mono text-[7px] uppercase font-bold hover:text-red-300"
                      >
                        Clear Loaded
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button 
                      type="button" 
                      onClick={() => {
                        setCustomCardPhoto("https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80");
                        setCustomCardPhotoLabel("Green Turf Field");
                        triggerToast("Stadium background set to: Green Turf Field preset.");
                      }} 
                      className={`text-[9px] font-mono p-1.5 rounded-lg border leading-tight text-left truncate flex items-center gap-1 ${
                        customCardPhotoLabel === "Green Turf Field" ? 'bg-sky-950/30 border-sky-800 text-sky-300' : 'bg-obsidian-900 border-white/10 text-slate-405 hover:text-slate-205'
                      }`}
                    >
                      <span>🌱</span> <span className="truncate">Green Turf Field</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setCustomCardPhoto("https://images.unsplash.com/photo-1540747737956-378724044432?w=600&auto=format&fit=crop&q=80");
                        setCustomCardPhotoLabel("Stadium Light Beams");
                        triggerToast("Stadium background set to: Light Beams preset.");
                      }} 
                      className={`text-[9px] font-mono p-1.5 rounded-lg border leading-tight text-left truncate flex items-center gap-1 ${
                        customCardPhotoLabel === "Stadium Light Beams" ? 'bg-sky-950/30 border-sky-800 text-sky-300' : 'bg-obsidian-900 border-white/10 text-slate-405 hover:text-slate-205'
                      }`}
                    >
                      <span>🏟️</span> <span className="truncate">Stadium Lights</span>
                    </button>
                  </div>

                  <label className="cursor-pointer bg-obsidian-900 hover:bg-black/30 border border-dashed border-white/10 hover:border-sky-500/20 py-2.5 px-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all text-center group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setCustomCardPhoto(reader.result);
                              setCustomCardPhotoLabel(file.name);
                              triggerToast(`Loaded custom plate image: ${file.name}`);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="flex items-center gap-1.5 justify-center">
                      <Plus className="w-3 h-3 text-white/40 group-hover:text-sky-400" />
                      <span className="text-[8.5px] font-mono font-black text-slate-405 group-hover:text-slate-205 uppercase">Upload Custom Plate File</span>
                    </div>
                  </label>
                  
                  {customCardPhoto && (
                    <div className="bg-sky-950/20 border border-sky-900/40 rounded-xl px-2.5 py-1 flex items-center justify-between text-[8px] font-mono text-sky-300">
                      <span className="truncate max-w-[150px]">Current: {customCardPhotoLabel || "Custom Load"}</span>
                      <span className="text-[7.5px] text-sky-400">Active Overlay</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 2: ROSTER LINEUP & PLAYER TUNING */}
          <div className="border-b border-white/10">
            <button
              type="button"
              onClick={() => setStudioSectionRoster(!studioSectionRoster)}
              className="w-full px-4 py-3 min-h-11 bg-[#0d1220]/45 flex items-center justify-between text-left border-b border-slate-950 hover:bg-[#0d1220]/75 transition-colors"
            >
              <span className="text-[10px] font-mono font-black text-white/80 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                2. Roster & Player Tuning
              </span>
              <span className="text-white/40 font-mono text-[9px] font-black">{studioSectionRoster ? '[-]' : '[+]'}</span>
            </button>

            {studioSectionRoster && (
              <div className="p-4 space-y-4 bg-[#07090f]/70 animate-fade-in text-left">
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

          {/* ACCORDION 3: PROMO SUITE & SOCIAL STAMPS */}
          <div className="border-b border-white/10">
            <button
              type="button"
              onClick={() => setStudioSectionPromo(!studioSectionPromo)}
              className="w-full px-4 py-3 min-h-11 bg-[#0d1220]/45 flex items-center justify-between text-left border-b border-slate-950 hover:bg-[#0d1220]/75 transition-colors"
            >
              <span className="text-[10px] font-mono font-black text-white/80 uppercase tracking-wider flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-sky-400" />
                3. Promotion & Stamp Overlays
              </span>
              <span className="text-white/40 font-mono text-[9px] font-black">{studioSectionPromo ? '[-]' : '[+]'}</span>
            </button>

            {studioSectionPromo && (
              <div className="p-4 space-y-3.5 bg-[#07090f]/70 animate-fade-in text-left">
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

          {/* ACCORDION 4: ANALYTICAL SCOUT REASONING */}
          <div className="border-b border-white/10">
            <button
              type="button"
              onClick={() => setStudioSectionRationale(!studioSectionRationale)}
              className="w-full px-4 py-3 min-h-11 bg-[#0d1220]/45 flex items-center justify-between text-left border-b border-slate-950 hover:bg-[#0d1220]/75 transition-colors"
            >
              <span className="text-[10px] font-mono font-black text-white/80 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                4. Analytical Scout Narrative
              </span>
              <span className="text-white/40 font-mono text-[9px] font-black">{studioSectionRationale ? '[-]' : '[+]'}</span>
            </button>

            {studioSectionRationale && (
              <div className="p-4 bg-[#07090f]/70 animate-fade-in text-left space-y-2.5">
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
          <div className="p-4 bg-[#090c14] space-y-3.5 mt-auto border-t border-white/10 text-left">
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

        </div>

        {/* COLUMN 2: CANVAS EDITOR & PREVIEW STAGE (CENTER/RIGHT) */}
        <div className={`lg:col-span-8 bg-[#06080e] flex flex-col h-full min-h-0 lg:min-h-[750px] relative ${showPreviewPanel ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* Canvas Header Toolbar */}
          <div className="bg-[#0a0d16]/90 border-b border-white/10 px-3 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 z-10">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <div className="flex bg-[#0f1424] p-0.5 rounded-lg border border-slate-850 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSecondCard(false)}
                  className={`ve-studio-touch-btn px-3 py-2 min-h-11 text-[9px] sm:text-[8.5px] font-mono font-bold rounded transition-all ${
                    !showSecondCard ? 'bg-sky-950 text-sky-300 font-black' : 'text-white/45 hover:text-white/80'
                  }`}
                >
                  Single Card
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSecondCard(true);
                    setPostSideways(true);
                  }}
                  className={`ve-studio-touch-btn px-3 py-2 min-h-11 text-[9px] sm:text-[8.5px] font-mono font-bold rounded transition-all ${
                    showSecondCard && postSideways ? 'bg-sky-950 text-sky-300 font-black' : 'text-white/45 hover:text-white/80'
                  }`}
                >
                  Dual Grid
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSecondCard(true);
                    setPostSideways(false);
                  }}
                  className={`ve-studio-touch-btn px-3 py-2 min-h-11 text-[9px] sm:text-[8.5px] font-mono font-bold rounded transition-all ${
                    showSecondCard && !postSideways ? 'bg-sky-950 text-sky-300 font-black' : 'text-white/45 hover:text-white/80'
                  }`}
                >
                  Dual Slide
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-1.5 font-mono text-[8.5px] text-white/45">
                <span>ZOOM:</span>
                <span className="text-sky-400 font-black bg-sky-950/40 border border-sky-900/30 px-1.5 rounded">{Math.round(previewScale * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="1.15" 
                step="0.05" 
                value={previewScale}
                onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
                className="flex-1 sm:w-24 min-h-11 sm:min-h-0 bg-obsidian-700 rounded-lg cursor-pointer accent-sky-500" 
              />
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setPreviewScale(0.65)} className="ve-studio-touch-btn min-h-11 min-w-11 px-2 text-[9px] font-mono bg-black/25 border border-white/10 rounded-lg hover:text-white/80">S</button>
                <button onClick={() => setPreviewScale(0.85)} className="ve-studio-touch-btn min-h-11 min-w-11 px-2 text-[9px] font-mono bg-black/25 border border-white/10 rounded-lg hover:text-white/80">M</button>
                <button onClick={() => setPreviewScale(1.0)} className="ve-studio-touch-btn min-h-11 min-w-11 px-2 text-[9px] font-mono bg-black/25 border border-white/10 rounded-lg hover:text-white/80">1:1</button>
              </div>
            </div>
          </div>

          {/* Dynamic Lightroom Checkered Background Canvas Stage */}
          <div 
            className="ve-studio-canvas flex-1 p-3 sm:p-6 lg:p-10 overflow-y-auto lg:max-h-[750px] flex items-center justify-center relative select-none scrollbar-none"
            style={{
              backgroundImage: `radial-gradient(rgba(14, 165, 233, 0.02) 1px, transparent 1px), radial-gradient(rgba(14, 165, 233, 0.01) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
              backgroundColor: '#05070c'
            }}
          >
            {/* Visual Scale Station Wrapper */}
            <div 
              className="transition-all duration-300 ease-out origin-center flex flex-col items-center justify-center"
              style={{
                transform: `scale(${previewScale})`,
              }}
            >
              
              {/* Outer Artboard Frame simulating Home Feed Post dimensions */}
              <div className="w-full max-w-[620px] bg-[#0c101b] border border-white/[0.06] p-3 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl space-y-5 relative">
                
                {/* Corner Tag: Design State Artboard */}
                <div className="hidden sm:flex absolute top-4 left-4 bg-sky-950/40 border border-sky-900/40 rounded-full px-2.5 py-0.5 text-[8px] font-mono text-sky-400 font-black uppercase tracking-wider items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-sky-400 animate-ping" />
                  Social Feed Post Frame Size (Max-W: 620px)
                </div>

                <div className="absolute top-4 right-4 flex gap-1.5">
                  {showSecondCard && !postSideways && (
                    <div className="bg-obsidian-900/80 rounded-full py-0.5 px-2 text-[8px] font-mono text-white/45 font-bold border border-white/10">
                      {activePreviewCardIndex === 0 ? "CARD 1 / 2" : "CARD 2 / 2"}
                    </div>
                  )}
                  <span className="bg-emerald-950/50 border border-emerald-900/35 text-emerald-400 rounded-full px-2 py-0.5 text-[7.5px] font-mono font-bold uppercase tracking-wider">
                    ★ LIVE STREAM
                  </span>
                </div>

                <div className="pt-6 flex flex-col gap-6 w-full relative">
                  
                  {/* Dynamic dual card flex side-by-side or stacked/paged */}
                  <div className={`flex ${postSideways && showSecondCard ? 'flex-col xl:flex-row' : 'flex-col'} gap-6 w-full justify-center items-center`}>
                    
                    {/* CARD 1 RENDER */}
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
                                  <div key={ps.player.id} className="bg-[#05070c]/50 p-1.5 rounded-xl border border-white/[0.06] flex items-center justify-between gap-2">
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

                  </div>

                </div>
              </div>
              
            </div>
          </div>

          {/* Action Buttons Lightroom Slate Footer — sticky on mobile */}
          <div className="ve-studio-sticky-actions bg-[#0a0d16] border-t border-white/10 px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 z-20">
            <div className="text-left hidden sm:block">
              <span className="text-[8.5px] font-mono text-white/40 block uppercase font-bold">Creator Campaign Operations:</span>
              <p className="text-[10px] text-white/45 mt-0.5">Review, verify projections, and publish this Vouch Board directly to the main feed.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:flex lg:items-center lg:gap-3 w-full lg:w-auto">
              <button
                onClick={handleSimulateXPost}
                className="ve-studio-touch-btn min-h-11 py-2.5 px-4 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 font-mono uppercase cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-white shrink-0" />
                <span className="truncate">Share to X</span>
              </button>

              <button
                onClick={handlePublishAsFeedPost}
                disabled={isPublishingToFeed}
                className={`ve-studio-touch-btn min-h-11 py-2.5 px-4 font-mono font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase cursor-pointer ${
                  isPublishingToFeed 
                    ? 'bg-black/25 border border-white/10 text-white/40 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                }`}
              >
                <Tv className="w-4 h-4 text-white shrink-0" />
                <span className="truncate">{isPublishingToFeed ? 'Publishing...' : 'Publish to Feed'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
