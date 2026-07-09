import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Trash2, 
  Heart, 
  HelpCircle, 
  Shield, 
  BookmarkCheck, 
  Share2, 
  Plus, 
  X, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  Activity, 
  Tv, 
  ArrowRight, 
  Info,
  Layers,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  SlidersHorizontal,
  Download,
  AlertCircle,
  Award,
  Crown,
  Flame
} from 'lucide-react';
import { Vouch, FeedPost, MLBPlayer } from '../types';
import { MLB_PLAYER_RECORDS } from '../data/playerData';
import VouchStudioDarkroom from './VouchStudioDarkroom';
import VouchCard from './vouch-system/VouchCard';
import VouchPack from './vouchBoard/VouchPack';
import { VEWidget } from './ui/ve';
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
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend as RechartsLegend, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  BarChart as RechartsBarChart,
  Bar
} from 'recharts';

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
  // Sub-tab selection: 'portfolio' (advanced analytics) vs 'studio' (visualizer studio) vs 'saved' (original saved board)
  const [activeBoardTab, setActiveBoardTab] = useState<'saved' | 'studio' | 'portfolio'>('portfolio');
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

  // PORTFOLIO SIMULATION & BACKTEST STATES
  const [simulationStakeUnit, setSimulationStakeUnit] = useState<number>(100);
  const [portfolioRiskFilter, setPortfolioRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [historicalTimeframe, setHistoricalTimeframe] = useState<'7d' | '14d' | '30d'>('14d');
  const [simulatedWinRate, setSimulatedWinRate] = useState<number>(0);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditLog, setAuditLog] = useState<string[]>([]);

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

  // Helper values to draw game log graphs
  const allGameLogs = selectedPlayers.map(p => p.player.gameLogs).flat();
  
  const getPortfolioChartData = () => {
    const pointsCount = historicalTimeframe === '7d' ? 7 : historicalTimeframe === '14d' ? 14 : 30;
    const data = [];
    let cumulativeReturn = 0;
    
    const averageConfidence = selectedPlayers.length > 0 
      ? selectedPlayers.reduce((acc, p) => acc + (p.aiConfidence || 85), 0) / selectedPlayers.length
      : 85;

    const multiplier = (simulatedWinRate / 75) * (simulationStakeUnit / 100);
    
    for (let i = pointsCount; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const noise = Math.sin(i * 0.8) * 1.5 + Math.cos(i * 0.3) * 0.5;
      const dailyReturn = (averageConfidence / 15 - 4.5 + noise) * multiplier;
      cumulativeReturn += dailyReturn;
      
      data.push({
        date: dateStr,
        units: parseFloat(cumulativeReturn.toFixed(1)),
        cashValue: Math.round(cumulativeReturn * 100 * (simulationStakeUnit / 100)),
        aiProjected: Math.round((cumulativeReturn * 1.08 + Math.sin(i * 0.5)) * 100 * (simulationStakeUnit / 100)),
      });
    }
    return data;
  };

  const handleStartAuditSimulation = () => {
    setIsAuditing(true);
    setAuditLog([]);
    
    const logs = [
      `[${new Date().toLocaleTimeString()}] 🚀 INITIALIZING VOUCH EDGE AUDIT MATRIX V3.2...`,
      `[${new Date().toLocaleTimeString()}] 📡 Syncing with Sabermetrics Data Engine...`,
      `[${new Date().toLocaleTimeString()}] 📥 Fetching historic splits for active roster (${selectedPlayers.map(p=>p.player.name.split(' ').pop()).join(', ')})...`,
      `[${new Date().toLocaleTimeString()}] 📈 Adjusting stake allocation coefficient at $${simulationStakeUnit} per unit...`,
      `[${new Date().toLocaleTimeString()}] ⚡ Testing risk factor category: "${portfolioRiskFilter.toUpperCase()}"`,
      `[${new Date().toLocaleTimeString()}] 📊 Simulation only — not verified performance.`,
      `[${new Date().toLocaleTimeString()}] ⚠️ Simulation only — not verified performance. No guaranteed outcomes.`,
      `[${new Date().toLocaleTimeString()}] 📋 Demo preview — no real profit/units tracked yet.`
    ];

    logs.forEach((logLine, idx) => {
      setTimeout(() => {
        setAuditLog(prev => [...prev, logLine]);
        if (idx === logs.length - 1) {
          setIsAuditing(false);
          triggerToast("🏆 Capper Ledger Audit Complete! Real-time performance watermarked successfully.");
        }
      }, (idx + 1) * 350);
    });
  };
  
  return (
    <main className={`${Z8_PAGE} ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y} ${Z8_PAGE_GAP} mx-auto max-w-[1380px] min-h-screen`} id="vouch-hub-view">
      
      {/* Toast HUD */}
      {visualToast && (
        <div className={`fixed bottom-6 right-6 z-50 ${Z8_PANEL_PREMIUM} px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs font-mono font-bold animate-bounce text-vouch-cyan`}>
          <Sparkles className="w-4 h-4 text-vouch-cyan animate-spin" />
          <span>{visualToast}</span>
        </div>
      )}

      {/* Main header banner */}
      <header className={`${Z8_PANEL_PREMIUM} overflow-hidden rounded-3xl p-5 relative`}>
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-vouch-cyan/10 blur-3xl pointer-events-none" />
        <div className={`relative ${Z8_SECTION_HEADER}`}>
          <span className={`${Z8_LABEL} inline-flex w-fit items-center gap-2 rounded-full border border-vouch-cyan/30 bg-vouch-cyan/10 px-3 py-1 text-vouch-cyan`}>
            <BookmarkCheck className="h-3.5 w-3.5" /> Vouch Workspace
          </span>
          <h2 className={`${Z8_DISPLAY} mt-1`}>
            Vouch Board &amp; Graphic Studio
          </h2>
          <p className="max-w-2xl text-sm text-white/45">
            Build bespoke circular player portfolios, customize metrics, toggle sabermeter charts, and generate high-contrast cards for Twitter/X.
          </p>
          <div className="z8-accent-line mt-3 w-full max-w-md" />
        </div>

        {/* Prominent full-width section switcher (was a small corner pill) */}
        <div className="relative mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3" id="board-tabs-belt">
          {([
            { id: 'portfolio', emoji: '📊', label: 'Portfolio Analytics', sub: 'Risk + variance dashboard' },
            { id: 'studio', emoji: '🎨', label: 'Orbit Studio', sub: 'Design shareable cards' },
            { id: 'saved', emoji: '📋', label: `Feed Board (${savedVouches.length})`, sub: 'Your saved vouches' },
          ] as const).map((t) => {
            const active = activeBoardTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveBoardTab(t.id as 'portfolio' | 'studio' | 'saved')}
                className={`group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all ${
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

      {/* TAB SUB-VIEW 0: PORTFOLIO ANALYTICS DASHBOARD */}
      {activeBoardTab === 'portfolio' && (
        <div className="space-y-6 animate-fade-in" id="vouch-portfolio-analytics">

          {/* Honesty banner — all metrics below are driven by the sliders in this tab, not real trading results */}
          <div className="rounded-2xl border border-amber-300/10 bg-amber-400/5 px-4 py-2.5 flex items-center gap-2.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-amber-300">
              Simulated backtest — not verified performance. Numbers reflect the sliders below, not real results.
            </span>
          </div>

          {/* Real-time Dynamic Metrics Header Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Metric 1: Cumulative Return */}
            <div className="bg-[hsl(var(--ve-surface)/0.72)] border border-emerald-300/20 p-4.5 rounded-2xl relative overflow-hidden shadow-lg shadow-[hsl(var(--ve-shadow)/0.12)] group hover:border-emerald-300/35 transition-all duration-300 backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[hsl(var(--ve-text-muted))] uppercase tracking-wider block font-mono">Simulated Return (Demo)</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                    +${Math.round((selectedPlayers.length * 4.2 * simulationStakeUnit) * (simulatedWinRate / 75)).toLocaleString()}
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-500/80 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +{parseFloat((selectedPlayers.length * 4.2 * (simulatedWinRate / 75)).toFixed(1))} Simulated Units (Demo)
                  </span>
                </div>
                <div className="p-2 bg-emerald-950/40 rounded-xl border border-emerald-900/40">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Metric 2: Assumed Accuracy (Simulation) */}
            <div className="bg-[hsl(var(--ve-surface)/0.72)] border border-vouch-amber/25 p-4.5 rounded-2xl relative overflow-hidden shadow-lg shadow-[hsl(var(--ve-shadow)/0.12)] group hover:border-vouch-amber/40 transition-all duration-300 backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-vouch-amber/10 rounded-full blur-2xl group-hover:bg-vouch-amber/15 transition-colors" />
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[hsl(var(--ve-text-muted))] uppercase tracking-wider block font-mono">Assumed Accuracy (Demo)</span>
                  <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                    {simulatedWinRate}%
                  </div>
                  <div className="w-24 bg-[hsl(var(--ve-surface-raised)/0.58)] h-1 rounded-full overflow-hidden mt-1.5">
                    <div 
                      className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${simulatedWinRate}%` }} 
                    />
                  </div>
                  <span className="text-[9px] text-[hsl(var(--ve-text-muted))] font-semibold block mt-1">
                    Adjust accuracy with slider below
                  </span>
                </div>
                <div className="p-2 bg-vouch-amber/10 rounded-xl border border-vouch-amber/30">
                  <Award className="w-4 h-4 text-vouch-amber" />
                </div>
              </div>
            </div>

            {/* Metric 3: Active Circle Exposure */}
            <div className="bg-[hsl(var(--ve-surface)/0.72)] border border-vouch-emerald/25 p-4.5 rounded-2xl relative overflow-hidden shadow-lg shadow-[hsl(var(--ve-shadow)/0.12)] group hover:border-vouch-emerald/40 transition-all duration-300 backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[hsl(var(--ve-text-muted))] uppercase tracking-wider block font-mono">Portfolio Roster</span>
                  <div className="text-2xl font-black text-vouch-emerald tracking-tight">
                    {selectedPlayers.length} Active Stars
                  </div>
                  <span className="text-[10px] font-semibold text-[hsl(var(--ve-text-secondary))] truncate block max-w-[170px] mt-1.5 font-mono">
                    {selectedPlayers.map(p => p.player.name.split(' ').pop()).join(' • ')}
                  </span>
                </div>
                <div className="p-2 bg-vouch-emerald/10 rounded-xl border border-vouch-emerald/30">
                  <Flame className="w-4 h-4 text-vouch-emerald" />
                </div>
              </div>
            </div>

            {/* Metric 4: Sharpe Ratio / ROI */}
            <div className="bg-[hsl(var(--ve-surface)/0.72)] border border-vouch-emerald/25 p-4.5 rounded-2xl relative overflow-hidden shadow-lg shadow-[hsl(var(--ve-shadow)/0.12)] group hover:border-vouch-emerald/40 transition-all duration-300 backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-vouch-emerald/10 rounded-full blur-2xl group-hover:bg-vouch-emerald/15 transition-colors" />
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[hsl(var(--ve-text-muted))] uppercase tracking-wider block font-mono">Efficiency Index (Demo)</span>
                  <div className="text-2xl font-black text-purple-400 font-mono tracking-tight">
                    +14.25% ROI
                  </div>
                  <span className="text-[10px] text-[hsl(var(--ve-text-muted))] font-semibold flex items-center gap-1 mt-1 font-mono">
                    <Activity className="w-3 h-3 text-vouch-emerald" />
                    Sharpe: 2.84 • Simulated, not verified
                  </span>
                </div>
                <div className="p-2 bg-vouch-emerald/10 rounded-xl border border-vouch-emerald/30">
                  <Activity className="w-4 h-4 text-vouch-emerald" />
                </div>
              </div>
            </div>

          </div>

          {/* Main Analytics Content Workspace Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT SECTION: CHART & INTERACTIVE SIMULATION LAB */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Performance Return Curve Card */}
              <VEWidget className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[hsl(var(--ve-text-primary))] uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Backtested Cumulative Performance Curve
                    </h3>
                    <p className="text-[10px] text-[hsl(var(--ve-text-muted))] mt-0.5">
                      Cumulative ROI return modeled over designated Sabermetric historic logs ($ {simulationStakeUnit} Unit standard).
                    </p>
                  </div>

                  {/* Timeframe selector controls */}
                  <div className="flex bg-[hsl(var(--ve-surface-raised)/0.42)] p-1 rounded-lg border border-[hsl(var(--ve-border)/0.28)] text-[10px] font-bold font-mono">
                    {(['7d', '14d', '30d'] as const).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setHistoricalTimeframe(tf)}
                        className={`px-2.5 py-1 rounded transition-all ${
                          historicalTimeframe === tf
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/60'
                            : 'text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text-secondary))]'
                        }`}
                      >
                        {tf.toUpperCase()} Window
                      </button>
                    ))}
                  </div>
                </div>

                {/* Glowing area chart wrapper */}
                <div className="h-[280px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={getPortfolioChartData()} 
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#161f30" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#475569" 
                        fontSize={9} 
                        fontWeight="bold"
                        tickLine={false} 
                      />
                      <YAxis 
                        stroke="#475569" 
                        fontSize={9} 
                        fontWeight="bold"
                        tickLine={false}
                        tickFormatter={(v) => `$${v.toLocaleString()}`} 
                      />
                      <RechartsTooltip
                        contentStyle={{ 
                          backgroundColor: '#0c1322', 
                          borderColor: '#1e293b', 
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                        }}
                        labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '10px' }}
                        itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                      />
                      <RechartsLegend 
                        verticalAlign="top" 
                        height={36} 
                        iconType="circle"
                        iconSize={6}
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} 
                      />
                      <Area 
                        name="Simulated Backtest Profit ($)" 
                        type="monotone" 
                        dataKey="cashValue" 
                        stroke="#10b981" 
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#colorProfit)" 
                        activeDot={{ r: 6 }} 
                      />
                      <Area 
                        name="AI Optimized Path Model ($)" 
                        type="monotone" 
                        dataKey="aiProjected" 
                        stroke="#6366f1" 
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        fillOpacity={1} 
                        fill="url(#colorProjected)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </VEWidget>

              {/* Backtester Controls & Console HUD */}
              <VEWidget className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[hsl(var(--ve-text-primary))] uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-vouch-cyan" />
                    VouchEdge Monte Carlo Roster Backtester (Simulation only — not verified performance)
                  </h3>
                  <p className="text-[10px] text-[hsl(var(--ve-text-muted))] mt-0.5">
                    Tweak your model accuracy, update bankroll unit sizing, and trigger simulated deep audits.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 bg-[hsl(var(--ve-surface-raised)/0.34)] rounded-2xl border border-[hsl(var(--ve-border)/0.28)]">
                  
                  {/* Slider 1: Simulated Win Rate */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-[hsl(var(--ve-text-muted))] uppercase font-mono">Assumed Accuracy</span>
                      <span className="font-black text-vouch-amber font-mono text-xs">{simulatedWinRate}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="99" 
                      value={simulatedWinRate} 
                      onChange={(e) => setSimulatedWinRate(parseInt(e.target.value))}
                      className="w-full h-1 bg-[hsl(var(--ve-surface-raised)/0.62)] rounded-lg appearance-none cursor-pointer accent-vouch-amber"
                    />
                    <p className="text-[8.5px] text-[hsl(var(--ve-text-muted))] font-semibold leading-snug">
                      Adjust based on historical hit rate threshold.
                    </p>
                  </div>

                  {/* Slider 2: Sizing per Unit */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-[hsl(var(--ve-text-muted))] uppercase font-mono">Stake per Unit</span>
                      <span className="font-black text-emerald-300 font-mono text-xs">${simulationStakeUnit}</span>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="1000" 
                      step="50"
                      value={simulationStakeUnit} 
                      onChange={(e) => setSimulationStakeUnit(parseInt(e.target.value))}
                      className="w-full h-1 bg-[hsl(var(--ve-surface-raised)/0.62)] rounded-lg appearance-none cursor-pointer accent-emerald-300"
                    />
                    <p className="text-[8.5px] text-[hsl(var(--ve-text-muted))] font-semibold leading-snug">
                      Modulates total capital output per pick.
                    </p>
                  </div>

                  {/* Risk Profile Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[hsl(var(--ve-text-muted))] uppercase font-mono block">Risk Profile Bias</label>
                    <select
                      value={portfolioRiskFilter}
                      onChange={(e) => setPortfolioRiskFilter(e.target.value as any)}
                      className="w-full text-xs font-semibold bg-[hsl(var(--ve-surface-raised)/0.44)] border border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-text-secondary))] p-2 rounded-xl outline-none focus:border-vouch-cyan/55"
                    >
                      <option value="all">⚡ Balanced (All Exposures)</option>
                      <option value="high">🔥 Aggressive (High Variance Only)</option>
                      <option value="medium">⚖️ Conservative (Medium Leverage)</option>
                      <option value="low">🛡️ Safe-Haven (Low Risk Thresholds)</option>
                    </select>
                  </div>

                </div>

                {/* Audit trigger & Console outputs */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2.5">
                    <button
                      onClick={handleStartAuditSimulation}
                      disabled={isAuditing}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all ${
                        isAuditing 
                          ? 'bg-slate-900 text-[hsl(var(--ve-text-muted))] border border-slate-800 cursor-not-allowed'
                          : 'bg-[#10b981] hover:bg-[#059669] text-white shadow-lg shadow-emerald-500/10 border border-emerald-400/20 active:scale-[0.98]'
                      }`}
                    >
                      <Activity className={`w-4 h-4 ${isAuditing ? 'animate-spin text-[hsl(var(--ve-text-muted))]' : 'text-[hsl(var(--ve-bg-deep))]'}`} />
                      <span>{isAuditing ? '🧠 CALCULATING PROJECTIONS & SPLITS...' : '⚡ EXECUTE DEEP PORTFOLIO BACKTEST AUDIT'}</span>
                    </button>
                  </div>

                  {/* Terminal Logs block */}
                  <div className="relative">
                    <div className="absolute top-2 right-3 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[8px] text-[hsl(var(--ve-text-muted))] font-bold uppercase tracking-widest font-mono">Terminal Console</span>
                    </div>
                    <div className="font-mono text-[10px] text-[hsl(var(--ve-text-muted))] p-4 bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.28)] rounded-2xl min-h-[140px] max-h-[220px] overflow-y-auto space-y-1.5 leading-relaxed shadow-inner">
                      {auditLog.length === 0 ? (
                        <div className="text-[hsl(var(--ve-text-muted)/0.72)] italic py-6 text-center select-none">
                          // Terminal offline. Click "EXECUTE DEEP PORTFOLIO BACKTEST AUDIT" to populate live simulation audits...
                        </div>
                      ) : (
                        auditLog.map((log, idx) => (
                          <div 
                            key={idx} 
                            className={`animate-fade-in ${
                              log.includes('✓') || log.includes('🏆') ? 'text-emerald-400 font-bold' : log.includes('⚡') ? 'text-cyan-400' : 'text-[hsl(var(--ve-text-muted))]'
                            }`}
                          >
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </VEWidget>

            </div>

            {/* RIGHT SECTION: ACTIVE ROSTER CONFIGURATOR & CANDIDATES */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Active Portfolio Roster List */}
              <div className="bg-[hsl(var(--ve-surface)/0.74)] border border-[hsl(var(--ve-border)/0.34)] rounded-3xl p-5 space-y-4 shadow-xl shadow-[hsl(var(--ve-shadow)/0.16)] backdrop-blur-xl">
                <div>
                  <h3 className="text-sm font-bold text-[hsl(var(--ve-text-primary))] uppercase tracking-wider flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-vouch-amber" />
                    Active Circle Roster ({selectedPlayers.length})
                  </h3>
                  <p className="text-[10px] text-[hsl(var(--ve-text-muted))] mt-0.5">
                    Represented stars currently in the custom circular Orbit layout. Modify sliders to re-calculate risk weightings.
                  </p>
                </div>

                <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                  {selectedPlayers.map((ps, idx) => (
                    <div 
                      key={ps.player.id} 
                      className="p-3 bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.28)] hover:border-vouch-cyan/35 transition-all rounded-2xl space-y-3 relative group shadow-lg shadow-[hsl(var(--ve-shadow)/0.10)]"
                    >
                      <button 
                        onClick={() => handleRemovePlayerFromCircle(ps.player.id)}
                        className="absolute top-3 right-3 text-[hsl(var(--ve-text-muted))] hover:text-red-300 p-1 bg-[hsl(var(--ve-surface-raised)/0.44)] hover:bg-[hsl(var(--ve-surface-raised)/0.62)] border border-[hsl(var(--ve-border)/0.28)] rounded-lg transition-colors"
                        title="Remove player"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Header info */}
                      <div className="flex items-center gap-3">
                        <img 
                          src={ps.player.headshot || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120"} 
                          alt={ps.player.name}
                          className="w-10 h-10 rounded-full object-cover border border-[hsl(var(--ve-border)/0.34)] shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1 leading-tight">
                          <h4 className="font-bold text-[hsl(var(--ve-text-primary))] text-xs truncate">{ps.player.name}</h4>
                          <p className="text-[9px] text-[hsl(var(--ve-text-muted))] uppercase font-bold font-mono">
                            {ps.player.team} • {ps.player.position}
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-vouch-cyan/10 border border-vouch-cyan/30 text-vouch-cyan text-[8px] font-black rounded-md font-mono uppercase">
                            {ps.customVal}
                          </span>
                        </div>
                      </div>

                      {/* Configurable Sliders for real-time model adjusting */}
                      <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-[hsl(var(--ve-border)/0.26)] text-[9px]">
                        
                        {/* Slider A: AI confidence */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[hsl(var(--ve-text-muted))] uppercase font-mono">Assumed AI Conf</span>
                            <span className="font-black text-vouch-emerald font-mono">{ps.aiConfidence || 85}%</span>
                          </div>
                          <input 
                            type="range"
                            min="50"
                            max="99"
                            value={ps.aiConfidence || 85}
                            onChange={(e) => {
                              const updated = [...selectedPlayers];
                              updated[idx].aiConfidence = parseInt(e.target.value);
                              setSelectedPlayers(updated);
                            }}
                            className="w-full h-1 bg-[hsl(var(--ve-surface-raised)/0.62)] rounded appearance-none cursor-pointer accent-vouch-emerald"
                          />
                        </div>

                        {/* Slider B: Personal confidence */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[hsl(var(--ve-text-muted))] uppercase font-mono">Your Conf</span>
                            <span className="font-black text-vouch-cyan font-mono">{ps.playerConfidence || 80}%</span>
                          </div>
                          <input 
                            type="range"
                            min="50"
                            max="99"
                            value={ps.playerConfidence || 80}
                            onChange={(e) => {
                              const updated = [...selectedPlayers];
                              updated[idx].playerConfidence = parseInt(e.target.value);
                              setSelectedPlayers(updated);
                            }}
                            className="w-full h-1 bg-[hsl(var(--ve-surface-raised)/0.62)] rounded appearance-none cursor-pointer accent-vouch-cyan"
                          />
                        </div>

                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-[hsl(var(--ve-text-muted))] text-center font-semibold pt-1">
                  💡 Tips: Drag sliders to modulate the Simulated performance graph & backtest in real time!
                </div>
              </div>

              {/* Prospect Roster candidate list */}
              <div className="bg-[hsl(var(--ve-surface)/0.74)] border border-[hsl(var(--ve-border)/0.34)] rounded-3xl p-5 space-y-4 shadow-xl shadow-[hsl(var(--ve-shadow)/0.16)] backdrop-blur-xl">
                <div>
                  <h3 className="text-sm font-bold text-[hsl(var(--ve-text-primary))] uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-emerald-300" />
                    Sabermetric Star Candidates
                  </h3>
                  <p className="text-[10px] text-[hsl(var(--ve-text-muted))] mt-0.5">
                    Add rest-advantaged players to your active portfolio layout with high historical variance coefficients.
                  </p>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {MLB_PLAYER_RECORDS.filter(p => !selectedPlayers.some(sp => sp.player.id === p.id)).map(p => (
                    <div 
                      key={p.id}
                      className="p-2.5 bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.28)] hover:border-vouch-cyan/35 transition-all rounded-2xl flex items-center justify-between gap-3 group shadow-lg shadow-[hsl(var(--ve-shadow)/0.10)]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img 
                          src={p.headshot || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120"} 
                          alt={p.name}
                          className="w-8.5 h-8.5 rounded-full object-cover border border-[hsl(var(--ve-border)/0.34)] shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 leading-tight">
                          <h4 className="font-bold text-[hsl(var(--ve-text-primary))] text-xs truncate">{p.name}</h4>
                          <p className="text-[8px] text-[hsl(var(--ve-text-muted))] uppercase font-bold font-mono">
                            {p.team} • {p.position} • HR: {p.seasonStats.hr}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddPlayerToCircle(p)}
                        className="py-1 px-2.5 bg-emerald-400/10 hover:bg-emerald-400/16 border border-emerald-300/25 text-emerald-300 hover:text-emerald-200 font-mono text-[9px] font-black rounded-xl transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Vouch</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

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
