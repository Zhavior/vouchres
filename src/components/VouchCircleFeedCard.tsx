import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Check, 
  Tv, 
  Info, 
  Flame, 
  Activity, 
  Shield 
} from 'lucide-react';
import { FeedPost } from '../types';
import { getFounderPointsLabel } from "../lib/founderAccess";

interface VouchCircleFeedCardProps {
  post: FeedPost;
  profile?: any;
}

const cardStyleConfigs: any = {
  cyberpunk: {
    bg: 'bg-[#060b15] border-2 border-[#162540] dark:bg-[#060b15]',
    cardBorder: 'border-sky-500/20',
    radialGrad: 'bg-[radial-gradient(circle_at_50%_40%,rgba(14,165,233,0.08),transparent_55%)]',
    cornerLight1: 'bg-cyan-500/10',
    cornerLight2: 'bg-indigo-500/5',
    orbitStroke: 'stroke-sky-500/30',
    orbitDashed: 'border-dashed border-sky-500/20',
    orbitRing: 'border-slate-850/65',
    hubBg: 'bg-[#0c1424] border-2 border-sky-500/30',
    hubGlow: 'bg-[#0ea5e9]/10 group-hover:bg-[#0ea5e9]/25',
    hubVeBg: 'from-sky-600 to-indigo-600 border-sky-450/40',
    hubText: 'text-sky-400',
    nodeBorder: 'border-white/10 group-hover:border-sky-450',
    nodeValueBg: 'bg-[#060b15] border border-sky-450 text-sky-400',
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
    headerSubTitleColor: 'text-amber-605/70',
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
    nodeValueBg: 'bg-[#140507] border border-red-500 text-red-150',
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
    bg: 'bg-white border-2 border-slate-205 dark:bg-white',
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
    headerSubTitleColor: 'text-slate-450',
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
    nodeValueBg: 'bg-[#0f0a1c] border border-fuchsia-400 text-fuchsia-150',
    nodeTagBg: 'bg-[#10061e] border-fuchsia-950/40',
    reasonsBg: 'bg-[#10061e]/85 border border-fuchsia-950/40',
    headerTitleColor: 'text-[#fae8ff]',
    headerSubTitleColor: 'text-purple-650/70',
    brandBadge: 'bg-fuchsia-950/60 border border-fuchsia-900/40 text-fuchsia-450',
    activeLineColor1: '#d946ef',
    activeLineColor2: '#a21caf',
    ambientPingColor: 'bg-fuchsia-400',
    labelText: 'Vapor Flare',
    labelText2: 'Prism Laser',
    footerUrlColor: 'text-fuchsia-450',
    footerPingColor: 'bg-fuchsia-500',
  },
};

