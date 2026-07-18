import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Heart, 
  HelpCircle, 
  Shield, 
  BookmarkCheck, 
  Share2, 
  X, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  Tv, 
  ArrowRight, 
  Info,
  Layers,
  ChevronRight,
  ChevronLeft,
  Download,
} from 'lucide-react';
import { Vouch, FeedPost, MLBPlayer } from '../types';
import { MLB_PLAYER_RECORDS } from '../data/playerData';
import VouchStudioDarkroom from './VouchStudioDarkroom';
import VouchCard from './vouch-system/VouchCard';
import VouchPack from './vouchBoard/VouchPack';
import {
  Z8_ACTIVE,
  Z8_DISPLAY,
  Z8_IDLE,
  Z8_LABEL,
  Z8_PAGE,
  Z8_PAGE_GAP,
  Z8_PAGE_PAD_X,
  Z8_PAGE_PAD_Y,
  Z8_PANEL_PREMIUM,
  Z8_SECTION_HEADER,
  Z8_STAT_CHIP,
  Z8_WARNING,
} from '../theme/z8Tokens';

interface VouchBoardProps {
  savedVouches: Vouch[];
  onRemoveVouch: (vouchId: string) => void;
  onPostCreated?: (postData: Partial<FeedPost>) => void;
  profile?: any;
}

