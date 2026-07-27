import React from 'react';
import { SlidersHorizontal, Layers, Plus, X, Info } from 'lucide-react';
import type { VouchStudioDarkroomProps } from '../../types';

export default function PresetSection(props: VouchStudioDarkroomProps) {
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
          {/* ACCORDION 1: COLOR PROFILE & DESIGN LAYOUT */}
          <div className="border-b border-white/10">
            <button
              type="button"
              onClick={() => setStudioSectionPreset(!studioSectionPreset)}
              className="w-full px-4 py-3 min-h-11 bg-ve-graphite/45 flex items-center justify-between text-left border-b border-slate-950 hover:bg-ve-graphite/75 transition-colors"
            >
              <span className="text-[10px] font-mono font-black text-white/80 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                1. Profiles & Layouts
              </span>
              <span className="text-white/40 font-mono text-[9px] font-black">{studioSectionPreset ? '[-]' : '[+]'}</span>
            </button>

            {studioSectionPreset && (
              <div className="p-4 space-y-4 bg-ve-obsidian/70 animate-fade-in text-left">
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
</>
  );
}