export default function VouchCircleFeedCard({ post, profile }: VouchCircleFeedCardProps) {
  const config = post.boardConfig;
  if (!config) return null;

  const [activeSlide, setActiveSlide] = useState(0);
  const [potdIndex] = useState(0);

  const cardStyle = config.cardStyle || 'cyberpunk';
  const activeStyle = cardStyleConfigs[cardStyle] || cardStyleConfigs.cyberpunk;
  const activeCardLayout = config.activeCardLayout || 'orbit';
  const selectedPlayers = config.selectedPlayers || [];

  const showWinRate = config.showWinRate !== false;
  const customWinRate = config.customWinRate || "Record building";
  const showDailyWinRate = config.showDailyWinRate !== false;
  const customDailyWinRate = config.customDailyWinRate || "0 verified picks yet";
  const showMonthlyWinRate = config.showMonthlyWinRate !== false;
  const customMonthlyWinRate = config.customMonthlyWinRate || "Awaiting verified results";
  const showMlbPicks = config.showMlbPicks !== false;
  const customMlbPicks = config.customMlbPicks || "24-3 RUN";
  const showProBadge = config.showProBadge !== false;
  const customProTag = config.customProTag || "VIP GOLD";
  const showCoupon = config.showCoupon !== false;
  const couponCode = config.couponCode || "VOUCH20";
  const couponText = config.couponText || "20% OFF ALL SERVICES";
  const showBestParlay = config.showBestParlay !== false;
  const bestParlayDesc = config.bestParlayDesc || "";
  const showUnitsProfit = config.showUnitsProfit !== false;
  const unitsProfitValue = config.unitsProfitValue || "+42.5 Units";
  const showLogo = config.showLogo !== false;
  const showSecondCard = config.showSecondCard !== false;

  const reasonsText = config.reasonsText || post.content;
  const customCardPhoto = config.customCardPhoto;

  const formattedToday = new Date(post.timestamp || Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const orbitCount = selectedPlayers.length;
  const orbitRadius = 38; // % distance from midpoint

  const calculateOrbitPos = (index: number) => {
    if (orbitCount <= 1) return { x: 50, y: 50 };
    const angle = (index * 2 * Math.PI) / orbitCount - Math.PI / 2;
    const x = 50 + orbitRadius * Math.cos(angle);
    const y = 50 + orbitRadius * Math.sin(angle);
    return { x, y };
  };

  if (post.boardConfig && post.boardConfig.gradient) {
    const bc = post.boardConfig;
    const v = post.vouch || {
      id: 'default',
      vouchSource: 'System Spec',
      userNote: 'Compiled in Java Vouch Custom Studio',
      market: 'Under 1.5 Strikeouts',
      sport: 'MLB',
      playerOrTeam: 'Shohei Ohtani',
      gameName: 'Dodgers vs Giants',
      odds: '+165',
      status: 'PENDING' as const,
      savedCount: 0,
      vouchedCount: 0,
      createdAt: ''
    };
    
    let gradCss = 'from-blue-950 via-slate-950 to-indigo-950';
    if (bc.gradient === 'cyber_gold') gradCss = 'from-amber-950 via-stone-900 to-slate-950';
    if (bc.gradient === 'sunset_laser') gradCss = 'from-rose-950 via-slate-900 to-purple-950';
    if (bc.gradient === 'onyx_carbon') gradCss = 'from-zinc-900 via-stone-950 to-neutral-900';
    if (bc.gradient === 'emerald_stadium') gradCss = 'from-emerald-950 via-slate-955 to-emerald-950';

    return (
      <div className="w-full flex justify-center py-2" id={`custom-compiled-card-feed-${post.id}`}>
        <div 
          className={`rounded-3xl p-5 bg-gradient-to-b ${gradCss} relative overflow-hidden transition-all text-left mx-auto w-full`}
          style={{
            maxWidth: bc.width ? `${Math.min(bc.width, 480)}px` : '440px',
            borderWidth: bc.borderWeight ? `${bc.borderWeight}px` : '2px',
            borderColor: bc.glowColor || '#38bdf8',
            boxShadow: bc.glowStrength ? `0 0 ${bc.glowStrength}px ${bc.glowColor || '#38bdf8'}50` : 'none',
          }}
        >
          {/* Decals & Matrix Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] bg-[size:10px_10px] opacity-65 pointer-events-none" />

          {/* Header */}
          <div className="flex justify-between items-start relative z-10 border-b border-white/[0.06] pb-3">
            <div className="text-left font-mono">
              <span className="text-[8px] tracking-widest text-[#a855f7] font-black uppercase block leading-none">JAVA STUDIO COMPILED</span>
              <span className="text-[12px] font-black tracking-tight text-white block mt-1">🎫 OWNED PRO CARD</span>
            </div>
            <div className="text-right font-mono flex flex-col items-end">
              <span className="text-[8px] tracking-wider text-white/40 uppercase block">MULTIPLE RATIO</span>
              <span className="text-[11px] font-black text-emerald-400 block mt-0.5">EST. MULTIPLIER 2.95x</span>
            </div>
          </div>

          {/* Mid Details */}
          <div className="my-5 space-y-3 relative z-10 text-left font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] bg-obsidian-900 px-2 py-0.5 rounded font-black border border-white/10 text-sky-400 uppercase tracking-widest">
                ⚾ MLB MATCHCHECK
              </span>
              <span className="text-[9px] text-white/40 truncate">{v.gameName}</span>
            </div>

            <div className="py-2.5 px-3 bg-black/45 backdrop-blur-sm rounded-xl border border-slate-850/50 relative">
              <span className="text-[8.5px] uppercase font-bold text-white/40 block mb-0.5">Target Player Selection</span>
              <p className="text-sm font-black tracking-tight text-white leading-tight">{v.playerOrTeam}</p>
              <p className="text-[12px] font-semibold text-white/65 mt-0.5 italic leading-none">{v.market}</p>
              
              {/* Odds */}
              <div className="absolute top-1/2 -translate-y-1/2 right-3 p-1.5 bg-sky-950/45 border border-sky-800 text-emerald-400 font-black text-xs rounded-lg">
                {v.odds}
              </div>
            </div>
          </div>

          {/* Analysis rational note */}
          <div className="text-left font-sans text-[10.5px] leading-relaxed italic bg-black/30 p-3 rounded-xl border border-white/[0.04] relative z-10 text-white/65">
            "{v.userNote}"
          </div>

          {/* Stamp sticker decals */}
          {bc.stickerText && (
            <div 
              className="absolute pointer-events-none z-20 select-none transition-all"
              style={{
                bottom: '10px',
                right: '18px',
                transform: `rotate(${bc.stickerRotation || -8}deg) scale(${bc.stickerScale || 1})`,
                opacity: bc.stickerOpacity || 0.85,
              }}
            >
              <div className="border-[2px] border-dashed border-red-500/70 bg-obsidian-900/95 text-red-400 text-[9px] font-mono font-black py-0.5 px-2.5 rounded shadow-lg uppercase tracking-wider">
                📌 {bc.stickerText}
              </div>
            </div>
          )}

          {/* Certification signature stamp footer */}
          <div className="mt-4 pt-2.5 border-t border-white/[0.04] relative z-10 flex justify-between font-mono text-[8px] text-white/40 uppercase">
            <span>★ JAVA SECURE TICKETING</span>
            <span>@{post.username} · MASTER PRO</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative group/feed-slide shadow-2xl rounded-3xl overflow-hidden mb-4" id={`vouch-circle-feed-slide-${post.id}`}>
      
      {/* CARD 1 (Primary Graphic) */}
      {activeSlide === 0 && (
        <div 
          className={`relative w-full ${activeStyle.bg} rounded-3xl p-5 overflow-hidden flex flex-col justify-between min-h-[460px] animate-fade-in`}
          style={customCardPhoto ? {
            backgroundImage: `linear-gradient(${cardStyle === 'minimal' ? 'rgba(255, 255, 255, 0.88)' : 'rgba(10, 15, 30, 0.85)'}, ${cardStyle === 'minimal' ? 'rgba(255, 255, 255, 0.94)' : 'rgba(10, 15, 30, 0.95)'}), url(${customCardPhoto})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : undefined}
        >
          {/* Decorative gradients */}
          <div className={`absolute inset-0 ${activeStyle.radialGrad} pointer-events-none`} />
          <div className={`absolute top-0 right-0 w-32 h-32 ${activeStyle.cornerLight1} rounded-full blur-3xl pointer-events-none`} />
          <div className={`absolute bottom-0 left-0 w-32 h-32 ${activeStyle.cornerLight2} rounded-full blur-3xl pointer-events-none`} />

          {/* Header segment */}
          <div className={`flex justify-between items-center pb-3 border-b ${cardStyle === 'minimal' ? 'border-slate-205' : 'border-white/[0.08]'} z-10 relative`}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${activeStyle.hubVeBg} flex items-center justify-center text-white font-extrabold text-sm border shadow`}>
                VE
              </div>
              <div className="leading-none text-left">
                <span className={`text-[11px] font-black tracking-widest ${activeStyle.headerTitleColor} uppercase`}>
                  Vouch<span className={cardStyle === 'minimal' ? 'text-slate-900' : 'text-sky-450'}>Edge</span>
                </span>
                <span className={`text-[8px] font-mono font-bold ${activeStyle.headerSubTitleColor} block uppercase mt-0.5`}>
                  CIRCLE STUDIO GRAPHIC
                </span>
              </div>
            </div>

            <div className="text-right flex items-center gap-2">
              <div className="text-right leading-none">
                <span className={`text-[10px] font-extrabold block uppercase ${cardStyle === 'minimal' ? 'text-slate-800' : 'text-white/80'}`}>
                  {post.displayName}
                </span>
                <span className="text-[8.5px] text-sky-400 font-mono tracking-tight block mt-0.5">
                  @{post.username} · {formattedToday}
                </span>
              </div>
              <img 
                src={profile?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"} 
                alt={post.displayName} 
                className="w-7 h-7 rounded-full border border-sky-500/30 object-cover bg-obsidian-900"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          {/* High converting stats ribbon */}
          {(showWinRate || showDailyWinRate || showMonthlyWinRate || showMlbPicks || showProBadge || showUnitsProfit) && (
            <div className="flex flex-wrap gap-1 mt-2.5 justify-start items-center z-10 relative">
              {showProBadge && (
                <span className="text-[7.5px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded bg-fuchsia-500 text-white border border-fuchsia-400">
                  ★ {customProTag}
                </span>
              )}
              {showWinRate && (
                <span className={`text-[7.5px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded ${cardStyle === 'minimal' ? 'bg-sky-100 text-sky-850 border border-sky-200' : 'bg-sky-500/15 border border-sky-500/35 text-sky-450'}`}>
                  🎯 WR: {customWinRate}
                </span>
              )}
              {showDailyWinRate && (
                <span className={`text-[7.5px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded ${cardStyle === 'minimal' ? 'bg-amber-100 text-amber-850 border border-amber-250' : 'bg-amber-500/15 border border-amber-500/35 text-amber-400'}`}>
                  ⚡ DAILY: {customDailyWinRate}
                </span>
              )}
              {showMonthlyWinRate && (
                <span className={`text-[7.5px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded ${cardStyle === 'minimal' ? 'bg-rose-100 text-rose-850 border border-rose-200' : 'bg-rose-500/15 border border-rose-500/35 text-rose-400'}`}>
                  📆 MONTH: {customMonthlyWinRate}
                </span>
              )}
              {showMlbPicks && (
                <span className={`text-[7.5px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded ${cardStyle === 'minimal' ? 'bg-teal-100 text-teal-850 border border-teal-200' : 'bg-teal-500/15 border border-teal-500/35 text-teal-400'}`}>
                  ⚾ PICKS: {customMlbPicks}
                </span>
              )}
              {showUnitsProfit && (
                <span className={`text-[7.5px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded ${cardStyle === 'minimal' ? 'bg-emerald-100 text-emerald-850 border border-emerald-250' : 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-450'}`}>
                  📈 {unitsProfitValue}
                </span>
              )}
            </div>
          )}

          {/* Core content block */}
          {activeCardLayout === 'orbit' ? (
            <div className="w-60 h-60 mx-auto my-3 relative flex items-center justify-center z-10 select-none">
              <div className={`absolute w-[76%] h-[76%] border ${activeStyle.orbitDashed} rounded-full animate-[spin_120s_linear_infinite]`} />
              <div className={`absolute w-[56%] h-[56%] border ${activeStyle.orbitRing} rounded-full animate-[spin_80s_linear_infinite_reverse]`} />

              {/* Central hub */}
              <div className={`absolute z-30 flex flex-col items-center justify-center w-14 h-14 rounded-full ${activeStyle.hubBg} shadow-inner`}>
                {showLogo ? (
                  <div className="flex flex-col items-center justify-center relative">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${activeStyle.hubVeBg} flex items-center justify-center font-extrabold text-white text-xs shadow border`}>
                      VE
                    </div>
                    <span className={`text-[6.5px] ${activeStyle.hubText} font-bold font-mono tracking-widest uppercase mt-0.5`}>VOUCH</span>
                  </div>
                ) : (
                  <div className={`w-3.5 h-3.5 rounded-full ${activeStyle.ambientPingColor} animate-ping`} />
                )}
              </div>

              {/* Orbital nodes mapping */}
              {selectedPlayers.map((ps: any, idx: number) => {
                const { x, y } = calculateOrbitPos(idx);
                return (
                  <div 
                    key={ps.player?.id || idx} 
                    className="absolute flex flex-col items-center group transition-all"
                    style={{ 
                      left: `${x}%`, 
                      top: `${y}%`, 
                      transform: 'translate(-50%, -50%)',
                      zIndex: 25 
                    }}
                  >
                    <div className={`relative p-0.5 ${cardStyle === 'minimal' ? 'bg-white font-semibold' : 'bg-obsidian-900'} rounded-full border-2 ${activeStyle.nodeBorder} transition-colors shadow-lg`}>
                      <img 
                        src={ps.player?.headshot || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50"} 
                        alt={ps.player?.name} 
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                        className="w-10 h-10 rounded-full object-cover bg-black/25"
                      />
                      <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[7.5px] font-extrabold uppercase px-1 py-0.2 rounded-md ${activeStyle.nodeValueBg} border shadow-sm leading-none whitespace-nowrap z-30`}>
                        {ps.customVal || ps.statType}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Player of the Day Spotlight View */
            (() => {
              const ps = selectedPlayers[potdIndex] || selectedPlayers[0];
              if (!ps) return <div className="text-center text-xs text-white/40 select-none py-10">Empty Selection</div>;
              return (
                <div className="my-3 py-3 px-4 rounded-2xl bg-black/25 border border-white/[0.05] flex items-center gap-4 relative z-10 text-left">
                  <img 
                    src={ps.player?.headshot} 
                    alt={ps.player?.name} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-amber-500 bg-obsidian-900 shadow-large"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[8px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase inline-block mb-1">
                      PLAYER OF THE DAY
                    </span>
                    <h3 className={`text-base font-black truncate uppercase ${cardStyle === 'minimal' ? 'text-slate-900' : 'text-white/90'}`}>
                      {ps.player?.name}
                    </h3>
                    <p className="text-[10px] text-sky-400 font-bold font-mono uppercase truncate mt-0.5">
                      {ps.statType}: <span className={cardStyle === 'minimal' ? 'text-slate-900 font-extrabold' : 'text-amber-400 font-extrabold'}>{ps.customVal}</span>
                    </p>
                  </div>
                </div>
              );
            })()
          )}

          {/* Mini reasons index */}
          {config.showReasons !== false && (
            <div className="mt-1 relative z-10 text-left">
              <span className={`text-[8px] font-mono ${cardStyle === 'minimal' ? 'text-white/40' : 'text-white/45'} uppercase font-black block tracking-wider`}>
                VERIFIED SABERMETRICS FORECAST ANALYSIS:
              </span>
              <p className={`text-[9.5px] ${cardStyle === 'minimal' ? 'text-slate-700' : 'text-white/65'} font-medium italic mt-0.5 line-clamp-2`}>
                "{reasonsText}"
              </p>
            </div>
          )}

          {/* Footer of card */}
          <div className={`border-t ${activeStyle.cardBorder} pt-2.5 mt-3 flex justify-between items-center text-[8px] font-mono text-white/40 z-10 relative`}>
            <div>
              <span>WATERMARK ARCHIVE:</span>
              <span className={`${activeStyle.footerUrlColor} ml-1`}>vouchedge.ai/{post.username}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 ${activeStyle.ambientPingColor} rounded-full`}></span>
              <span>{formattedToday} · TRANSPARENT LEDGER</span>
            </div>
          </div>

          {/* Right toggle button (Slide to Card 2) on hover */}
          {showSecondCard && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveSlide(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-obsidian-900/85 hover:bg-black/30 border border-white/10 text-sky-400 rounded-full opacity-0 group-hover/feed-slide:opacity-100 transition-all duration-200 shadow-xl cursor-pointer z-40 flex items-center justify-center hover:scale-105"
              title="Next Slide"
              id={`feed-next-slide-${post.id}`}
            >
              <ChevronRight className="w-5.5 h-5.5" />
            </button>
          )}

          {/* Card 1/2 metadata overlay label */}
          {showSecondCard && (
            <div className="absolute top-14 right-4 bg-obsidian-900/85 rounded-full py-0.5 px-2.5 border border-white/[0.06] text-[8px] font-mono text-white/45 font-bold z-30 shadow flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-450" />
              CARD 1 / 2
            </div>
          )}
        </div>
      )}

      {/* CARD 2 (Analytics Companion) */}
      {activeSlide === 1 && showSecondCard && (
        <div 
          className={`relative w-full ${activeStyle.bg} rounded-3xl p-5 overflow-hidden flex flex-col justify-between min-h-[460px] animate-fade-in`}
          style={customCardPhoto ? {
            backgroundImage: `linear-gradient(${cardStyle === 'minimal' ? 'rgba(255, 255, 255, 0.88)' : 'rgba(10, 15, 30, 0.85)'}, ${cardStyle === 'minimal' ? 'rgba(255, 255, 255, 0.94)' : 'rgba(10, 15, 30, 0.95)'}), url(${customCardPhoto})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : undefined}
        >
          {/* Decorative gradients */}
          <div className={`absolute inset-0 ${activeStyle.radialGrad} pointer-events-none`} />
          <div className={`absolute top-0 right-0 w-32 h-32 ${activeStyle.cornerLight1} rounded-full blur-3xl pointer-events-none`} />
          <div className={`absolute bottom-0 left-0 w-32 h-32 ${activeStyle.cornerLight2} rounded-full blur-3xl pointer-events-none`} />

          {/* Header segment */}
          <div className={`flex justify-between items-center pb-3 border-b ${cardStyle === 'minimal' ? 'border-slate-205' : 'border-white/[0.08]'} z-10 relative`}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${activeStyle.hubVeBg} flex items-center justify-center text-white font-extrabold text-sm border shadow`}>
                VE
              </div>
              <div className="leading-none text-left">
                <span className={`text-[11px] font-black tracking-widest ${activeStyle.headerTitleColor} uppercase`}>
                  Vouch<span className={cardStyle === 'minimal' ? 'text-slate-900' : 'text-sky-450'}>Insight</span>
                </span>
                <span className={`text-[8px] font-mono font-bold ${activeStyle.headerSubTitleColor} block uppercase mt-0.5`}>
                  COMPANION METRICS INDEX
                </span>
              </div>
            </div>

            <div className="text-right flex items-center gap-2">
              <div className="text-right leading-none">
                <span className={`text-[10px] font-extrabold block uppercase ${cardStyle === 'minimal' ? 'text-slate-800' : 'text-white/80'}`}>
                  {post.displayName}
                </span>
                <span className="text-[8.5px] text-sky-400 font-mono tracking-tight block mt-0.5">
                  @{post.username} · {formattedToday}
                </span>
              </div>
              <img 
                src={profile?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"} 
                alt={post.displayName} 
                className="w-7 h-7 rounded-full border border-sky-500/30 object-cover bg-obsidian-900"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          {/* Stats ribbon */}
          {(showWinRate || showDailyWinRate || showMonthlyWinRate || showMlbPicks || showProBadge || showUnitsProfit) && (
            <div className="flex flex-wrap gap-1 mt-2.5 justify-start items-center z-10 relative">
              {showProBadge && (
                <span className="text-[7.5px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded bg-fuchsia-500 text-white border border-fuchsia-400">
                  ★ {customProTag}
                </span>
              )}
              {showWinRate && (
                <span className={`text-[7.5px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded ${cardStyle === 'minimal' ? 'bg-sky-100 text-sky-850 border border-sky-200' : 'bg-sky-500/15 border border-sky-500/35 text-sky-400'}`}>
                  🎯 WR: {customWinRate}
                </span>
              )}
              {showDailyWinRate && (
                <span className={`text-[7.5px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded ${cardStyle === 'minimal' ? 'bg-amber-100 text-amber-850 border border-amber-250' : 'bg-amber-500/15 border border-amber-500/35 text-amber-400'}`}>
                  ⚡ DAILY: {customDailyWinRate}
                </span>
              )}
              {showMonthlyWinRate && (
                <span className={`text-[7.5px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded ${cardStyle === 'minimal' ? 'bg-rose-100 text-rose-850 border border-rose-200' : 'bg-rose-500/15 border border-rose-500/35 text-rose-400'}`}>
                  📆 MONTH: {customMonthlyWinRate}
                </span>
              )}
              {showMlbPicks && (
                <span className={`text-[7.5px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded ${cardStyle === 'minimal' ? 'bg-teal-100 text-teal-850 border border-teal-200' : 'bg-teal-500/15 border border-teal-500/35 text-teal-400'}`}>
                  ⚾ PICKS: {customMlbPicks}
                </span>
              )}
              {showUnitsProfit && (
                <span className={`text-[7.5px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded ${cardStyle === 'minimal' ? 'bg-emerald-100 text-emerald-850 border border-emerald-250' : 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-450'}`}>
                  📈 {unitsProfitValue}
                </span>
              )}
            </div>
          )}

          {/* Central stack of selected players splits / confidence dials */}
          <div className="space-y-2.5 my-3 z-10 relative flex-1 flex flex-col justify-center text-left">
            {activeCardLayout === 'potd' ? (
              (() => {
                const ps = selectedPlayers[potdIndex] || selectedPlayers[0];
                if (!ps) return <div className="text-center text-xs text-white/40 py-10">Empty Selection</div>;
                const aiConf = ps.aiConfidence ?? 94;
                const pConf = ps.playerConfidence ?? 85;
                const explanation = ps.customExplanation || "Extreme velocity projections verify launch coefficients.";
                const player = ps.player || {};

                return (
                  <div className="space-y-2.5">
                    <div className="bg-black/30 p-2.5 rounded-xl border border-white/[0.06] flex items-center gap-2">
                      <img 
                        src={player.headshot} 
                        alt={player.name}
                        className="w-10 h-10 rounded-full object-cover border border-amber-500 bg-obsidian-900"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="leading-tight">
                        <span className={`text-xs font-black uppercase ${cardStyle === 'minimal' ? 'text-slate-900' : 'text-amber-400'}`}>
                          {player.name}
                        </span>
                        <span className="text-[8px] font-mono text-white/40 uppercase block">
                          {player.team} · #{player.number}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                      <div className="bg-black/20 p-2 rounded-lg border border-white/10">
                        <span className="text-white/40 uppercase text-[7.5px] font-black block border-b border-black/30 pb-0.5 mb-1">Splits OPS</span>
                        <div className="grid grid-cols-2 gap-x-1 text-white/65">
                          <div>vsLHP: <span className="font-extrabold text-white">{player.splits?.vLHP?.ops || "----"}</span></div>
                          <div>vsRHP: <span className="font-extrabold text-white">{player.splits?.vRHP?.ops || "----"}</span></div>
                        </div>
                      </div>

                      <div className="bg-black/20 p-2 rounded-lg border border-white/10">
                        <span className="text-white/40 uppercase text-[7.5px] font-black block border-b border-black/30 pb-0.5 mb-1">Statcast Index</span>
                        <div className="grid grid-cols-2 gap-x-1 text-slate-305">
                          <div>EVel: <span className="font-extrabold text-[#38bdf8]">{player.advanced?.exitVelocity || "92.4"}</span></div>
                          <div>HHit: <span className="font-extrabold text-rose-400">{player.advanced?.hardHitPercent ? `${player.advanced.hardHitPercent}%` : "51%"}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Confidence Block */}
                    <div className="grid grid-cols-2 gap-2 font-mono bg-black/15 p-1.5 rounded-lg border border-white/10 text-[9px]">
                      <div className="flex justify-between px-1 border-r border-slate-950">
                        <span className="text-white/40">VAI CONF:</span>
                        <span className="font-extrabold text-sky-400">{aiConf}%</span>
                      </div>
                      <div className="flex justify-between px-1">
                        <span className="text-white/40">STABILITY:</span>
                        <span className="font-extrabold text-amber-500">{pConf}%</span>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              selectedPlayers.map((ps: any, idx: number) => {
                const mockSparkPoints = idx % 3 === 0 ? "5,25 35,5 65,15 95,8" : idx % 3 === 1 ? "5,8 35,28 65,12 95,20" : "5,18 35,15 65,28 95,6";
                const aiConf = ps.aiConfidence ?? (idx % 3 === 0 ? 94 : idx % 3 === 1 ? 91 : 88);
                const pConf = ps.playerConfidence ?? (idx % 3 === 0 ? 88 : idx % 3 === 1 ? 85 : 92);

                return (
                  <div key={ps.player?.id || idx} className={`p-2 rounded-xl border ${activeStyle.nodeTagBg} ${activeStyle.cardBorder} flex flex-col gap-1.5`}>
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <img 
                          src={ps.player?.headshot} 
                          alt={ps.player?.name}
                          className="w-6 h-6 rounded-full object-cover border border-white/10 bg-obsidian-900"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="leading-none text-left">
                          <span className={`text-[10px] font-black block uppercase truncate w-24 ${cardStyle === 'minimal' ? 'text-slate-900' : 'text-slate-205'}`}>
                            {ps.player?.name}
                          </span>
                          <span className="text-[7px] text-white/40 font-mono">
                            {ps.statType}: {ps.customVal}
                          </span>
                        </div>
                      </div>

                      <div className="w-14 h-4 bg-black/15 rounded p-0.5 border border-white/[0.04] flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="0 0 100 30">
                          <polyline fill="none" stroke={activeStyle.activeLineColor1} strokeWidth="1.5" points={mockSparkPoints} />
                          <circle cx="95" cy={mockSparkPoints.split(" ").pop()?.split(",")[1]} r="2" fill={activeStyle.activeLineColor1} />
                        </svg>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[8px] font-mono bg-obsidian-900/40 px-1 py-0.5 rounded leading-none">
                      <div className="flex justify-between pr-1.5 border-r border-white/10">
                        <span className="text-white/40">VAI:</span>
                        <span className="font-bold text-sky-400">{aiConf}%</span>
                      </div>
                      <div className="flex justify-between pl-1.5">
                        <span className="text-white/40">COEF:</span>
                        <span className="font-bold text-amber-500">{pConf}%</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Best Parlay or Coupon section */}
          {showBestParlay && bestParlayDesc && (
            <div className={`mt-1 p-2 rounded-xl border relative overflow-hidden text-left ${cardStyle === 'minimal' ? 'bg-amber-50/60 border-amber-250' : 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30'}`}>
              <span className="text-[7.5px] font-mono uppercase font-black text-white/40 block mb-0.5">
                🔥 RECOMMENDED CORRELATED PARLAY PICK:
              </span>
              <span className={`text-[10px] font-bold block leading-snug truncate ${cardStyle === 'minimal' ? 'text-slate-900' : 'text-amber-300'}`}>
                {bestParlayDesc}
              </span>
            </div>
          )}

          {/* User coupon promo */}
          {showCoupon && (
            <div className={`mt-1 p-1.5 px-2 rounded-xl border flex justify-between items-center text-left ${cardStyle === 'minimal' ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-sky-500/5 border-sky-500/20 text-[#38bdf8]'}`}>
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] leading-none">🎟️</span>
                <div className="leading-none text-left">
                  <span className={`text-[9px] font-black block ${cardStyle === 'minimal' ? 'text-slate-800' : 'text-white/80'}`}>{couponText}</span>
                  <span className="text-[7px] text-sky-430 font-mono uppercase block mt-0.5">USE CODE ON PROFILE SUBSCRIPTION</span>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-sky-450 text-slate-950 rounded font-mono font-black text-[9px] uppercase tracking-wide">
                {couponCode}
              </span>
            </div>
          )}

          {/* Footer segment */}
          <div className={`border-t ${activeStyle.cardBorder} pt-2.5 mt-2.5 flex justify-between items-center text-[8px] font-mono text-white/40 z-10 relative`}>
            <div>
              <span>COMPANION SECURE SEC:</span>
              <span className={`${activeStyle.footerUrlColor} ml-1`}>vouchedge.ai/{post.username}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 ${activeStyle.ambientPingColor} rounded-full`}></span>
              <span>{formattedToday} · SECURE STAKE INDEX</span>
            </div>
          </div>

          {/* Left toggle button (Slide back to Card 1) on hover */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveSlide(0);
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-obsidian-900/85 hover:bg-black/30 border border-white/10 text-sky-400 rounded-full opacity-0 group-hover/feed-slide:opacity-100 transition-all duration-200 shadow-xl cursor-pointer z-40 flex items-center justify-center hover:scale-105"
            title="Previous Slide"
            id={`feed-prev-slide-${post.id}`}
          >
            <ChevronLeft className="w-5.5 h-5.5" />
          </button>

          {/* Card 2/2 metadata overlay label */}
          <div className="absolute top-14 right-4 bg-obsidian-900/85 rounded-full py-0.5 px-2.5 border border-white/[0.06] text-[8px] font-mono text-white/45 font-bold z-30 shadow flex gap-1 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            CARD 2 / 2
          </div>
        </div>
      )}
    </div>
  );
}