interface CustomPlayerSelection {
  player: MLBPlayer;
  statType: 'Homeruns' | 'Runs' | 'Hits' | 'RBIs' | 'AVG' | 'OPS';
  customVal: string; // editable e.g. "To Hit 1+ HR" or "Over 1.5 Hits"
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
    hubGlow: 'bg-sky-500/10 group-hover:bg-sky-500/25',
    hubVeBg: 'from-vouch-cyan to-vouch-emerald border-[var(--ve-border-strong)]',
    hubText: 'text-sky-400',
    nodeBorder: 'border-[var(--ve-border)] group-hover:border-[var(--ve-border-strong)]',
    nodeValueBg: 'bg-[var(--ve-card)] border border-[var(--ve-border-strong)] text-vouch-cyan',
    nodeTagBg: 'bg-slate-900 border-slate-850',
    reasonsBg: 'bg-slate-900/60 border border-slate-900/80',
    headerTitleColor: 'text-[#cbd5e1]',
    headerSubTitleColor: 'text-[hsl(var(--ve-text-muted))]',
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
    bg: 'bg-ve-obsidian border-2 border-[#332211] dark:bg-ve-obsidian',
    cardBorder: 'border-amber-500/20',
    radialGrad: 'bg-[radial-gradient(circle_at_50%_40%,rgba(217,119,6,0.08),transparent_55%)]',
    cornerLight1: 'bg-amber-500/10',
    cornerLight2: 'bg-yellow-600/5',
    orbitStroke: 'stroke-amber-500/30',
    orbitDashed: 'border-dashed border-amber-500/20',
    orbitRing: 'border-amber-950/40',
    hubBg: 'bg-ve-graphite border-2 border-amber-500/40',
    hubGlow: 'bg-amber-600/10 group-hover:bg-amber-600/25',
    hubVeBg: 'from-amber-600 to-yellow-600 border-amber-450/40',
    hubText: 'text-amber-400',
    nodeBorder: 'border-[#332211] group-hover:border-amber-500',
    nodeValueBg: 'bg-ve-obsidian border border-amber-500 text-amber-400',
    nodeTagBg: 'bg-ve-storm border-amber-950/40',
    reasonsBg: 'bg-ve-storm/85 border border-amber-950/40',
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
    bg: 'bg-ve-obsidian border-2 border-[#450f14] dark:bg-ve-obsidian',
    cardBorder: 'border-red-500/20',
    radialGrad: 'bg-[radial-gradient(circle_at_50%_40%,rgba(239,68,68,0.08),transparent_55%)]',
    cornerLight1: 'bg-red-500/10',
    cornerLight2: 'bg-rose-950/5',
    orbitStroke: 'stroke-red-500/30',
    orbitDashed: 'border-dashed border-red-500/20',
    orbitRing: 'border-red-950/40',
    hubBg: 'bg-ve-graphite border-2 border-red-500/40',
    hubGlow: 'bg-red-500/10 group-hover:bg-red-500/25',
    hubVeBg: 'from-red-600 to-rose-700 border-red-400/40',
    hubText: 'text-red-400',
    nodeBorder: 'border-[#450f14] group-hover:border-red-500',
    nodeValueBg: 'bg-ve-obsidian border border-red-500 text-red-450',
    nodeTagBg: 'bg-ve-storm border-red-950/40',
    reasonsBg: 'bg-ve-storm/85 border border-red-950/40',
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
    nodeBorder: 'border-slate-300 group-hover:border-slate-800',
    nodeValueBg: 'bg-white border border-slate-800 text-slate-900',
    nodeTagBg: 'bg-slate-50 border-slate-250',
    reasonsBg: 'bg-slate-50/90 border border-slate-200',
    headerTitleColor: 'text-slate-800',
    headerSubTitleColor: 'text-[hsl(var(--ve-text-muted))]',
    brandBadge: 'bg-slate-100 border border-slate-200 text-slate-800',
    activeLineColor1: '#1e293b',
    activeLineColor2: '#64748b',
    ambientPingColor: 'bg-slate-900',
    labelText: 'Base Line',
    labelText2: 'Target Index',
    footerUrlColor: 'text-slate-600',
    footerPingColor: 'bg-slate-950',
  },
  hologram: {
    bg: 'bg-ve-obsidian border-2 border-[#2b0e40] dark:bg-ve-obsidian',
    cardBorder: 'border-fuchsia-500/20',
    radialGrad: 'bg-[radial-gradient(circle_at_50%_40%,rgba(217,70,239,0.08),transparent_55%)]',
    cornerLight1: 'bg-fuchsia-500/10',
    cornerLight2: 'bg-purple-950/5',
    orbitStroke: 'stroke-purple-500/30',
    orbitDashed: 'border-dashed border-fuchsia-500/20',
    orbitRing: 'border-purple-950/40',
    hubBg: 'bg-ve-graphite border-2 border-fuchsia-500/40',
    hubGlow: 'bg-fuchsia-500/10 group-hover:bg-fuchsia-500/25',
    hubVeBg: 'from-fuchsia-600 to-purple-700 border-fuchsia-400/40',
    hubText: 'text-fuchsia-400',
    nodeBorder: 'border-[#2b0e40] group-hover:border-fuchsia-500',
    nodeValueBg: 'bg-ve-obsidian border border-fuchsia-400 text-fuchsia-400',
    nodeTagBg: 'bg-ve-graphite border-fuchsia-950/40',
    reasonsBg: 'bg-ve-graphite/85 border border-fuchsia-950/40',
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

export default function VouchBoard({ savedVouches, onRemoveVouch, onPostCreated, profile }: VouchBoardProps) {
  // Sub-tab selection: 'studio' (visualizer studio) vs 'saved' (original saved board)
  const [activeBoardTab, setActiveBoardTab] = useState<'saved' | 'studio'>('studio');
  const [cardStyle, setCardStyle] = useState<'cyberpunk' | 'luxury' | 'crimson' | 'minimal' | 'hologram'>('cyberpunk');
  const [activeCardLayout, setActiveCardLayout] = useState<'orbit' | 'potd' | 'parlay'>('orbit');

  const formattedToday = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const [potdIndex, setPotdIndex] = useState<number>(0);

  // Hook to capture redirected shared parlays
  useEffect(() => {
    const sharedParlayVouchId = localStorage.getItem('vEdge_preview_shared_parlay_vouch_id');
    if (sharedParlayVouchId) {
      setActiveCardLayout('parlay');
      setActiveBoardTab('studio');
    }
  }, [savedVouches]);

  // SELF VOUCH CARDS PROMOTIONAL CONFIG STATES
  const [showWinRate, setShowWinRate] = useState<boolean>(true);
  const [customWinRate, setCustomWinRate] = useState<string>("Record building");
  
  const [showDailyWinRate, setShowDailyWinRate] = useState<boolean>(true);
  const [customDailyWinRate, setCustomDailyWinRate] = useState<string>("0 verified picks yet");
  
  const [showMonthlyWinRate, setShowMonthlyWinRate] = useState<boolean>(true);
  const [customMonthlyWinRate, setCustomMonthlyWinRate] = useState<string>("Awaiting verified results");

  const [showMlbPicks, setShowMlbPicks] = useState<boolean>(true);
  const [customMlbPicks, setCustomMlbPicks] = useState<string>("0-0 · Demo preview");

  const [showProBadge, setShowProBadge] = useState<boolean>(true);
  const [customProTag, setCustomProTag] = useState<string>("VIP GOLD");

  const [showCoupon, setShowCoupon] = useState<boolean>(true);
  const [couponCode, setCouponCode] = useState<string>("VOUCH20");
  const [couponText, setCouponText] = useState<string>("20% OFF ALL SERVICES");

  const [showBestParlay, setShowBestParlay] = useState<boolean>(true);
  const [bestParlayDesc, setBestParlayDesc] = useState<string>("+180 Golden Parlay (Ohtani HR + Betts Run)");

  const [showUnitsProfit, setShowUnitsProfit] = useState<boolean>(true);
  const [unitsProfitValue, setUnitsProfitValue] = useState<string>("Record building");

  const [customCardPhoto, setCustomCardPhoto] = useState<string>(""); // Base64 or Unsplash image URL
  const [customCardPhotoLabel, setCustomCardPhotoLabel] = useState<string>("");

  // CUSTOMIZER STATES
  const [selectedPlayers, setSelectedPlayers] = useState<CustomPlayerSelection[]>([
    { 
      player: MLB_PLAYER_RECORDS[0], // Shohei Ohtani
      statType: 'Homeruns',
      customVal: 'Over 0.5 HRs',
      aiConfidence: 94,
      playerConfidence: 90,
      customExplanation: 'Ohtani enjoys exceptional launch rate with high humidity coefficients tonight.'
    },
    { 
      player: MLB_PLAYER_RECORDS[1], // Aaron Judge
      statType: 'Hits',
      customVal: 'Over 1.5 Hits',
      aiConfidence: 91,
      playerConfidence: 85,
      customExplanation: 'Judge’s high target index velocity coefficients suggest reliable hard-hit contact rates.'
    },
    { 
      player: MLB_PLAYER_RECORDS[2], // Mookie Betts
      statType: 'Runs',
      customVal: 'Over 0.5 Runs',
      aiConfidence: 88,
      playerConfidence: 92,
      customExplanation: 'Betts serves as elite lead-off on base catalyst with high Dodger leverage ratios tonight.'
    }
  ]);

  const [reasonsText, setReasonsText] = useState(
    "Velocity coefficients support launch-angle probability models."
  );
  
  const [showReasons, setShowReasons] = useState<boolean>(false);
  const [previewScale, setPreviewScale] = useState<number>(0.85);
  
  const [showCharts, setShowCharts] = useState<boolean>(true);
  const [showLogo, setShowLogo] = useState<boolean>(true);
  const [showSecondCard, setShowSecondCard] = useState<boolean>(true);
  const [postSideways, setPostSideways] = useState<boolean>(true);
  const [activePreviewCardIndex, setActivePreviewCardIndex] = useState<number>(0);

  // Studio Accordion Section toggles for Lightroom workspace
  const [studioSectionPreset, setStudioSectionPreset] = useState<boolean>(true);
  const [studioSectionRoster, setStudioSectionRoster] = useState<boolean>(true);
  const [studioSectionPromo, setStudioSectionPromo] = useState<boolean>(false);
  const [studioSectionRationale, setStudioSectionRationale] = useState<boolean>(false);

  // Simulation overlays
  const [showTweetModal, setShowTweetModal] = useState<boolean>(false);
  const [tweetContent, setTweetContent] = useState(
    "🎯 Custom Vouch Board Locked In! Powered by high-contrast sabermetrics & velocity calculations. We roll! @VouchEdge #MLBPicks 📈🔥"
  );
  const [isPublishingToFeed, setIsPublishingToFeed] = useState<boolean>(false);
  const [visualToast, setVisualToast] = useState<string | null>(null);

  // Add/Remove Player Helper
  const handleAddPlayerToCircle = (player: MLBPlayer) => {
    if (selectedPlayers.some(p => p.player.id === player.id)) {
      triggerToast(`⚠️ ${player.name} is already active in your circle representation!`);
      return;
    }
    if (selectedPlayers.length >= 5) {
      triggerToast('⚠️ Maximum 5 players can be represented in a single circular Vouch Board!');
      return;
    }

    const defaultProp = player.propositions?.[0];
    const defaultVal = defaultProp ? defaultProp.spec.replace(player.name + " ", "") : "Over 0.5 Hits";

    setSelectedPlayers([
      ...selectedPlayers,
      {
        player,
        statType: 'Hits',
        customVal: defaultVal,
        aiConfidence: 85,
        playerConfidence: 80,
        customExplanation: `Analytical matchup projection suggests high probability output for ${player.name.split(' ').pop()}.`
      }
    ]);
    triggerToast(`Added ${player.name} to the circular display.`);
  };

  const handleRemovePlayerFromCircle = (playerId: string) => {
    if (selectedPlayers.length <= 1) {
      triggerToast('⚠️ You need at least 1 player to generate a circular Vouch layout!');
      return;
    }
    setSelectedPlayers(selectedPlayers.filter(p => p.player.id !== playerId));
  };

  const handleStatTypeChange = (index: number, newStat: CustomPlayerSelection['statType']) => {
    const updated = [...selectedPlayers];
    updated[index].statType = newStat;
    
    // Choose appropriate default text based on type
    const p = updated[index].player;
    if (newStat === 'Homeruns') {
      updated[index].customVal = `Over 0.5 HRs (Season: ${p.seasonStats.hr})`;
    } else if (newStat === 'Runs') {
      updated[index].customVal = `Over 0.5 Runs`;
    } else if (newStat === 'Hits') {
      updated[index].customVal = `Over 1.5 Hits (Season Avg: ${p.seasonStats.avg})`;
    } else if (newStat === 'RBIs') {
      updated[index].customVal = `Over 0.5 RBIs`;
    } else if (newStat === 'AVG') {
      updated[index].customVal = `To Record Hit (.${p.seasonStats.avg.split('.')[1] || '300'} AVG)`;
    } else {
      updated[index].customVal = `1.2+ High Impact OPS`;
    }

    setSelectedPlayers(updated);
  };

  const handleCustomValChange = (index: number, text: string) => {
    const updated = [...selectedPlayers];
    updated[index].customVal = text;
    setSelectedPlayers(updated);
  };

  const triggerToast = (msg: string) => {
    setVisualToast(msg);
    setTimeout(() => {
      setVisualToast(null);
    }, 4000);
  };

  // Circular coordinate calculations for Orbit Card Layout
  const orbitCount = selectedPlayers.length;
  const orbitRadius = 38; // % distance from midpoint
  const activeStyle = cardStyleConfigs[cardStyle];
  const calculateOrbitPos = (index: number) => {
    if (orbitCount <= 1) return { x: 50, y: 50 };
    // Offset by -Math.PI / 2 translates the first node to the top center of the circle
    const angle = (index * 2 * Math.PI) / orbitCount - Math.PI / 2;
    const x = 50 + orbitRadius * Math.cos(angle);
    const y = 50 + orbitRadius * Math.sin(angle);
    return { x, y };
  };

  // POST CONVERTER: Serialize this custom board into a real feed post!
  const handlePublishAsFeedPost = () => {
    if (!onPostCreated) {
      triggerToast('❌ Error: Feed service unavailable in this context.');
      return;
    }

    setIsPublishingToFeed(true);
    
    // Construct rich text representing the customized circle picks
    const serializedPicks = selectedPlayers
      .map(p => `• [${p.player.name} - ${p.player.team.split(' ').pop()}]: ${p.statType} (${p.customVal})`)
      .join('\n');

    const cardDetailsSummary = `🌐 [VouchEdge Circle Stake]\n\n${serializedPicks}\n\n📢 Analysis:\n"${reasonsText}"`;

    // Package as a customized mock file url or serialized parlay
    const activeMediaUrl = customCardPhoto || "https://images.unsplash.com/photo-1540747737956-378724044432?w=800&auto=format&fit=crop&q=80";
    const companionMediaUrl = showSecondCard ? "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80" : undefined;

    setTimeout(() => {
      onPostCreated({
        content: cardDetailsSummary,
        postType: 'VOUCH',
        sportBadge: 'MLB',
        sourceBadge: 'Vouch Circle',
        vouch: {
          id: `vouch-circle-${Date.now()}`,
          vouchSource: 'Vouch Circular Share Studio',
          userNote: reasonsText,
          market: `Custom Circle Vouch (${orbitCount} Players)`,
          sport: 'MLB',
          playerOrTeam: selectedPlayers.map(p => p.player.name).join(', '),
          gameName: 'Combined MLB Board Multi',
          odds: `+${400 + orbitCount * 120}`,
          status: 'PENDING',
          savedCount: 1,
          vouchedCount: 1,
          createdAt: new Date().toISOString()
        },
        boardConfig: {
          cardStyle,
          activeCardLayout,
          selectedPlayers,
          reasonsText,
          customCardPhoto,
          showWinRate,
          customWinRate,
          showDailyWinRate,
          customDailyWinRate,
          showMonthlyWinRate,
          customMonthlyWinRate,
          showMlbPicks,
          customMlbPicks,
          showProBadge,
          customProTag,
          showCoupon,
          couponCode,
          couponText,
          showBestParlay,
          bestParlayDesc,
          showUnitsProfit,
          unitsProfitValue,
          showLogo,
          showSecondCard,
          showReasons
        },
        mediaUrl: activeMediaUrl,
        mediaUrl2: companionMediaUrl,
        showSecondCard: showSecondCard,
        mediaType: 'image'
      });

      setIsPublishingToFeed(false);
      triggerToast("🎉 Successfully published to the local VouchEdge home feed! Your profile's dynamic archive will record this stake.");
      setActiveBoardTab('saved'); // Navigate back to the board
    }, 1200);
  };

  const handleSimulateXPost = () => {
    setShowTweetModal(true);
  };

  const handleConfirmXSubmit = () => {
    setShowTweetModal(false);
    triggerToast("🐦 Simulated Post to @X successful! Real-time watermarked png preview card has been copied back with trackable hashtag coefficients.");
  };

  return (
    <main className={`${Z8_PAGE} ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y} ${Z8_PAGE_GAP} mx-auto max-w-[1380px] min-h-0 min-w-0 overflow-x-hidden ve-safe-bottom pb-28 md:pb-10 ve-page-shell bg-ve-obsidian text-ve-flash`} id="vouch-hub-view">
      
      {/* Toast HUD */}
      {visualToast && (
        <div className={`fixed z-50 ${Z8_PANEL_PREMIUM} px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs font-mono font-bold animate-bounce text-vouch-cyan left-3 right-3 sm:left-auto sm:right-6 bottom-[calc(var(--ve-mobile-chrome-height)+var(--ve-safe-bottom)+0.75rem)] sm:bottom-6 max-w-md sm:max-w-none mx-auto sm:mx-0`}>
          <Sparkles className="w-4 h-4 text-vouch-cyan animate-spin" />
          <span>{visualToast}</span>
        </div>
      )}

      {/* Main header banner — compact on phone so the studio canvas wins the first viewport */}
      <header className={`glass-command ve-premium-panel overflow-hidden rounded-2xl sm:rounded-3xl border border-ve-fuse/50 p-3 sm:p-5 relative shadow-[0_0_40px_rgba(0,229,255,0.07)]`}>
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-vouch-cyan/10 blur-3xl pointer-events-none" />
        <div className={`relative ${Z8_SECTION_HEADER}`}>
          <div className="flex items-center justify-between gap-2">
            <span className={`${Z8_LABEL} inline-flex w-fit items-center gap-2 rounded-full border border-ve-ion/35 bg-ve-ion/10 px-2.5 py-1 text-ve-ion`}>
              <BookmarkCheck className="h-3.5 w-3.5" /> Vouch Board
            </span>
            <p className="hidden text-[11px] text-white/45 sm:block">Share cards → Feed</p>
          </div>
          <h2 className={`${Z8_DISPLAY} mt-1 max-md:hidden`}>
            Vouch Board &amp; Graphic Studio
          </h2>
          <p className="max-w-2xl text-sm text-white/45 max-md:hidden">
            Build bespoke circular player portfolios, customize metrics, toggle sabermeter charts, and generate high-contrast cards for Twitter/X.
          </p>
          <div className="z8-accent-line mt-2 hidden w-full max-w-md sm:block" />
        </div>

        {/* Phone: segmented control. Desktop: rich cards. */}
        <div className="relative mt-3 md:hidden" id="board-tabs-belt-mobile">
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/35 p-1">
            {([
              { id: 'studio', label: 'Studio' },
              { id: 'saved', label: `Feed (${savedVouches.length})` },
            ] as const).map((t) => {
              const active = activeBoardTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveBoardTab(t.id as 'studio' | 'saved')}
                  className={`ve-touch-target rounded-lg px-3 py-2 text-center text-xs font-bold transition-all ${
                    active ? 'bg-vouch-cyan/15 text-vouch-cyan' : 'text-white/55'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative mt-5 hidden grid-cols-1 gap-2 sm:grid-cols-2 md:grid" id="board-tabs-belt">
          {([
            { id: 'studio', emoji: '🎨', label: 'Orbit Studio', sub: 'Design shareable cards' },
            { id: 'saved', emoji: '📋', label: `Feed Board (${savedVouches.length})`, sub: 'Your saved vouches' },
          ] as const).map((t) => {
            const active = activeBoardTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveBoardTab(t.id as 'studio' | 'saved')}
                className={`group relative flex min-h-11 items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all ${
                  active ? Z8_ACTIVE : Z8_IDLE
                }`}
              >
                <span className="text-xl leading-none">{t.emoji}</span>
                <span className="min-w-0">
                  <span className={`block text-sm font-black ${active ? 'text-white' : 'text-white/55'}`}>{t.label}</span>
                  <span className="block text-[11px] text-white/40">{t.sub}</span>
                </span>
                {active && <span className="ml-auto h-2 w-2 flex-shrink-0 rounded-full bg-vouch-cyan opacity-80" />}
              </button>
            );
          })}
        </div>
      </header>


      {/* TAB SUB-VIEW 1: ORBIT STUDIO CARD BUILDER */}
      {activeBoardTab === 'studio' && (
        <VouchStudioDarkroom
          profile={profile}
          savedVouches={savedVouches}
          selectedPlayers={selectedPlayers}
          setSelectedPlayers={setSelectedPlayers}
          cardStyle={cardStyle}
          setCardStyle={setCardStyle}
          activeCardLayout={activeCardLayout}
          setActiveCardLayout={setActiveCardLayout}
          potdIndex={potdIndex}
          setPotdIndex={setPotdIndex}
          customCardPhoto={customCardPhoto}
          setCustomCardPhoto={setCustomCardPhoto}
          customCardPhotoLabel={customCardPhotoLabel}
          setCustomCardPhotoLabel={setCustomCardPhotoLabel}
          showWinRate={showWinRate}
          setShowWinRate={setShowWinRate}
          customWinRate={customWinRate}
          setCustomWinRate={setCustomWinRate}
          showDailyWinRate={showDailyWinRate}
          setShowDailyWinRate={setShowDailyWinRate}
          customDailyWinRate={customDailyWinRate}
          setCustomDailyWinRate={setCustomDailyWinRate}
          showMonthlyWinRate={showMonthlyWinRate}
          setShowMonthlyWinRate={setShowMonthlyWinRate}
          customMonthlyWinRate={customMonthlyWinRate}
          setCustomMonthlyWinRate={setCustomMonthlyWinRate}
          showMlbPicks={showMlbPicks}
          setShowMlbPicks={setShowMlbPicks}
          customMlbPicks={customMlbPicks}
          setCustomMlbPicks={setCustomMlbPicks}
          showProBadge={showProBadge}
          setShowProBadge={setShowProBadge}
          customProTag={customProTag}
          setCustomProTag={setCustomProTag}
          showUnitsProfit={showUnitsProfit}
          setShowUnitsProfit={setShowUnitsProfit}
          unitsProfitValue={unitsProfitValue}
          setUnitsProfitValue={setUnitsProfitValue}
          showBestParlay={showBestParlay}
          setShowBestParlay={setShowBestParlay}
          bestParlayDesc={bestParlayDesc}
          setBestParlayDesc={setBestParlayDesc}
          showCoupon={showCoupon}
          setShowCoupon={setShowCoupon}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          couponText={couponText}
          setCouponText={setCouponText}
          reasonsText={reasonsText}
          setReasonsText={setReasonsText}
          showCharts={showCharts}
          setShowCharts={setShowCharts}
          showLogo={showLogo}
          setShowLogo={setShowLogo}
          showReasons={showReasons}
          setShowReasons={setShowReasons}
          previewScale={previewScale}
          setPreviewScale={setPreviewScale}
          activePreviewCardIndex={activePreviewCardIndex}
          setActivePreviewCardIndex={setActivePreviewCardIndex}
          showSecondCard={showSecondCard}
          setShowSecondCard={setShowSecondCard}
          postSideways={postSideways}
          setPostSideways={setPostSideways}
          isPublishingToFeed={isPublishingToFeed}
          handlePublishAsFeedPost={handlePublishAsFeedPost}
          handleSimulateXPost={handleSimulateXPost}
          triggerToast={triggerToast}
          formattedToday={formattedToday}
          calculateOrbitPos={calculateOrbitPos}
          handleAddPlayerToCircle={handleAddPlayerToCircle}
          handleRemovePlayerFromCircle={handleRemovePlayerFromCircle}
          handleStatTypeChange={handleStatTypeChange}
          handleCustomValChange={handleCustomValChange}
          studioSectionPreset={studioSectionPreset}
          setStudioSectionPreset={setStudioSectionPreset}
          studioSectionRoster={studioSectionRoster}
          setStudioSectionRoster={setStudioSectionRoster}
          studioSectionPromo={studioSectionPromo}
          setStudioSectionPromo={setStudioSectionPromo}
          studioSectionRationale={studioSectionRationale}
          setStudioSectionRationale={setStudioSectionRationale}
        />
      )}

      {/* TAB SUB-VIEW 2: ORIGINAL SAVED VOUCH BOARD CARD LIST */}
      {activeBoardTab === 'saved' && (
        <div className="space-y-4 animate-fade-in" id="vouch-board-saved-ledger">
          
          <div className="p-4 bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.28)] rounded-2xl flex items-start gap-3 shadow-lg shadow-[hsl(var(--ve-shadow)/0.10)]">
            <Info className="w-4.5 h-4.5 text-vouch-amber shrink-0 mt-0.5" />
            <div className="text-xs text-[hsl(var(--ve-text-muted))] leading-relaxed font-semibold">
              <span className="text-vouch-amber font-extrabold uppercase">Feed-Added Micro-Ledger:</span> 
              These are specific single game proposals and handicaps you extracted while reading pages on the community feed. 
              Review the logic, clear settled items, or clone them directly in your active Parlay Lab slips.
            </div>
          </div>

          {savedVouches.length === 0 ? (
            <div 
              className="p-10 text-center bg-[hsl(var(--ve-surface)/0.72)] rounded-3xl border border-[hsl(var(--ve-border)/0.34)] flex flex-col items-center justify-center gap-4 py-20 shadow-xl shadow-[hsl(var(--ve-shadow)/0.16)] backdrop-blur-xl"
              id="empty-vouch-board"
            >
              <ClipboardCheck className="w-12 h-12 text-[hsl(var(--ve-text-muted))] animate-pulse" />
              <div className="text-center space-y-1">
                <h3 className="font-bold text-xs text-[hsl(var(--ve-text-primary))] uppercase font-mono">Your Saved Feed ledger is empty</h3>
                <p className="text-xs text-[hsl(var(--ve-text-muted))] max-w-sm mx-auto leading-relaxed">
                  Head over to the <strong className="text-vouch-cyan">Home Feed</strong> or browse <strong className="text-vouch-cyan">V.A.I Smart Picks</strong>. 
                  Clicking "Save to Board" will harvest those game props, placing them in this secured ledger block!
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <VouchPack vouches={savedVouches} />
              <div className="grid grid-cols-1 gap-6" id="vouch-board-grid">
              {savedVouches.map((v) => (
                <VouchCard 
                  key={v.id}
                  vouch={v}
                  isSaved={true}
                  onSaveVouch={() => onRemoveVouch(v.id)}
                  profile={{
                    displayName: profile?.displayName || 'Alpha Capper',
                    username: profile?.username || 'alphacapper',
                    trustScore: profile?.trustScore || 845,
                    subscriptionTier: profile?.subscriptionTier || 'BASIC',
                    verified: profile?.verified || false
                  }}
                  onPostCreated={onPostCreated}
                />
              ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SIMULATED TWITTER / X POSTING MODAL HUD OVERLAY */}
      {showTweetModal && (
        <div className="fixed inset-0 bg-[hsl(var(--ve-bg-deep)/0.86)] backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[hsl(var(--ve-surface)/0.92)] border border-[hsl(var(--ve-border)/0.36)] rounded-3xl max-w-[500px] w-full p-5 space-y-4.5 animate-zoom-in relative shadow-2xl shadow-[hsl(var(--ve-shadow)/0.28)] backdrop-blur-xl">
            <button 
              onClick={() => setShowTweetModal(false)}
              className="absolute top-4 right-4 text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text-primary))] p-1 rounded-full bg-[hsl(var(--ve-surface-raised)/0.44)] border border-[hsl(var(--ve-border)/0.28)]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xl">🐦</span>
              <h3 className="font-bold text-[hsl(var(--ve-text-primary))] uppercase tracking-widest text-sm font-mono">
                Simulated Twitter / X Publisher HUD
              </h3>
            </div>

            <div className="space-y-3 bg-[hsl(var(--ve-surface-raised)/0.34)] p-4 rounded-xl border border-[hsl(var(--ve-border)/0.28)]">
              <div className="flex items-start gap-2.5 text-xs text-[hsl(var(--ve-text-muted))] leading-normal">
                <div className="w-8 h-8 rounded-full bg-[hsl(var(--ve-surface-raised)/0.56)] font-bold text-vouch-cyan flex items-center justify-center text-xs border border-vouch-cyan/30 shrink-0">
                  ZH
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[hsl(var(--ve-text-primary))]">@Zhavior</span>
                    <span className="text-[hsl(var(--ve-text-muted))]">• now</span>
                  </div>
                  
                  {/* Tweet message body edit field */}
                  <textarea
                    value={tweetContent}
                    onChange={(e) => setTweetContent(e.target.value)}
                    rows={3}
                    className="w-full text-xs bg-transparent border-none text-[hsl(var(--ve-text-primary))] placeholder:text-[hsl(var(--ve-text-muted))] outline-none resize-none pt-1"
                    placeholder="What's happening on the edge..."
                  />

                  {/* Attachment card thumbnail representation inside tweet body */}
                  <div className="bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.28)] rounded-2xl p-3 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-[hsl(var(--ve-surface-raised)/0.52)] border border-[hsl(var(--ve-border)/0.30)] flex items-center justify-center font-bold text-[8px] text-vouch-cyan relative overflow-hidden flex-shrink-0">
                      {/* Miniature representation */}
                      <div className="absolute w-8 h-8 border border-dashed border-vouch-cyan/15 rounded-full animate-spin" />
                      <span className="text-vouch-cyan font-black">VE</span>
                    </div>

                    <div className="min-w-0 flex-1 leading-normal">
                      <h4 className="text-[10px] uppercase font-bold text-[hsl(var(--ve-text-primary))] truncate">
                        Custom Circular Vouch ({orbitCount} Players Portfolio)
                      </h4>
                      <p className="text-[8.5px] text-[hsl(var(--ve-text-muted))] truncate mt-0.5">
                        {reasonsText}
                      </p>
                      <span className="text-[8px] text-emerald-400 font-mono font-bold block mt-1 uppercase">
                        ✓ Watermarked: vouchedge.ai/Zhavior
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-[hsl(var(--ve-text-muted))] leading-snug">
              Note: This is a simulated preview utilizing the preview container coordinate matrix. Authentic links will copy code tags securely back.
            </p>

            <div className="flex gap-2 text-xs font-mono font-bold">
              <button
                type="button"
                onClick={() => setShowTweetModal(false)}
                className="flex-1 py-2 px-3 bg-[hsl(var(--ve-surface-raised)/0.42)] hover:bg-[hsl(var(--ve-surface-raised)/0.62)] border border-[hsl(var(--ve-border)/0.28)] rounded-xl text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text-primary))]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmXSubmit}
                className="flex-1 py-2 px-3 bg-vouch-cyan hover:brightness-110 text-[hsl(var(--ve-bg-deep))] rounded-xl text-center shadow-lg shadow-vouch-cyan/20"
              >
                Publish Simulation ✓
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
