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
import { getPlayerSpotlightMetrics } from '../utils/spotlightMath';
import VouchCard from './vouch-system/VouchCard';
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
    hubVeBg: 'from-[var(--ve-accent)] to-[var(--ve-accent-2)] border-[var(--ve-border-strong)]',
    hubText: 'text-sky-400',
    nodeBorder: 'border-[var(--ve-border)] group-hover:border-[var(--ve-border-strong)]',
    nodeValueBg: 'bg-[var(--ve-card)] border border-[var(--ve-border-strong)] text-[var(--ve-accent)]',
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
    <div className="p-3 md:p-6 space-y-6 max-w-[1380px] mx-auto min-h-screen bg-transparent" id="vouch-hub-view">
      
      {/* Toast HUD */}
      {visualToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[hsl(var(--ve-surface)/0.94)] border border-[hsl(var(--ve-accent-cyan)/0.45)] text-[hsl(var(--ve-accent-cyan))] px-4 py-3 rounded-2xl flex items-center gap-2.5 shadow-2xl shadow-[hsl(var(--ve-shadow)/0.28)] text-xs font-mono font-bold animate-bounce backdrop-blur-xl">
          <Sparkles className="w-4 h-4 text-[hsl(var(--ve-accent-cyan))] animate-spin" />
          <span>{visualToast}</span>
        </div>
      )}

      {/* Main header banner */}
      <div className="overflow-hidden rounded-3xl border border-[hsl(var(--ve-border)/0.36)] bg-[linear-gradient(135deg,hsl(var(--ve-surface)/0.82),hsl(var(--ve-bg-panel)/0.92),hsl(var(--ve-accent-cyan)/0.10))] p-5 shadow-2xl shadow-[hsl(var(--ve-shadow)/0.22)] relative backdrop-blur-xl">
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[hsl(var(--ve-accent-cyan)/0.16)] blur-3xl pointer-events-none" />
        <div className="relative">
          <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--ve-accent-cyan)/0.30)] bg-[hsl(var(--ve-accent-cyan)/0.10)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-[hsl(var(--ve-accent-cyan))]">
            <BookmarkCheck className="h-3.5 w-3.5" /> Vouch Workspace
          </span>
          <h2 className="text-2xl font-black tracking-tight text-[hsl(var(--ve-text-primary))]">
            Vouch Board &amp; Graphic Studio
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-[hsl(var(--ve-text-muted))]">
            Build bespoke circular player portfolios, customize metrics, toggle sabermeter charts, and generate high-contrast cards for Twitter/X.
          </p>
        </div>

        {/* Prominent full-width section switcher (was a small corner pill) */}
        <div className="relative mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3" id="board-tabs-belt">
          {([
            { id: 'portfolio', emoji: '📊', label: 'Portfolio Analytics', sub: 'Risk + variance dashboard', accent: 'emerald' },
            { id: 'studio', emoji: '🎨', label: 'Orbit Studio', sub: 'Design shareable cards', accent: 'sky' },
            { id: 'saved', emoji: '📋', label: `Feed Board (${savedVouches.length})`, sub: 'Your saved vouches', accent: 'orange' },
          ] as const).map((t) => {
            const active = activeBoardTab === t.id;
            const ring = active
              ? t.accent === 'emerald'
                ? 'border-emerald-300/45 bg-emerald-400/10 shadow-[0_0_20px_-6px_rgba(52,211,153,0.5)]'
                : t.accent === 'sky'
                  ? 'border-[hsl(var(--ve-accent-cyan)/0.48)] bg-[hsl(var(--ve-accent-cyan)/0.10)] shadow-[0_0_20px_-6px_hsl(var(--ve-accent-cyan)/0.50)]'
                  : 'border-[hsl(var(--ve-accent-gold)/0.45)] bg-[hsl(var(--ve-accent-gold)/0.10)] shadow-[0_0_20px_-6px_hsl(var(--ve-accent-gold)/0.45)]'
              : 'border-[hsl(var(--ve-border)/0.30)] bg-[hsl(var(--ve-surface-raised)/0.38)] hover:border-[hsl(var(--ve-accent-cyan)/0.30)] hover:bg-[hsl(var(--ve-surface-raised)/0.55)]';
            const text = active
              ? t.accent === 'emerald' ? 'text-emerald-300' : t.accent === 'sky' ? 'text-[hsl(var(--ve-accent-cyan))]' : 'text-[hsl(var(--ve-accent-gold))]'
              : 'text-[hsl(var(--ve-text-secondary))]';
            return (
              <button
                key={t.id}
                onClick={() => setActiveBoardTab(t.id as 'portfolio' | 'studio' | 'saved')}
                className={`group relative flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${ring}`}
              >
                <span className="text-xl leading-none">{t.emoji}</span>
                <span className="min-w-0">
                  <span className={`block text-sm font-black ${text}`}>{t.label}</span>
                  <span className="block text-[11px] text-[hsl(var(--ve-text-muted))]">{t.sub}</span>
                </span>
                {active && <span className="ml-auto h-2 w-2 flex-shrink-0 rounded-full bg-current opacity-80" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB SUB-VIEW 0: PORTFOLIO ANALYTICS DASHBOARD */}
      {activeBoardTab === 'portfolio' && (
        <div className="space-y-6 animate-fade-in" id="vouch-portfolio-analytics">
          
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
            <div className="bg-[hsl(var(--ve-surface)/0.72)] border border-[hsl(var(--ve-accent-gold)/0.22)] p-4.5 rounded-2xl relative overflow-hidden shadow-lg shadow-[hsl(var(--ve-shadow)/0.12)] group hover:border-[hsl(var(--ve-accent-gold)/0.38)] transition-all duration-300 backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[hsl(var(--ve-accent-gold)/0.08)] rounded-full blur-2xl group-hover:bg-[hsl(var(--ve-accent-gold)/0.14)] transition-colors" />
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
                <div className="p-2 bg-[hsl(var(--ve-accent-gold)/0.12)] rounded-xl border border-[hsl(var(--ve-accent-gold)/0.28)]">
                  <Award className="w-4 h-4 text-[hsl(var(--ve-accent-gold))]" />
                </div>
              </div>
            </div>

            {/* Metric 3: Active Circle Exposure */}
            <div className="bg-[hsl(var(--ve-surface)/0.72)] border border-[hsl(var(--ve-accent-pink)/0.22)] p-4.5 rounded-2xl relative overflow-hidden shadow-lg shadow-[hsl(var(--ve-shadow)/0.12)] group hover:border-[hsl(var(--ve-accent-pink)/0.38)] transition-all duration-300 backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[hsl(var(--ve-text-muted))] uppercase tracking-wider block font-mono">Portfolio Roster</span>
                  <div className="text-2xl font-black text-[hsl(var(--ve-accent-pink))] tracking-tight">
                    {selectedPlayers.length} Active Stars
                  </div>
                  <span className="text-[10px] font-semibold text-[hsl(var(--ve-text-secondary))] truncate block max-w-[170px] mt-1.5 font-mono">
                    {selectedPlayers.map(p => p.player.name.split(' ').pop()).join(' • ')}
                  </span>
                </div>
                <div className="p-2 bg-[hsl(var(--ve-accent-pink)/0.12)] rounded-xl border border-[hsl(var(--ve-accent-pink)/0.28)]">
                  <Flame className="w-4 h-4 text-[hsl(var(--ve-accent-pink))]" />
                </div>
              </div>
            </div>

            {/* Metric 4: Sharpe Ratio / ROI */}
            <div className="bg-[hsl(var(--ve-surface)/0.72)] border border-[hsl(var(--ve-accent-pink)/0.22)] p-4.5 rounded-2xl relative overflow-hidden shadow-lg shadow-[hsl(var(--ve-shadow)/0.12)] group hover:border-[hsl(var(--ve-accent-pink)/0.38)] transition-all duration-300 backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[hsl(var(--ve-accent-pink)/0.08)] rounded-full blur-2xl group-hover:bg-[hsl(var(--ve-accent-pink)/0.14)] transition-colors" />
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[hsl(var(--ve-text-muted))] uppercase tracking-wider block font-mono">Efficiency Index</span>
                  <div className="text-2xl font-black text-purple-400 font-mono tracking-tight">
                    +14.25% ROI
                  </div>
                  <span className="text-[10px] text-[hsl(var(--ve-text-muted))] font-semibold flex items-center gap-1 mt-1 font-mono">
                    <Activity className="w-3 h-3 text-[hsl(var(--ve-accent-pink))]" />
                    Sharpe: 2.84 • S-Tier Grade
                  </span>
                </div>
                <div className="p-2 bg-[hsl(var(--ve-accent-pink)/0.12)] rounded-xl border border-[hsl(var(--ve-accent-pink)/0.28)]">
                  <Activity className="w-4 h-4 text-[hsl(var(--ve-accent-pink))]" />
                </div>
              </div>
            </div>

          </div>

          {/* Main Analytics Content Workspace Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT SECTION: CHART & INTERACTIVE SIMULATION LAB */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Performance Return Curve Card */}
              <div className="bg-[hsl(var(--ve-surface)/0.74)] border border-[hsl(var(--ve-border)/0.34)] rounded-3xl p-5 space-y-4 shadow-xl shadow-[hsl(var(--ve-shadow)/0.16)] backdrop-blur-xl">
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
              </div>

              {/* Backtester Controls & Console HUD */}
              <div className="bg-[hsl(var(--ve-surface)/0.74)] border border-[hsl(var(--ve-border)/0.34)] rounded-3xl p-5 space-y-4 shadow-xl shadow-[hsl(var(--ve-shadow)/0.16)] backdrop-blur-xl">
                <div>
                  <h3 className="text-sm font-bold text-[hsl(var(--ve-text-primary))] uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-[hsl(var(--ve-accent-cyan))]" />
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
                      <span className="font-black text-[hsl(var(--ve-accent-gold))] font-mono text-xs">{simulatedWinRate}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="99" 
                      value={simulatedWinRate} 
                      onChange={(e) => setSimulatedWinRate(parseInt(e.target.value))}
                      className="w-full h-1 bg-[hsl(var(--ve-surface-raised)/0.62)] rounded-lg appearance-none cursor-pointer accent-[hsl(var(--ve-accent-gold))]"
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
                      className="w-full text-xs font-semibold bg-[hsl(var(--ve-surface-raised)/0.44)] border border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-text-secondary))] p-2 rounded-xl outline-none focus:border-[hsl(var(--ve-accent-cyan)/0.55)]"
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

              </div>

            </div>

            {/* RIGHT SECTION: ACTIVE ROSTER CONFIGURATOR & CANDIDATES */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Active Portfolio Roster List */}
              <div className="bg-[hsl(var(--ve-surface)/0.74)] border border-[hsl(var(--ve-border)/0.34)] rounded-3xl p-5 space-y-4 shadow-xl shadow-[hsl(var(--ve-shadow)/0.16)] backdrop-blur-xl">
                <div>
                  <h3 className="text-sm font-bold text-[hsl(var(--ve-text-primary))] uppercase tracking-wider flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-[hsl(var(--ve-accent-gold))]" />
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
                      className="p-3 bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.28)] hover:border-[hsl(var(--ve-accent-cyan)/0.34)] transition-all rounded-2xl space-y-3 relative group shadow-lg shadow-[hsl(var(--ve-shadow)/0.10)]"
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
                          <span className="inline-block mt-1 px-2 py-0.5 bg-[hsl(var(--ve-accent-cyan)/0.12)] border border-[hsl(var(--ve-accent-cyan)/0.30)] text-[hsl(var(--ve-accent-cyan))] text-[8px] font-black rounded-md font-mono uppercase">
                            {ps.customVal}
                          </span>
                        </div>
                      </div>

                      {/* Configurable Sliders for real-time model adjusting */}
                      <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-[hsl(var(--ve-border)/0.26)] text-[9px]">
                        
                        {/* Slider A: AI confidence */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[hsl(var(--ve-text-muted))] uppercase font-mono">AI Model Conf</span>
                            <span className="font-black text-[hsl(var(--ve-accent-pink))] font-mono">{ps.aiConfidence || 85}%</span>
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
                            className="w-full h-1 bg-[hsl(var(--ve-surface-raised)/0.62)] rounded appearance-none cursor-pointer accent-[hsl(var(--ve-accent-pink))]"
                          />
                        </div>

                        {/* Slider B: Personal confidence */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[hsl(var(--ve-text-muted))] uppercase font-mono">Your Conf</span>
                            <span className="font-black text-[hsl(var(--ve-accent-cyan))] font-mono">{ps.playerConfidence || 80}%</span>
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
                            className="w-full h-1 bg-[hsl(var(--ve-surface-raised)/0.62)] rounded appearance-none cursor-pointer accent-[hsl(var(--ve-accent-cyan))]"
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
                      className="p-2.5 bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.28)] hover:border-[hsl(var(--ve-accent-cyan)/0.34)] transition-all rounded-2xl flex items-center justify-between gap-3 group shadow-lg shadow-[hsl(var(--ve-shadow)/0.10)]"
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

      {/* DEACTIVATED OLD STUDIO WORKSPACE */}
      {activeBoardTab === 'studio' && false && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="orbit-studio-grid">
          
          {/* Workspace configuration panel - LEFT */}
          <div className="lg:col-span-5 space-y-5 bg-[#121824] p-4 rounded-2xl border border-slate-850 self-start">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                Vouch Card Configuration
              </h3>
              <p className="text-[10px] text-[hsl(var(--ve-text-muted))] mt-0.5 leading-snug">
                Configure represented stars, specify individual lines, and enter analytical rationale.
              </p>
            </div>

            {/* Config: Players checkboxes list */}
            <div className="space-y-2">
              <label className="text-[9.5px] uppercase font-bold text-[hsl(var(--ve-text-muted))] tracking-wider block">
                {activeCardLayout === 'potd' ? "Featured Spotlight Player" : "Manage Represented Players (Max 5)"}
              </label>

              {activeCardLayout === 'potd' ? (
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between px-3 py-2 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <img 
                      src={(selectedPlayers[potdIndex] || selectedPlayers[0])?.player.headshot} 
                      alt={(selectedPlayers[potdIndex] || selectedPlayers[0])?.player.name} 
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full border border-slate-800 object-cover bg-slate-950" 
                    />
                    <div>
                      <span className="text-xs font-black text-amber-300 block">{(selectedPlayers[potdIndex] || selectedPlayers[0])?.player.name}</span>
                      <span className="text-[8px] font-mono text-[hsl(var(--ve-text-muted))] uppercase block mt-0.5 leading-none">
                        {(selectedPlayers[potdIndex] || selectedPlayers[0])?.player.team.split(' ').pop()} · NO. {(selectedPlayers[potdIndex] || selectedPlayers[0])?.player.number}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 uppercase tracking-widest animate-pulse leading-none">POTD</span>
                </div>
              ) : (
                /* Active list inline */
                <div className="flex flex-wrap gap-1.5 py-1">
                  {selectedPlayers.map((ps, idx) => (
                    <div key={ps.player.id} className="bg-slate-900 border border-slate-800 rounded-lg py-1 px-2 flex items-center gap-1.5 text-[10.5px] text-slate-200 font-mono font-bold">
                      <span>{ps.player.name.split(' ').pop()}</span>
                      <button 
                        onClick={() => handleRemovePlayerFromCircle(ps.player.id)}
                        className="text-[hsl(var(--ve-text-muted))] hover:text-rose-400 font-bold transition-all"
                        title="Remove"
                      >
                        <X className="w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Select Quickroll dropdown */}
              <div className="space-y-1.5">
                <span className="text-[8.5px] text-[hsl(var(--ve-text-muted))] uppercase block font-mono">
                  {activeCardLayout === 'potd' ? "Change Featured Player of the Day:" : "Quick add from active rosters:"}
                </span>
                <div className="max-h-[140px] overflow-y-auto bg-slate-950 rounded-xl border border-slate-900 p-1.5 space-y-1 scrollbar-thin">
                  {MLB_PLAYER_RECORDS.map((player) => {
                    const isActive = activeCardLayout === 'potd'
                      ? (selectedPlayers[potdIndex] || selectedPlayers[0])?.player.id === player.id
                      : selectedPlayers.some(p => p.player.id === player.id);
                    return (
                      <div 
                        key={player.id} 
                        className={`flex items-center justify-between p-1 px-2 rounded-lg text-[10px] uppercase font-bold transition-all ${
                          isActive ? 'bg-slate-900/60 text-slate-550' : 'hover:bg-slate-900 cursor-pointer text-slate-350'
                        }`}
                        onClick={() => {
                          if (activeCardLayout === 'potd') {
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
                          } else {
                            if (!isActive) handleAddPlayerToCircle(player);
                          }
                        }}
                      >
                        <div className="flex items-center gap-1.5 text-left">
                          <img 
                            src={player.headshot} 
                            alt={player.name} 
                            referrerPolicy="no-referrer"
                            className="w-5 h-5 rounded bg-slate-900 border border-slate-800 object-cover" 
                          />
                          <span>{player.name} <span className="text-[8px] text-slate-550">({player.team.split(' ').pop()})</span></span>
                        </div>
                        {isActive ? (
                          <span className="text-[8px] text-slate-550 lowercase">{activeCardLayout === 'potd' ? "spotlighted" : "active"}</span>
                        ) : (
                          <Plus className="w-3 h-3 text-[var(--ve-accent)]" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Config: Per-player customizable stat metrics */}
            <div className="space-y-3">
              <label className="text-[9.5px] uppercase font-bold text-[#f1f5f9] tracking-wider block">
                {activeCardLayout === 'potd' ? "Customize Featured Player Prop Specs" : "Customize Star Props Highlight"}
              </label>

              <div className="space-y-3 border-t border-slate-850 pt-3">
                {selectedPlayers
                  .map((ps, index) => ({ ps, originalIndex: index }))
                  .filter(({ originalIndex }) => activeCardLayout !== 'potd' || originalIndex === potdIndex)
                  .map(({ ps, originalIndex }) => (
                  <div key={ps.player.id} className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-2 text-xs">
                    <div className="flex justify-between items-center bg-slate-900/60 p-1 rounded-lg px-2">
                      <span className="font-extrabold font-mono text-slate-200">
                        {activeCardLayout === 'potd' ? "FEATURED" : `${originalIndex + 1}.`} {ps.player.name}
                      </span>
                      <span className="text-[8.5px] font-mono text-slate-555 uppercase">
                        {ps.player.team.split(' ').pop()} • #{ps.player.number}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                      <div className="space-y-1 text-left">
                        <span className="text-[8px] uppercase font-mono text-slate-550 block">Highlight Metric</span>
                        <select
                          value={ps.statType}
                          onChange={(e) => handleStatTypeChange(originalIndex, e.target.value as CustomPlayerSelection['statType'])}
                          className="w-full bg-[hsl(var(--ve-surface-raised)/0.44)] border border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-text-primary))] p-1 rounded outline-none font-medium cursor-pointer focus:border-[hsl(var(--ve-accent-cyan)/0.55)]"
                        >
                          <option value="Homeruns">Homeruns (HR)</option>
                          <option value="Runs">Runs Scored</option>
                          <option value="Hits">Hits Line</option>
                          <option value="RBIs">RBIs Line</option>
                          <option value="AVG">Season AVG</option>
                          <option value="OPS">Season OPS</option>
                        </select>
                      </div>

                      <div className="space-y-1 text-left">
                        <span className="text-[8px] uppercase font-mono text-[#cbd5e1] block">Custom Projection Marker</span>
                        <input
                          type="text"
                          value={ps.customVal}
                          onChange={(e) => handleCustomValChange(originalIndex, e.target.value)}
                          className="w-full bg-[hsl(var(--ve-surface-raised)/0.44)] border border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-text-primary))] p-1 rounded outline-none font-bold placeholder:text-[hsl(var(--ve-text-muted))] focus:border-[hsl(var(--ve-accent-cyan)/0.55)]"
                          placeholder="e.g. Over 0.5 HRs"
                        />
                      </div>
                    </div>

                    {/* Companion Card customized parameters */}
                    <div className="mt-2.5 border-t border-[hsl(var(--ve-border)/0.26)] pt-2.5 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[8.5px] font-mono text-slate-450">
                            <span>V.A.I. CONFIDENCE</span>
                            <span className="text-[var(--ve-accent)] font-extrabold font-mono">{ps.aiConfidence ?? 85}%</span>
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
                            className="w-full accent-[hsl(var(--ve-accent-cyan))] h-1 bg-[hsl(var(--ve-surface-raised)/0.62)] rounded-lg cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[8.5px] font-mono text-slate-455">
                            <span>PLAYER COEF.</span>
                            <span className="text-amber-400 font-extrabold font-mono">{ps.playerConfidence ?? 80}%</span>
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
                            className="w-full accent-[hsl(var(--ve-accent-gold))] h-1 bg-[hsl(var(--ve-surface-raised)/0.62)] rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[8.5px] uppercase font-mono text-slate-550">Player Insights Narrative</label>
                          <span className="text-[7.5px] text-zinc-550 uppercase font-mono">Displays on card 2</span>
                        </div>
                        <textarea
                          rows={2}
                          value={ps.customExplanation ?? ""}
                          onChange={(e) => {
                            const updated = [...selectedPlayers];
                            updated[originalIndex].customExplanation = e.target.value;
                            setSelectedPlayers(updated);
                          }}
                          placeholder={
                            originalIndex === 0 
                              ? "Ohtani enjoys exceptional launch rate with high humidity coefficients tonight."
                              : originalIndex === 1
                              ? "Judge’s high target index velocity coefficients suggest reliable contact rates."
                              : "Betts serves as elite lead-off on base catalyst."
                          }
                          className="w-full bg-[hsl(var(--ve-surface-raised)/0.44)] border border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-text-primary))] text-[10.5px] p-2 rounded-lg outline-none focus:border-[hsl(var(--ve-accent-cyan)/0.55)] resize-none font-medium leading-tight text-left placeholder:text-[hsl(var(--ve-text-muted))]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Config: Reasons justification text */}
            <div className="space-y-1">
              <label className="text-[9.5px] uppercase font-bold text-[hsl(var(--ve-text-muted))] tracking-wider block">
                My Analytical Reasons & Insights
              </label>
              <textarea
                value={reasonsText}
                onChange={(e) => setReasonsText(e.target.value)}
                rows={3}
                placeholder="Give your primary sabermetric reasoning..."
                className="w-full bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-text-primary))] text-xs p-2.5 rounded-xl outline-none focus:border-[hsl(var(--ve-accent-cyan)/0.55)] resize-none leading-normal font-medium placeholder:text-[hsl(var(--ve-text-muted))]"
              />
            </div>

            {/* Config: Card Template Selection & POTD Selector */}
            <div className="space-y-3.5 border-t border-[hsl(var(--ve-border)/0.28)] pt-3.5" id="potd-layout-customizer-module">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase font-mono font-black text-[hsl(var(--ve-text-muted))] tracking-wider block">
                  Studio Design Layout
                </label>
                <span className="text-[8.5px] font-mono text-[hsl(var(--ve-accent-cyan))] bg-[hsl(var(--ve-accent-cyan)/0.10)] px-2 py-0.5 rounded font-bold uppercase border border-[hsl(var(--ve-accent-cyan)/0.22)]">
                  EXCLUSIVE
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveCardLayout('orbit')}
                  className={`py-2 px-1 rounded-xl border text-center transition-all text-[10px] sm:text-xs font-mono font-bold flex flex-col items-center justify-center gap-1.5 ${
                    activeCardLayout === 'orbit'
                      ? 'bg-[hsl(var(--ve-accent-cyan)/0.12)] border-[hsl(var(--ve-accent-cyan)/0.36)] text-[hsl(var(--ve-accent-cyan))] shadow-sm'
                      : 'bg-slate-950 border-slate-900 text-[hsl(var(--ve-text-muted))] hover:text-slate-350 hover:bg-slate-900/30'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>ORBIT</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCardLayout('potd')}
                  className={`py-2 px-1 rounded-xl border text-center transition-all text-[10px] sm:text-xs font-mono font-bold flex flex-col items-center justify-center gap-1.5 ${
                    activeCardLayout === 'potd'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-sm'
                      : 'bg-slate-950 border-slate-900 text-[hsl(var(--ve-text-muted))] hover:text-slate-350 hover:bg-slate-900/30'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-[hsl(var(--ve-accent-gold))]" />
                  <span>SPOTLIGHT</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCardLayout('parlay')}
                  className={`py-2 px-1 rounded-xl border text-center transition-all text-[10px] sm:text-xs font-mono font-bold flex flex-col items-center justify-center gap-1.5 ${
                    activeCardLayout === 'parlay'
                      ? 'bg-purple-500/10 border-purple-500/40 text-purple-300 shadow-sm'
                      : 'bg-slate-950 border-slate-900 text-[hsl(var(--ve-text-muted))] hover:text-slate-350 hover:bg-slate-900/30'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  <span>PARLAY</span>
                </button>
              </div>

              {/* Conditionally reveal player selection for Player of the Day design */}
              {activeCardLayout === 'potd' && (
                <div className="p-3 bg-slate-950/45 rounded-xl border border-slate-900 space-y-2 animate-fade-in">
                  <span className="text-[9px] uppercase font-mono font-black text-[hsl(var(--ve-text-muted))] block tracking-wider">
                    Select Featured Spotlight Player:
                  </span>
                  <div className="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {selectedPlayers.map((ps, idx) => (
                      <button
                        key={ps.player.id}
                        type="button"
                        onClick={() => setPotdIndex(idx)}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border text-left transition-all ${
                          potdIndex === idx
                            ? 'bg-[#1e1a14] border-amber-600/40 text-amber-300'
                            : 'bg-slate-900/25 border-slate-900/80 text-slate-450 hover:text-slate-200 hover:bg-slate-900/50'
                        }`}
                      >
                        <img
                          src={ps.player.headshot}
                          alt={ps.player.name}
                          className="w-6 h-6 rounded-full border border-slate-800 object-cover bg-slate-950"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1 leading-none">
                          <span className="text-[11px] font-black truncate block">{ps.player.name}</span>
                          <span className="text-[8px] text-[hsl(var(--ve-text-muted))] uppercase tracking-tight block mt-0.5">
                            {ps.player.team.split(' ').pop()} · {ps.statType}: {ps.customVal}
                          </span>
                        </div>
                        {potdIndex === idx && (
                          <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Companion Card Configuration */}
            <div className="space-y-3 border-t border-slate-800 pt-3.5" id="companion-deck-customizer">
              <label className="text-[10px] uppercase font-mono font-black text-[hsl(var(--ve-text-muted))] tracking-wider block">
                Insight Companion Card & Posting Alignment
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowSecondCard(!showSecondCard)}
                  className={`py-2 px-3 rounded-xl border text-center transition-all text-xs font-mono font-bold flex items-center justify-center gap-1.5 ${
                    showSecondCard
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-sm'
                      : 'bg-slate-950 border-slate-900 text-[hsl(var(--ve-text-muted))] hover:text-slate-350 hover:bg-slate-900/10'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  {showSecondCard ? 'COMPANION CARD ON' : 'SINGLE CARD ONLY'}
                </button>

                <button
                  type="button"
                  disabled={!showSecondCard}
                  onClick={() => setPostSideways(!postSideways)}
                  className={`py-2 px-3 rounded-xl border text-center transition-all text-xs font-mono font-bold flex items-center justify-center gap-1.5 ${
                    !showSecondCard
                      ? 'opacity-40 cursor-not-allowed bg-slate-950/20 border-slate-950 text-slate-600'
                      : postSideways
                      ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300 shadow-sm'
                      : 'bg-slate-950 border-slate-900 text-[hsl(var(--ve-text-muted))] hover:text-slate-350 hover:bg-slate-900/10'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  {postSideways ? 'DEV SIDEWAYS' : 'SLIDER DECK'}
                </button>
              </div>
            </div>

            {/* HIGH CONVERSING SELF-VOUCH CAMPAIGN AND PROMO STATS */}
            <div className="space-y-4 border-t border-slate-800 pt-3.5" id="self-vouch-marketing-suite">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase font-mono font-black text-amber-400 tracking-wider block">
                  📢 SELF VOUCH PROMOTION MARKETING SUITE
                </label>
                <span className="text-[8px] font-mono bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">
                  HIGH CONVERSION
                </span>
              </div>

              {/* + BUTTON TO UPLOAD OWN CUSTOM PHOTO */}
              <div className="space-y-2">
                <span className="text-[8.5px] font-mono text-[hsl(var(--ve-text-muted))] uppercase font-black block text-left">
                  Card Custom Background / Plate Image:
                </span>
                <div className="flex flex-wrap gap-2 items-center">
                  <label className="cursor-pointer bg-[hsl(var(--ve-surface-raised)/0.40)] border-2 border-dashed border-[hsl(var(--ve-border)/0.34)] hover:border-[hsl(var(--ve-accent-cyan)/0.48)] p-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all w-24 h-24 text-center group">
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
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <Plus className="w-5 h-5 text-[hsl(var(--ve-text-muted))] group-hover:text-[hsl(var(--ve-accent-cyan))] transition-colors" />
                    <span className="text-[8px] font-mono font-extrabold text-[hsl(var(--ve-text-muted))] uppercase tracking-tight">ADD PHOTO</span>
                  </label>

                  {/* Preset Background Options */}
                  <div className="flex-1 space-y-1.5">
                    <span className="text-[7.5px] font-mono text-[hsl(var(--ve-text-muted))] uppercase block text-left">Or Pick High-Contrast Neon Presets:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button 
                        type="button" 
                        onClick={() => {
                          setCustomCardPhoto("https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80");
                          setCustomCardPhotoLabel("Green Turf Field");
                        }} 
                        className="text-[8.5px] font-mono text-[hsl(var(--ve-text-soft))] bg-[hsl(var(--ve-surface-raised)/0.42)] hover:bg-[hsl(var(--ve-surface-raised)/0.62)] p-1 rounded-lg border border-[hsl(var(--ve-border)/0.30)] leading-tight text-left"
                      >
                        🌱 Green Turf Field
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          setCustomCardPhoto("https://images.unsplash.com/photo-1540747737956-378724044432?w=600&auto=format&fit=crop&q=80");
                          setCustomCardPhotoLabel("Stadium Light Beam");
                        }} 
                        className="text-[8.5px] font-mono text-[hsl(var(--ve-text-soft))] bg-[hsl(var(--ve-surface-raised)/0.42)] hover:bg-[hsl(var(--ve-surface-raised)/0.62)] p-1 rounded-lg border border-[hsl(var(--ve-border)/0.30)] leading-tight text-left"
                      >
                        🏟️ Stadium Lights
                      </button>
                    </div>
                    {customCardPhoto && (
                      <div className="flex items-center justify-between bg-[hsl(var(--ve-surface-raised)/0.42)] border border-[hsl(var(--ve-border)/0.32)] rounded-lg p-1 px-2 text-[9px]">
                        <span className="text-[hsl(var(--ve-accent-cyan))] truncate font-mono max-w-[120px]">{customCardPhotoLabel || "Custom Loaded"}</span>
                        <button 
                          onClick={() => {
                            setCustomCardPhoto("");
                            setCustomCardPhotoLabel("");
                          }} 
                          className="text-red-400 font-bold hover:text-red-300"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Win Rate, Daily, Monthly Toggles & Fields */}
              <div className="bg-[hsl(var(--ve-surface-raised)/0.34)] p-3 rounded-2xl border border-[hsl(var(--ve-border)/0.28)] space-y-3">
                
                {/* 1. Winrate inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
                  <div className="space-y-1">
                    <label className="flex items-center gap-1 text-[8.5px] font-mono text-[hsl(var(--ve-text-muted))] font-black">
                      <input 
                        type="checkbox" 
                        checked={showWinRate} 
                        onChange={(e) => setShowWinRate(e.target.checked)}
                        className="rounded bg-[hsl(var(--ve-surface-raised)/0.52)] border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-accent-cyan))] focus:ring-0" 
                      />
                      SHOW WIN RATE
                    </label>
                    <input 
                      type="text" 
                      disabled={!showWinRate}
                      value={customWinRate}
                      onChange={(e) => setCustomWinRate(e.target.value)}
                      className="w-full bg-[hsl(var(--ve-surface-raised)/0.44)] border border-[hsl(var(--ve-border)/0.30)] rounded p-1 text-[11px] font-bold text-[hsl(var(--ve-accent-cyan))] outline-none placeholder:text-[hsl(var(--ve-text-muted))] focus:border-[hsl(var(--ve-accent-cyan)/0.55)]" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center gap-1 text-[8.5px] font-mono text-[hsl(var(--ve-text-muted))] font-black">
                      <input 
                        type="checkbox" 
                        checked={showDailyWinRate} 
                        onChange={(e) => setShowDailyWinRate(e.target.checked)}
                        className="rounded bg-[hsl(var(--ve-surface-raised)/0.52)] border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-accent-cyan))] focus:ring-0" 
                      />
                      DAILY WIN RATE
                    </label>
                    <input 
                      type="text" 
                      disabled={!showDailyWinRate}
                      value={customDailyWinRate}
                      onChange={(e) => setCustomDailyWinRate(e.target.value)}
                      className="w-full bg-[hsl(var(--ve-surface-raised)/0.44)] border border-[hsl(var(--ve-border)/0.30)] rounded p-1 text-[11px] font-bold text-[hsl(var(--ve-accent-gold))] outline-none focus:border-[hsl(var(--ve-accent-gold)/0.55)]" 
                    />
                  </div>
                </div>

                {/* 2. Monthly dynamic & Picks input */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
                  <div className="space-y-1">
                    <label className="flex items-center gap-1 text-[8.5px] font-mono text-[hsl(var(--ve-text-muted))] font-black">
                      <input 
                        type="checkbox" 
                        checked={showMonthlyWinRate} 
                        onChange={(e) => setShowMonthlyWinRate(e.target.checked)}
                        className="rounded bg-[hsl(var(--ve-surface-raised)/0.52)] border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-accent-cyan))] focus:ring-0" 
                      />
                      MONTHLY WIN RATE
                    </label>
                    <input 
                      type="text" 
                      disabled={!showMonthlyWinRate}
                      value={customMonthlyWinRate}
                      onChange={(e) => setCustomMonthlyWinRate(e.target.value)}
                      className="w-full bg-[hsl(var(--ve-surface-raised)/0.44)] border border-[hsl(var(--ve-border)/0.30)] rounded p-1 text-[11px] font-bold text-[hsl(var(--ve-accent-pink))] outline-none focus:border-[hsl(var(--ve-accent-pink)/0.55)]" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center gap-1 text-[8.5px] font-mono text-[hsl(var(--ve-text-muted))] font-black">
                      <input 
                        type="checkbox" 
                        checked={showMlbPicks} 
                        onChange={(e) => setShowMlbPicks(e.target.checked)}
                        className="rounded bg-[hsl(var(--ve-surface-raised)/0.52)] border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-accent-cyan))] focus:ring-0" 
                      />
                      MLB RUN INDEX (PICKS)
                    </label>
                    <input 
                      type="text" 
                      disabled={!showMlbPicks}
                      value={customMlbPicks}
                      onChange={(e) => setCustomMlbPicks(e.target.value)}
                      className="w-full bg-[hsl(var(--ve-surface-raised)/0.44)] border border-[hsl(var(--ve-border)/0.30)] rounded p-1 text-[11px] font-bold text-[hsl(var(--ve-accent-cyan))] outline-none focus:border-[hsl(var(--ve-accent-cyan)/0.55)]" 
                    />
                  </div>
                </div>

                {/* 3. PRO badge and Units Net Profit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
                  <div className="space-y-1">
                    <label className="flex items-center gap-1 text-[8.5px] font-mono text-[hsl(var(--ve-text-muted))] font-black">
                      <input 
                        type="checkbox" 
                        checked={showProBadge} 
                        onChange={(e) => setShowProBadge(e.target.checked)}
                        className="rounded bg-[hsl(var(--ve-surface-raised)/0.52)] border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-accent-cyan))] focus:ring-0" 
                      />
                      PRO STAMP LEVEL
                    </label>
                    <input 
                      type="text" 
                      disabled={!showProBadge}
                      value={customProTag}
                      onChange={(e) => setCustomProTag(e.target.value)}
                      className="w-full bg-[hsl(var(--ve-surface-raised)/0.44)] border border-[hsl(var(--ve-border)/0.30)] rounded p-1 text-[11px] font-bold text-[hsl(var(--ve-accent-pink))] outline-none focus:border-[hsl(var(--ve-accent-pink)/0.55)]" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center gap-1 text-[8.5px] font-mono text-[hsl(var(--ve-text-muted))] font-black">
                      <input 
                        type="checkbox" 
                        checked={showUnitsProfit} 
                        onChange={(e) => setShowUnitsProfit(e.target.checked)}
                        className="rounded bg-[hsl(var(--ve-surface-raised)/0.52)] border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-accent-cyan))] focus:ring-0" 
                      />
                      UNITS NET PROFIT
                    </label>
                    <input 
                      type="text" 
                      disabled={!showUnitsProfit}
                      value={unitsProfitValue}
                      onChange={(e) => setUnitsProfitValue(e.target.value)}
                      className="w-full bg-[hsl(var(--ve-surface-raised)/0.44)] border border-[hsl(var(--ve-border)/0.30)] rounded p-1 text-[11px] font-bold text-emerald-300 outline-none focus:border-emerald-300/55" 
                    />
                  </div>
                </div>

                {/* 4. Best Parlay Pick Block */}
                <div className="space-y-1 text-left">
                  <label className="flex items-center gap-1 text-[8.5px] font-mono text-[hsl(var(--ve-text-muted))] font-black">
                    <input 
                      type="checkbox" 
                      checked={showBestParlay} 
                      onChange={(e) => setShowBestParlay(e.target.checked)}
                      className="rounded bg-[hsl(var(--ve-surface-raised)/0.52)] border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-accent-cyan))] focus:ring-0" 
                    />
                    BEST PARLAY PICK HERO LABEL
                  </label>
                  <input 
                    type="text" 
                    disabled={!showBestParlay}
                    value={bestParlayDesc}
                    onChange={(e) => setBestParlayDesc(e.target.value)}
                    className="w-full bg-[hsl(var(--ve-surface-raised)/0.44)] border border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-text-primary))] text-[11px] rounded p-1 px-2 font-black tracking-tight focus:border-[hsl(var(--ve-accent-cyan)/0.55)]" 
                  />
                </div>

                {/* 5. Subscription Coupon discount */}
                <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-[hsl(var(--ve-border)/0.26)]">
                  <div className="space-y-1">
                    <label className="flex items-center gap-1 text-[8px] font-mono text-[hsl(var(--ve-text-muted))] font-bold">
                      <input 
                        type="checkbox" 
                        checked={showCoupon} 
                        onChange={(e) => setShowCoupon(e.target.checked)}
                        className="rounded bg-[hsl(var(--ve-surface-raised)/0.52)] border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-accent-cyan))] focus:ring-0" 
                      />
                      COUPON CODE
                    </label>
                    <input 
                      type="text" 
                      disabled={!showCoupon}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="e.g. SAVE20"
                      className="w-full bg-[hsl(var(--ve-surface-raised)/0.44)] border border-[hsl(var(--ve-border)/0.30)] rounded p-1 text-[11px] font-bold uppercase text-[hsl(var(--ve-accent-gold))] outline-none placeholder:text-[hsl(var(--ve-text-muted))] focus:border-[hsl(var(--ve-accent-gold)/0.55)]" 
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] font-mono text-[hsl(var(--ve-text-muted))] block">COUPON RECRUIT promo text</span>
                    <input 
                      type="text" 
                      disabled={!showCoupon}
                      value={couponText}
                      onChange={(e) => setCouponText(e.target.value)}
                      className="w-full bg-[hsl(var(--ve-surface-raised)/0.44)] border border-[hsl(var(--ve-border)/0.30)] rounded p-1 text-[11px] font-bold text-[hsl(var(--ve-text-secondary))] outline-none focus:border-[hsl(var(--ve-accent-cyan)/0.55)]" 
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Config: Card Styles Showcase */}
            <div className="space-y-2 border-t border-[hsl(var(--ve-border)/0.28)] pt-3">
              <label className="text-[10px] uppercase font-mono font-black text-[hsl(var(--ve-text-muted))] tracking-wider block">
                Visual Card Style Preset
              </label>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { id: 'cyberpunk', name: '🕹️ Cyber Cobalt', activeStyle: 'border-[hsl(var(--ve-accent-cyan)/0.42)] text-[hsl(var(--ve-accent-cyan))] bg-[hsl(var(--ve-accent-cyan)/0.12)]' },
                  { id: 'luxury', name: '👑 Gold Prestige', activeStyle: 'border-[hsl(var(--ve-accent-gold)/0.42)] text-[hsl(var(--ve-accent-gold))] bg-[hsl(var(--ve-accent-gold)/0.12)]' },
                  { id: 'crimson', name: '🔥 Crimson Fury', activeStyle: 'border-red-500/40 text-red-500 bg-red-950/20' },
                  { id: 'minimal', name: '🏛️ Swiss Minimal', activeStyle: 'border-[hsl(var(--ve-border)/0.42)] text-[hsl(var(--ve-text-secondary))] bg-[hsl(var(--ve-surface-raised)/0.32)]' },
                  { id: 'hologram', name: '✨ Midnight Holo', activeStyle: 'border-fuchsia-500/40 text-fuchsia-400 bg-fuchsia-950/20' }
                ].map(styleOpt => (
                  <button
                    key={styleOpt.id}
                    type="button"
                    onClick={() => setCardStyle(styleOpt.id as any)}
                    className={`py-2 px-2.5 rounded-xl border text-left transition-all text-[11px] font-mono flex flex-col justify-between h-[52px] ${
                      cardStyle === styleOpt.id 
                        ? `${styleOpt.activeStyle} border-2 ring-1 ring-[hsl(var(--ve-accent-cyan)/0.14)] font-black` 
                        : 'bg-slate-950 border-slate-900 text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text-secondary))] hover:border-slate-800'
                    }`}
                  >
                    <span>{styleOpt.name}</span>
                    <span className="text-[7px] uppercase tracking-widest font-normal opacity-60">
                      {styleOpt.id}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles bar */}
            <div className="grid grid-cols-3 gap-2 text-[9px] border-t border-[hsl(var(--ve-border)/0.28)] pt-3">
              <button
                onClick={() => setShowCharts(!showCharts)}
                className={`flex flex-col items-center justify-center p-1.5 rounded-xl outline-none border transition-all ${
                  showCharts 
                    ? 'bg-[hsl(var(--ve-surface-raised)/0.52)] border-[hsl(var(--ve-accent-cyan)/0.34)] text-[hsl(var(--ve-accent-cyan))]' 
                    : 'bg-slate-950/20 border-[#1e293b] text-[hsl(var(--ve-text-muted))]'
                }`}
              >
                <span className="font-mono text-[9px] font-bold">GAME CHARTS</span>
                <span className="text-[9px] font-black uppercase mt-0.5">{showCharts ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => setShowLogo(!showLogo)}
                className={`flex flex-col items-center justify-center p-1.5 rounded-xl outline-none border transition-all ${
                  showLogo 
                    ? 'bg-[hsl(var(--ve-surface-raised)/0.52)] border-[hsl(var(--ve-accent-cyan)/0.34)] text-[hsl(var(--ve-accent-cyan))]' 
                    : 'bg-slate-950/20 border-[#1e293b] text-[hsl(var(--ve-text-muted))]'
                }`}
              >
                <span className="font-mono text-[9px] font-bold">WATERMARK</span>
                <span className="text-[9px] font-black uppercase mt-0.5">{showLogo ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => setShowReasons(!showReasons)}
                className={`flex flex-col items-center justify-center p-1.5 rounded-xl outline-none border transition-all ${
                  showReasons 
                    ? 'bg-[hsl(var(--ve-surface-raised)/0.52)] border-[hsl(var(--ve-accent-cyan)/0.34)] text-[hsl(var(--ve-accent-cyan))]' 
                    : 'bg-slate-950/20 border-[#1e293b] text-[hsl(var(--ve-text-muted))]'
                }`}
              >
                <span className="font-mono text-[9px] font-bold">RATIONALE TXT</span>
                <span className="text-[9px] font-black uppercase mt-0.5">{showReasons ? 'ON' : 'OFF'}</span>
              </button>
            </div>

          </div>

          {/* DYNAMIC CARD PREVIEW - RIGHT (COLUMN 7) */}
          <div className="lg:col-span-7 space-y-5 flex flex-col">
            
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-mono font-bold text-[hsl(var(--ve-text-muted))] uppercase tracking-widest">
                Twitter/X Board Share Card Preview
              </span>
              <span className="text-[9.5px] font-mono text-emerald-400 flex items-center gap-1 font-bold bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/25">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE RENDER
              </span>
            </div>

            {/* Visual Workspace Premium Scale Station */}
            <div className="bg-[hsl(var(--ve-surface)/0.76)] backdrop-blur-xl border border-[hsl(var(--ve-border)/0.34)] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-4 shadow-xl shadow-[hsl(var(--ve-shadow)/0.14)]">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-[hsl(var(--ve-text-muted))] uppercase tracking-wider">
                  🔎 Scale Controller:
                </span>
                <span className="text-xs font-mono font-black text-[hsl(var(--ve-accent-cyan))] bg-[hsl(var(--ve-accent-cyan)/0.12)] px-2 py-0.5 rounded border border-[hsl(var(--ve-accent-cyan)/0.30)]">
                  {Math.round(previewScale * 100)}% Size
                </span>
              </div>
              <div className="flex items-center gap-3 flex-1 max-w-[180px] sm:max-w-xs">
                <span className="text-[9px] font-mono text-[hsl(var(--ve-text-muted))]">Fit</span>
                <input 
                  type="range" 
                  min="0.5" 
                  max="1.1" 
                  step="0.05" 
                  value={previewScale}
                  onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[hsl(var(--ve-surface-raised)/0.62)] rounded-lg appearance-none cursor-pointer accent-[hsl(var(--ve-accent-cyan))]" 
                />
                <span className="text-[9px] font-mono text-[hsl(var(--ve-text-muted))]">1:1</span>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewScale(0.70)}
                  className={`px-2 py-1 text-[9px] font-mono font-bold rounded border transition-all ${
                    previewScale === 0.70 ? 'bg-[hsl(var(--ve-accent-cyan)/0.14)] border-[hsl(var(--ve-accent-cyan)/0.42)] text-[hsl(var(--ve-accent-cyan))] font-extrabold shadow-[0_0_10px_hsl(var(--ve-accent-cyan)/0.22)]' : 'bg-slate-900 border-slate-800 text-[hsl(var(--ve-text-muted))] hover:text-slate-200'
                  }`}
                >
                  Fits Sideways
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewScale(0.85)}
                  className={`px-2 py-1 text-[9px] font-mono font-bold rounded border transition-all ${
                    previewScale === 0.85 ? 'bg-[hsl(var(--ve-accent-cyan)/0.14)] border-[hsl(var(--ve-accent-cyan)/0.42)] text-[hsl(var(--ve-accent-cyan))] font-extrabold shadow-[0_0_10px_hsl(var(--ve-accent-cyan)/0.22)]' : 'bg-slate-900 border-slate-800 text-[hsl(var(--ve-text-muted))] hover:text-slate-200'
                  }`}
                >
                  Optimal
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewScale(1.0)}
                  className={`px-2 py-1 text-[9px] font-mono font-bold rounded border transition-all ${
                    previewScale === 1.0 ? 'bg-[hsl(var(--ve-accent-cyan)/0.14)] border-[hsl(var(--ve-accent-cyan)/0.42)] text-[hsl(var(--ve-accent-cyan))] font-extrabold shadow-[0_0_10px_hsl(var(--ve-accent-cyan)/0.22)]' : 'bg-slate-900 border-slate-800 text-[hsl(var(--ve-text-muted))] hover:text-slate-200'
                  }`}
                >
                  Actual
                </button>
              </div>
            </div>

            {/* Viewport Frame mask */}
            <div className="w-full rounded-3xl border border-[hsl(var(--ve-border)/0.34)] bg-[hsl(var(--ve-surface-raised)/0.26)] p-4 sm:p-6 overflow-hidden max-h-[820px] scrollbar-none flex justify-center items-start shadow-inner">
              {/* Main Interactive Poster Canvas Container Layout */}
              <div 
                className={`flex ${postSideways && showSecondCard ? 'flex-col xl:flex-row' : 'flex-col'} gap-5 w-full relative group transition-all duration-300`}
                id="vouch-circular-graphic-card-canvas"
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top center',
                  width: `${100 / previewScale}%`,
                  marginBottom: `calc((1 - ${previewScale}) * -700px)`
                }}
              >
              {/* Primary Visualizer Card */}
              {(!showSecondCard || postSideways || activePreviewCardIndex === 0) && (
                <div 
                  className={`relative group/studio-card ${activeStyle.bg} rounded-3xl p-6 relative overflow-hidden shadow-2xl flex flex-col justify-between aspect-[3/4.2] min-h-[650px] max-w-[490px] mx-auto w-full flex-1`}
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
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-[hsl(var(--ve-surface)/0.90)] hover:bg-[hsl(var(--ve-surface-raised)/0.92)] border border-[hsl(var(--ve-border)/0.34)] text-[hsl(var(--ve-accent-cyan))] rounded-full transition-all duration-250 opacity-0 group-hover/studio-card:opacity-100 shadow-2xl shadow-[hsl(var(--ve-shadow)/0.22)] cursor-pointer z-50 flex items-center justify-center hover:scale-105 active:scale-95"
                      title="Slide to Analytics Card"
                      id="studio-slide-next-btn"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  )}

                  {/* Dot/Page indicator */}
                  {showSecondCard && !postSideways && (
                    <div className="absolute top-20 right-4 bg-[hsl(var(--ve-surface)/0.82)] rounded-full py-1 px-3 border border-[hsl(var(--ve-border)/0.32)] text-[9px] font-mono text-[hsl(var(--ve-text-muted))] font-bold z-40 shadow flex gap-1.5 items-center backdrop-blur-xl">
                      <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--ve-accent-cyan))] animate-pulse" />
                      CARD 1 / 2
                    </div>
                  )}
              {/* Complex technological background design elements */}
              <div className={`absolute inset-0 ${activeStyle.radialGrad} pointer-events-none`} />
              <div className={`absolute top-0 right-0 w-32 h-32 ${activeStyle.cornerLight1} rounded-full blur-3xl pointer-events-none`} />
              <div className={`absolute bottom-0 left-0 w-32 h-32 ${activeStyle.cornerLight2} rounded-full blur-3xl pointer-events-none`} />

              {/* CARD HEADER */}
              <div className={`flex justify-between items-center pb-4 border-b ${cardStyle === 'minimal' ? 'border-slate-200' : 'border-slate-900/80'} z-10 relative`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${activeStyle.hubVeBg} flex items-center justify-center text-white font-extrabold text-sm border`}>
                    VE
                  </div>
                  <div className="leading-none text-left">
                    <span className={`text-[11px] font-black tracking-widest ${activeStyle.headerTitleColor} uppercase`}>Vouch<span className={cardStyle === 'minimal' ? 'text-slate-900' : 'text-[hsl(var(--ve-accent-cyan))]'}>Edge</span></span>
                    <span className={`text-[8px] font-mono font-bold ${activeStyle.headerSubTitleColor} block uppercase mt-0.5`}>Analytic Core Certified</span>
                  </div>
                </div>

                <div className="text-right flex items-center gap-2">
                  <div className="text-right leading-none">
                    <span className={`text-[10px] font-extrabold block uppercase ${cardStyle === 'minimal' ? 'text-slate-800' : 'text-slate-200'}`}>
                      {profile?.displayName || "Zhavior"}
                    </span>
                    <span className="text-[8.5px] text-[hsl(var(--ve-accent-cyan))] font-mono tracking-tight block mt-0.5">
                      @{profile?.username || "Zhavior"} • {formattedToday}
                    </span>
                  </div>
                  <img 
                    src={profile?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"} 
                    alt={profile?.displayName || "Zhavior"} 
                    className="w-7 h-7 rounded-full border border-[hsl(var(--ve-accent-cyan)/0.30)] object-cover bg-[hsl(var(--ve-surface-raised)/0.48)] shadow-inner"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* HIGH CONVERTING PROMO STATS RIBBON */}
              {(showWinRate || showDailyWinRate || showMonthlyWinRate || showMlbPicks || showProBadge || showUnitsProfit) && (
                <div className="flex flex-wrap gap-1.5 mt-3 justify-start items-center z-10 relative">
                  {showProBadge && (
                    <span className="text-[7.5px] font-mono tracking-wider text-[hsl(var(--ve-bg-deep))] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[hsl(var(--ve-accent-pink))] shadow-sm border border-[hsl(var(--ve-accent-pink)/0.45)]">
                      ★ {customProTag}
                    </span>
                  )}
                  {showWinRate && (
                    <span className={`text-[7.5px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded ${cardStyle === 'minimal' ? 'bg-sky-100 text-sky-850 border border-sky-200' : 'bg-[hsl(var(--ve-accent-cyan)/0.14)] border border-[hsl(var(--ve-accent-cyan)/0.35)] text-[hsl(var(--ve-accent-cyan))]'}`}>
                      🎯 WR: {customWinRate}
                    </span>
                  )}
                  {showDailyWinRate && (
                    <span className={`text-[7.5px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded ${cardStyle === 'minimal' ? 'bg-amber-100 text-amber-850 border border-amber-250' : 'bg-[hsl(var(--ve-accent-gold)/0.14)] border border-[hsl(var(--ve-accent-gold)/0.35)] text-[hsl(var(--ve-accent-gold))]'}`}>
                      ⚡ DAILY: {customDailyWinRate}
                    </span>
                  )}
                  {showMonthlyWinRate && (
                    <span className={`text-[7.5px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded ${cardStyle === 'minimal' ? 'bg-rose-100 text-rose-850 border border-rose-200' : 'bg-rose-500/15 border border-rose-500/35 text-rose-400'}`}>
                      📆 MONTH: {customMonthlyWinRate}
                    </span>
                  )}
                  {showMlbPicks && (
                    <span className={`text-[7.5px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded ${cardStyle === 'minimal' ? 'bg-teal-100 text-teal-850 border border-teal-200' : 'bg-[hsl(var(--ve-accent-cyan)/0.12)] border border-[hsl(var(--ve-accent-cyan)/0.32)] text-[hsl(var(--ve-accent-cyan))]'}`}>
                      ⚾ PICKS: {customMlbPicks}
                    </span>
                  )}
                  {showUnitsProfit && (
                    <span className={`text-[7.5px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded ${cardStyle === 'minimal' ? 'bg-emerald-100 text-emerald-850 border border-emerald-200' : 'bg-emerald-400/14 border border-emerald-300/35 text-emerald-300'}`}>
                      📈 {unitsProfitValue}
                    </span>
                  )}
                </div>
              )}

              {/* CENTER DISPLAY: PARLAY VS ORBIT VS PLAYER OF THE DAY SHOWCASE */}
              {activeCardLayout === 'parlay' ? (
                /* BEAUTIFUL CUSTOM PARLAY TICKET & RESEARCH CONSOLE CARD BODY */
                (() => {
                  const sharedId = localStorage.getItem('vEdge_preview_shared_parlay_vouch_id');
                  const parlayVouches = savedVouches.filter(v => v.parlay);
                  const activePV = parlayVouches.find(v => v.id === sharedId) || parlayVouches[0];

                  const currentParlay = activePV?.parlay || {
                    title: "Elite MLB Model Sweep Slip",
                    legs: [
                      { selection: "Shohei Ohtani To Hit 1+ HR", game: "Dodgers vs Giants", market: "Batter Home Runs", odds: 2.1 },
                      { selection: "Aaron Judge Over 1.5 Hits", game: "Yankees vs Red Sox", market: "Batter Total Hits", odds: 1.95 }
                    ],
                    totalOdds: "+310",
                    riskTier: "MEDIUM",
                    bookie: "DraftKings",
                    wagerAmount: 100,
                    payoutAmount: 310
                  };

                  const researchNotesText = activePV?.userNote || "Generated parlay slip mapping with correlated platoon indices and optimal weather vector inputs.";

                  return (
                    <div className="my-5 relative z-10 select-none animate-fade-in space-y-4">
                      {/* Ticket header badge */}
                      <div className={`p-4 rounded-2xl ${activeStyle.nodeTagBg} border ${activeStyle.cardBorder} flex justify-between items-center bg-[hsl(var(--ve-surface-raised)/0.34)] backdrop-blur-sm`}>
                        <div className="text-left leading-tight">
                          <span className="text-[8px] uppercase font-mono text-[hsl(var(--ve-accent-pink))] font-bold block tracking-widest">PROP SPEC SLIP</span>
                          <h3 className={`text-xs font-black uppercase tracking-tight truncate max-w-[180px] ${cardStyle === 'minimal' ? 'text-slate-900' : 'text-slate-100'}`}>
                            🎫 {currentParlay.title}
                          </h3>
                        </div>
                        <div className="text-right leading-tight min-w-[70px]">
                          <span className="text-[8px] uppercase font-mono text-[hsl(var(--ve-text-muted))] block">MULTI ODDS</span>
                          <span className="text-[hsl(var(--ve-accent-pink))] font-mono font-black text-sm">{currentParlay.totalOdds}</span>
                        </div>
                      </div>

                      {/* Display legs */}
                      <div className="space-y-2">
                        {currentParlay.legs.map((leg: any, idx: number) => (
                          <div key={idx} className={`p-3 rounded-2xl bg-[hsl(var(--ve-surface-raised)/0.42)] backdrop-blur-sm border ${activeStyle.cardBorder} flex justify-between items-center`}>
                            <div className="text-left space-y-1 min-w-0 flex-1 pr-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[8.5px] font-mono px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                                  idx % 2 === 0 
                                    ? 'bg-[hsl(var(--ve-accent-cyan)/0.14)] border border-[hsl(var(--ve-accent-cyan)/0.30)] text-[hsl(var(--ve-accent-cyan))]' 
                                    : 'bg-purple-500/15 border border-purple-500/30 text-purple-400'
                                }`}>
                                  Leg {idx + 1}
                                </span>
                                <span className="text-[9.5px] text-[hsl(var(--ve-text-muted))] font-mono">{leg.market}</span>
                              </div>
                              <p className={`text-[12px] font-black tracking-tight leading-snug truncate ${cardStyle === 'minimal' ? 'text-slate-900' : 'text-slate-200'}`}>
                                {leg.selection}
                              </p>
                              <p className="text-[10px] text-[hsl(var(--ve-text-muted))] leading-none truncate">
                                ⚾ {leg.game}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-emerald-450 font-mono font-extrabold text-[12px]">
                                {leg.odds > 0 ? (leg.odds >= 2.0 ? `+${Math.round((leg.odds - 1) * 100)}` : `-${Math.round(100 / (leg.odds - 1))}`) : leg.odds}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Financial review */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className={`p-3 rounded-xl bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.28)] flex justify-between items-center`}>
                          <span className="text-[hsl(var(--ve-text-muted))] text-[10px] uppercase">RISK WAGER</span>
                          <strong className="text-[hsl(var(--ve-text-secondary))] font-bold">${currentParlay.wagerAmount || 100}</strong>
                        </div>
                        <div className={`p-3 rounded-xl bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.28)] flex justify-between items-center`}>
                          <span className="text-[hsl(var(--ve-text-muted))] text-[10px] uppercase">POTENTIAL RET</span>
                          <strong className="text-emerald-400 font-extrabold">${currentParlay.payoutAmount || 310}</strong>
                        </div>
                      </div>

                      {/* Dedicated Research Notes under Parlay */}
                      {showReasons && (
                        <div className={`p-4 rounded-2xl ${activeStyle.reasonsBg} border ${activeStyle.cardBorder} text-left space-y-1.5`}>
                          <div className="flex items-center gap-1.5 text-indigo-400">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span className="text-[9px] uppercase tracking-widest font-mono font-black">RESEARCH EDGE MATRIX STATEMENT</span>
                          </div>
                          <p className={`text-[11px] leading-relaxed font-semibold italic ${cardStyle === 'minimal' ? 'text-slate-800' : 'text-slate-200'}`}>
                            "{researchNotesText}"
                          </p>
                        </div>
                      )}

                      {/* Proof Verification Stamp */}
                      <div className="border-t border-[hsl(var(--ve-border)/0.28)] pt-2 flex items-center justify-between font-mono text-[9px] text-[hsl(var(--ve-accent-cyan))] uppercase">
                        <span>★ SECURED PROOF SLIP</span>
                        <span>BOOKMAKER: {currentParlay.bookie || "Market Average"}</span>
                      </div>
                    </div>
                  );
                })()
              ) : activeCardLayout === 'orbit' ? (
                /* CENTER CIRCULAR ORBITING PRESENTATION CONTAINER */
                <div className="w-64 h-64 md:w-72 md:h-72 mx-auto my-4 relative flex items-center justify-center z-10 select-none animate-fade-in">
                  
                  {/* Orbit track circle lines */}
                  <div className={`absolute w-[76%] h-[76%] border ${activeStyle.orbitDashed} rounded-full animate-[spin_120s_linear_infinite]`} />
                  <div className={`absolute w-[56%] h-[56%] border ${activeStyle.orbitRing} rounded-full animate-[spin_80s_linear_infinite_reverse]`} />

                  {/* CENTRAL HUB LOGO OR ORB */}
                  <div className={`absolute z-30 flex flex-col items-center justify-center w-16 h-16 rounded-full ${activeStyle.hubBg} shadow-inner group transition-all`}>
                    <div className={`absolute inset-0 rounded-full ${activeStyle.hubGlow} blur-md transition-all`} />
                    {showLogo ? (
                      <div className="flex flex-col items-center justify-center relative">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${activeStyle.hubVeBg} flex items-center justify-center font-extrabold text-white text-base shadow border`}>
                          VE
                        </div>
                        <span className={`text-[7px] ${activeStyle.hubText} font-bold font-mono tracking-widest uppercase mt-0.5`}>VOUCH</span>
                      </div>
                    ) : (
                      <div className={`w-4 h-4 rounded-full ${activeStyle.ambientPingColor} animate-ping`} />
                    )}
                  </div>

                  {/* ORBITING NODES MAP */}
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
                        {/* Anchor ray linking line from center */}
                        <div 
                          className="absolute -z-10 w-[1px] h-32 rotate-12 origin-top" 
                          style={{
                            backgroundImage: `linear-gradient(to bottom, transparent, ${activeStyle.activeLineColor1}20, transparent)`
                          }}
                        />

                        <div className={`relative p-1 ${cardStyle === 'minimal' ? 'bg-white' : 'bg-slate-950'} rounded-full border-2 ${activeStyle.nodeBorder} transition-colors shadow-xl`}>
                          <img 
                            src={ps.player.headshot} 
                            alt={ps.player.name} 
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-full object-cover bg-slate-900 flex-shrink-0"
                          />
                          
                          {/* Custom overlap highlight value pill */}
                          <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 ${activeStyle.nodeValueBg} text-[8.5px] font-bold font-mono px-1.5 py-0.2 rounded-full shadow-lg leading-none truncate max-w-[90px] text-center`}>
                            {ps.customVal.split('(')[0].trim()}
                          </div>
                        </div>

                        {/* Small player detail tag */}
                        <span className={`text-[9px] font-black ${cardStyle === 'minimal' ? 'text-slate-800' : 'text-slate-200'} mt-1 font-mono uppercase ${activeStyle.nodeTagBg} border ${activeStyle.cardBorder} rounded px-1.5 py-0.2 leading-none whitespace-nowrap`}>
                          {ps.player.name.split(' ').pop()} <span className="text-[hsl(var(--ve-text-muted))] text-[7.5px]">#{ps.player.number}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* SINGLE-PLAYER FEATURED "PLAYER OF THE DAY" SPECIAL PRESENTATION */
                (() => {
                  const featured = selectedPlayers[potdIndex] || selectedPlayers[0] || {
                    player: MLB_PLAYER_RECORDS[0],
                    statType: 'Homeruns' as const,
                    customVal: 'Over 0.5 HRs'
                  };
                  return (
                    <div className="h-56 my-4 relative flex flex-col md:flex-row items-center gap-6 z-10 select-none p-5 rounded-2xl bg-[hsl(var(--ve-surface-raised)/0.38)] border border-[hsl(var(--ve-border)/0.30)] backdrop-blur-md animate-fade-in">
                      
                      {/* Left side: Beautiful glowing physical profile representation */}
                      <div className="relative flex-shrink-0 group">
                        {/* Elegant outer dynamic ring */}
                        <div className={`absolute -inset-2 rounded-full bg-gradient-to-tr ${activeStyle.hubVeBg} opacity-80 blur-md group-hover:scale-105 transition-all duration-300 animate-[spin_12s_linear_infinite]`} />
                        
                        <div className={`relative w-28 h-28 md:w-30 md:h-30 rounded-full p-1 bg-[#060b15] overflow-hidden border-2 flex items-center justify-center shadow-2xl ${activeStyle.nodeBorder}`}>
                          <img
                            src={featured.player.headshot}
                            alt={featured.player.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full rounded-full object-cover bg-slate-950 filter saturate-110"
                          />
                          {/* Modern tech layout scan overlay line */}
                          <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#38bdf8] to-transparent opacity-40 animate-[bounce_3s_infinite]`} />
                        </div>

                        {/* Team Pill & Jersey Sticker overlay */}
                        <span className={`absolute -top-1.5 -right-2.5 py-0.5 px-2 text-[8px] font-mono font-black rounded border whitespace-nowrap uppercase shadow-lg ${activeStyle.brandBadge}`}>
                          {featured.player.team.split(' ').pop()}
                        </span>

                        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 py-0.5 px-2.5 bg-[#060b15] text-[#cbd5e1] text-[9.5px] font-mono font-black rounded-full border border-slate-850 shadow-lg whitespace-nowrap">
                          NO. {featured.player.number}
                        </span>

                        {/* Hot streak Flame sticker */}
                        <div className="absolute -bottom-1 -right-2 bg-amber-500/15 border border-amber-500/30 p-1.5 rounded-full shadow-lg animate-pulse">
                          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        </div>
                      </div>

                      {/* Right side: Information stack */}
                      <div className="flex-1 min-w-0 text-center md:text-left space-y-2">
                        <div>
                          <div className="flex items-center justify-center md:justify-start gap-1 pb-1">
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-[8.5px] font-mono font-black text-[hsl(var(--ve-text-muted))] uppercase tracking-widest leading-none">
                              Featured Model Apex Spot
                            </span>
                          </div>
                          
                          <span className={`text-xl md:text-2xl font-black tracking-tight uppercase block leading-none ${cardStyle === 'minimal' ? 'text-slate-900' : 'text-slate-200'}`}>
                            {featured.player.name}
                          </span>
                        </div>

                        {/* High-visibility prop glass highlight card */}
                        <div className={`p-2.5 rounded-xl border relative overflow-hidden ${activeStyle.nodeTagBg} backdrop-blur-xl`}>
                          <span className="text-[7.5px] font-mono uppercase font-black text-[hsl(var(--ve-text-muted))] block mb-0.5 tracking-wider">
                            VERIFIED PROPOSITION SPEC:
                          </span>
                          <span className={`text-base md:text-lg font-mono font-black block leading-none ${cardStyle === 'minimal' ? 'text-slate-905' : 'text-slate-200'}`}>
                            {featured.customVal.split('(')[0].trim()}
                          </span>
                        </div>

                        {/* Mini statistics row */}
                        <div className="grid grid-cols-3 gap-1.5">
                          <div className="bg-[hsl(var(--ve-surface-raised)/0.34)] p-1 rounded-lg border border-[hsl(var(--ve-border)/0.26)] text-center font-mono">
                            <span className="text-[6px] text-[hsl(var(--ve-text-muted))] uppercase block leading-none">Model Edge</span>
                            <span className="text-[11px] font-black text-amber-400 mt-0.5 block leading-none">94.8%</span>
                          </div>
                          <div className="bg-[hsl(var(--ve-surface-raised)/0.34)] p-1 rounded-lg border border-[hsl(var(--ve-border)/0.26)] text-center font-mono">
                            <span className="text-[6px] text-[hsl(var(--ve-text-muted))] uppercase block leading-none">Season OPS</span>
                            <span className="text-[11px] font-black text-sky-400 mt-0.5 block leading-none">{featured.player.seasonStats.ops}</span>
                          </div>
                          <div className="bg-[hsl(var(--ve-surface-raised)/0.34)] p-1 rounded-lg border border-[hsl(var(--ve-border)/0.26)] text-center font-mono">
                            <span className="text-[6px] text-[hsl(var(--ve-text-muted))] uppercase block leading-none">Total HRs</span>
                            <span className="text-[11px] font-black text-rose-500 mt-0.5 block leading-none">{featured.player.seasonStats.hr}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })()
              )}

              {/* CARD REASONS AND ANALYTICAL EXPLANATIONS SECTION */}
              {showReasons && activeCardLayout !== 'parlay' && (
                <div className={`${activeStyle.reasonsBg} rounded-xl p-3 z-10 relative space-y-1 my-2`}>
                  <span className={`text-[8px] font-mono ${cardStyle === 'minimal' ? 'text-[hsl(var(--ve-text-muted))]' : 'text-[hsl(var(--ve-text-muted))]'} uppercase font-black block tracking-wider`}>
                    Verified Creator Analytical Rationale:
                  </span>
                  <p className={`text-[10px] ${cardStyle === 'minimal' ? 'text-slate-700' : 'text-slate-300'} font-medium italic leading-relaxed`}>
                    "{reasonsText}"
                  </p>
                </div>
              )}

              {/* OPTIONAL PREVIOUS GAMES HISTORIC PERFORMANCE GRAPH */}
              {showCharts && activeCardLayout !== 'parlay' && (
                <div className={`${cardStyle === 'minimal' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950'} rounded-xl border ${activeStyle.cardBorder} p-3 mt-1.5 z-10 relative space-y-2`}>
                  <div className={`flex justify-between items-center text-[8px] font-mono ${cardStyle === 'minimal' ? 'text-[hsl(var(--ve-text-muted))]' : 'text-[hsl(var(--ve-text-muted))]'} uppercase tracking-widest`}>
                    <span>
                      {activeCardLayout === 'potd' 
                        ? `${(selectedPlayers[potdIndex] || selectedPlayers[0])?.player.name}'s Recent Performance Index` 
                        : 'Previous Games Batter Performance Tracking'
                      }
                    </span>
                    <span className={cardStyle === 'minimal' ? 'text-slate-900 font-bold' : 'text-cyan-400 font-bold'}>Source: MLB Statcast API</span>
                  </div>

                  {/* Stunning pure SVG inline line graph plotted dynamically */}
                  <div className="h-14 w-full relative">
                    <svg className="w-full h-full" viewBox="0 0 300 60">
                      {/* Grid background lines */}
                      <line x1="0" y1="10" x2="300" y2="10" stroke={cardStyle === 'minimal' ? '#f1f5f9' : '#121824'} strokeWidth="1" />
                      <line x1="0" y1="30" x2="300" y2="30" stroke={cardStyle === 'minimal' ? '#f1f5f9' : '#121824'} strokeWidth="1" />
                      <line x1="0" y1="50" x2="300" y2="50" stroke={cardStyle === 'minimal' ? '#f1f5f9' : '#121824'} strokeWidth="1" />

                      {/* We will draw custom line strings mapped from coordinates */}
                      {/* Player 1 line: yellow */}
                      <polyline
                        fill="none"
                        stroke={activeStyle.activeLineColor1}
                        strokeWidth="1.5"
                        strokeDasharray={activeCardLayout === 'potd' ? '0' : '2'}
                        points="10,45 70,15 130,35 190,5 250,25 290,10"
                      />
                      {/* Player 2 line: orange */}
                      <polyline
                        fill="none"
                        stroke={activeStyle.activeLineColor2}
                        strokeWidth="1.5"
                        points="10,25 70,50 130,10 190,30 250,15 290,40"
                      />

                      {/* Coordinates nodes */}
                      <circle cx="130" cy="35" r="2.5" fill={activeStyle.activeLineColor1} />
                      <circle cx="190" cy="5" r="2.5" fill={activeStyle.activeLineColor1} className="animate-pulse" />
                      <circle cx="130" cy="10" r="2.5" fill={activeStyle.activeLineColor2} />
                      <circle cx="250" cy="15" r="2.5" fill={activeStyle.activeLineColor2} className="animate-pulse" />

                      {/* Annotations */}
                      <text x="5" y="55" fill="#64748b" fontSize="5" fontFamily="monospace">G-5</text>
                      <text x="65" y="55" fill="#64748b" fontSize="5" fontFamily="monospace">G-4</text>
                      <text x="125" y="55" fill="#64748b" fontSize="5" fontFamily="monospace">G-3</text>
                      <text x="185" y="55" fill="#64748b" fontSize="5" fontFamily="monospace">G-2</text>
                      <text x="245" y="55" fill="#64748b" fontSize="5" fontFamily="monospace">LOCKED ACTIVE</text>
                    </svg>

                    {/* Interactive label layout overlay */}
                    <div className={`absolute top-1 right-2 flex items-center gap-2 text-[7.5px] font-mono uppercase ${activeStyle.nodeTagBg} p-0.5 rounded px-1.5 border ${activeStyle.cardBorder}`}>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeStyle.activeLineColor1 }}></span> 
                        {activeCardLayout === 'potd' 
                          ? `${(selectedPlayers[potdIndex] || selectedPlayers[0])?.player.name.split(' ').pop()} progression` 
                          : activeStyle.labelText
                        }
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeStyle.activeLineColor2 }}></span> 
                        {activeCardLayout === 'potd' 
                          ? 'League Baseline Model' 
                          : activeStyle.labelText2
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* BEST PARLAY PICK HERO LABEL */}
              {showBestParlay && (
                <div className={`mt-2 p-2.5 rounded-xl border relative overflow-hidden z-10 text-left ${cardStyle === 'minimal' ? 'bg-amber-50/60 border-amber-250' : 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30'}`}>
                  <div className="absolute top-0 right-0 py-0.5 px-2 bg-amber-500 text-slate-950 text-[7px] font-mono font-black uppercase tracking-widest rounded-bl-lg">
                    HOT PARLAY
                  </div>
                  <span className="text-[7.5px] font-mono uppercase font-black text-[hsl(var(--ve-text-muted))] block mb-0.5 tracking-wider">
                    ⭐ RECOMMENDED CORRELATED PARLAY PICK:
                  </span>
                  <span className={`text-[11px] font-bold block leading-snug ${cardStyle === 'minimal' ? 'text-slate-900' : 'text-amber-300'}`}>
                    {bestParlayDesc}
                  </span>
                </div>
              )}

              {/* PRO SUBSCRIPTION DISCOUNT COUPON */}
              {showCoupon && (
                <div className={`mt-2 p-2 px-3 rounded-xl border flex justify-between items-center relative overflow-hidden z-10 text-left ${cardStyle === 'minimal' ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-sky-500/5 border-sky-500/20 text-[#38bdf8]'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] leading-none">🎟️</span>
                    <div className="text-left leading-none">
                      <span className="text-[7.5px] font-mono text-[hsl(var(--ve-text-muted))] block uppercase">Promote Coupon Premium Offer:</span>
                      <span className={`text-[10px] font-black ${cardStyle === 'minimal' ? 'text-slate-800' : 'text-slate-250'}`}>{couponText}</span>
                    </div>
                  </div>
                  <div className="bg-sky-500 text-white text-[9.5px] font-mono font-extrabold px-2.5 py-1 rounded-lg tracking-wider border border-[var(--ve-border-strong)] leading-none">
                    CODE: {couponCode}
                  </div>
                </div>
              )}

              {/* BRAND CARD FOOTER WITH TIMESTAMP */}
              <div className={`border-t ${activeStyle.cardBorder} pt-3 mt-3 flex justify-between items-center text-[8.5px] font-mono text-[hsl(var(--ve-text-muted))] z-10 relative`}>
                <div>
                  <span>WATERMARK ARCHIVE:</span>
                  <span className={`${activeStyle.footerUrlColor} ml-1`}>vouchedge.ai/{profile?.username || "Zhavior"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 ${activeStyle.ambientPingColor} rounded-full animate-ping`}></span>
                  <span>{formattedToday} • VERIFIED TRANSPARENT STAKE</span>
                </div>
              </div>

            </div>
              )}

            {/* Optional Companion Analytics Card */}
            {showSecondCard && (postSideways || activePreviewCardIndex === 1) && (
                <div 
                  className={`relative group/studio-card ${activeStyle.bg} rounded-3xl p-6 relative overflow-hidden shadow-2xl flex flex-col justify-between aspect-[3/4.2] min-h-[650px] max-w-[490px] mx-auto w-full flex-1 animate-fade-in`}
                  style={customCardPhoto ? {
                    backgroundImage: `linear-gradient(${cardStyle === 'minimal' ? 'rgba(255, 255, 255, 0.88)' : 'rgba(10, 15, 30, 0.85)'}, ${cardStyle === 'minimal' ? 'rgba(255, 255, 255, 0.94)' : 'rgba(10, 15, 30, 0.95)'}), url(${customCardPhoto})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  } : undefined}
                >
                  {/* Background design elements */}
                  <div className={`absolute inset-0 ${activeStyle.radialGrad} pointer-events-none`} />
                  <div className={`absolute top-0 right-0 w-32 h-32 ${activeStyle.cornerLight1} rounded-full blur-3xl pointer-events-none`} />
                  <div className={`absolute bottom-0 left-0 w-32 h-32 ${activeStyle.cornerLight2} rounded-full blur-3xl pointer-events-none`} />

                  {/* Header of companion card */}
                  <div className={`flex justify-between items-center pb-4 border-b ${cardStyle === 'minimal' ? 'border-slate-200' : 'border-slate-900/80'} z-10 relative`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${activeStyle.hubVeBg} flex items-center justify-center text-white font-extrabold text-sm border`}>
                        VE
                      </div>
                      <div className="leading-none text-left">
                        <span className={`text-[11px] font-black tracking-widest ${activeStyle.headerTitleColor} uppercase`}>Vouch<span className={cardStyle === 'minimal' ? 'text-slate-900' : 'text-[hsl(var(--ve-accent-cyan))]'}>Insight</span></span>
                        <span className={`text-[8px] font-mono font-bold ${activeStyle.headerSubTitleColor} block uppercase mt-0.5`}>COMPANION METRICS INDEX</span>
                      </div>
                    </div>
                    
                    <div className="text-right flex items-center gap-2">
                      <div className="text-right leading-none">
                        <span className={`text-[10px] font-extrabold block uppercase ${cardStyle === 'minimal' ? 'text-slate-800' : 'text-slate-200'}`}>
                          {profile?.displayName || "Zhavior"}
                        </span>
                        <span className="text-[8.5px] text-[hsl(var(--ve-accent-cyan))] font-mono tracking-tight block mt-0.5">
                          @{profile?.username || "Zhavior"} • {formattedToday}
                        </span>
                      </div>
                      <img 
                        src={profile?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"} 
                        alt={profile?.displayName || "Zhavior"} 
                        className="w-7 h-7 rounded-full border border-[hsl(var(--ve-accent-cyan)/0.30)] object-cover bg-[hsl(var(--ve-surface-raised)/0.48)] shadow-inner"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* HIGH CONVERTING PROMO STATS RIBBON FOR CARD 2 */}
                  {(showWinRate || showDailyWinRate || showMonthlyWinRate || showMlbPicks || showProBadge || showUnitsProfit) && (
                    <div className="flex flex-wrap gap-1.5 mt-3 justify-start items-center z-10 relative">
                      {showProBadge && (
                        <span className="text-[7.5px] font-mono tracking-wider text-[hsl(var(--ve-bg-deep))] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[hsl(var(--ve-accent-pink))] shadow-sm border border-[hsl(var(--ve-accent-pink)/0.45)]">
                          ★ {customProTag}
                        </span>
                      )}
                      {showWinRate && (
                        <span className={`text-[7.5px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded ${cardStyle === 'minimal' ? 'bg-sky-100 text-sky-850 border border-sky-200' : 'bg-[hsl(var(--ve-accent-cyan)/0.14)] border border-[hsl(var(--ve-accent-cyan)/0.35)] text-[hsl(var(--ve-accent-cyan))]'}`}>
                          🎯 WR: {customWinRate}
                        </span>
                      )}
                      {showDailyWinRate && (
                        <span className={`text-[7.5px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded ${cardStyle === 'minimal' ? 'bg-amber-100 text-amber-850 border border-amber-250' : 'bg-[hsl(var(--ve-accent-gold)/0.14)] border border-[hsl(var(--ve-accent-gold)/0.35)] text-[hsl(var(--ve-accent-gold))]'}`}>
                          ⚡ DAILY: {customDailyWinRate}
                        </span>
                      )}
                      {showMonthlyWinRate && (
                        <span className={`text-[7.5px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded ${cardStyle === 'minimal' ? 'bg-rose-100 text-rose-850 border border-rose-200' : 'bg-[hsl(var(--ve-accent-pink)/0.14)] border border-[hsl(var(--ve-accent-pink)/0.35)] text-[hsl(var(--ve-accent-pink))]'}`}>
                          📆 MONTH: {customMonthlyWinRate}
                        </span>
                      )}
                      {showMlbPicks && (
                        <span className={`text-[7.5px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded ${cardStyle === 'minimal' ? 'bg-teal-100 text-teal-850 border border-teal-200' : 'bg-[hsl(var(--ve-accent-cyan)/0.12)] border border-[hsl(var(--ve-accent-cyan)/0.32)] text-[hsl(var(--ve-accent-cyan))]'}`}>
                          ⚾ PICKS: {customMlbPicks}
                        </span>
                      )}
                      {showUnitsProfit && (
                        <span className={`text-[7.5px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded ${cardStyle === 'minimal' ? 'bg-emerald-100 text-emerald-850 border border-emerald-200' : 'bg-emerald-400/14 border border-emerald-300/35 text-emerald-300'}`}>
                          📈 {unitsProfitValue}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Central stack of selected players with mini graph & confidence dials */}
                  <div className="space-y-4 my-4 z-10 relative flex-1 flex flex-col justify-center max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                    {activeCardLayout === 'potd' ? (
                      // Dedicated Single Player of the Day Companion View
                      (() => {
                        const ps = selectedPlayers[potdIndex] || selectedPlayers[0];
                        if (!ps) return <div className="text-center text-xs text-slate-555">No Player Selected</div>;
                        const explanation = ps.customExplanation || "Extreme velocity projections coupled with favorable horizontal break offsets.";
                        const player = ps.player;
                        const metrics = getPlayerSpotlightMetrics(ps);

                        return (
                          <div className="space-y-4 animate-fade-in text-left">
                            {/* Profile item header with headshot */}
                            <div className={`p-4 rounded-xl border ${activeStyle.nodeTagBg} ${activeStyle.cardBorder} flex flex-col md:flex-row md:items-center justify-between gap-3`}>
                              <div className="flex items-center gap-3">
                                <img 
                                  src={player.headshot} 
                                  alt={player.name}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-500 bg-slate-950"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="leading-tight text-left">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-base font-black uppercase ${cardStyle === 'minimal' ? 'text-slate-900' : 'text-amber-400'}`}>
                                      {player.name}
                                    </span>
                                    <span className="text-[9px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-300 px-1.5 py-0.2 rounded font-extrabold uppercase">SPOTLIGHT MATCHUP</span>
                                  </div>
                                  <span className="text-xs font-mono text-[hsl(var(--ve-text-muted))] uppercase block mt-0.5">
                                    {player.team} · #{player.number} · {player.position}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[7.5px] font-mono text-[hsl(var(--ve-text-muted))] uppercase block">VAI SABERMETRIC EDGE</span>
                                <span className={`text-sm font-black font-mono tracking-tight uppercase ${cardStyle === 'minimal' ? 'text-slate-900' : 'text-emerald-400'}`}>
                                  {metrics.edgeFactorVal} Index
                                </span>
                              </div>
                            </div>

                            {/* Pitcher Matchup Stats Grid */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-[hsl(var(--ve-surface-raised)/0.36)] p-2.5 rounded-xl border border-[hsl(var(--ve-border)/0.28)] text-center font-mono">
                                <span className="text-[6.5px] text-[hsl(var(--ve-text-muted))] uppercase block tracking-wider leading-none mb-1">VS PITCHER ERA</span>
                                <span className="text-rose-400 font-black block text-sm leading-none">{metrics.pitcherEra}</span>
                                <span className="text-[6.5px] text-[hsl(var(--ve-text-muted))] block mt-1 uppercase truncate font-bold">{metrics.pitcherName} ({metrics.pitcherHand})</span>
                              </div>
                              <div className="bg-[hsl(var(--ve-surface-raised)/0.36)] p-2.5 rounded-xl border border-[hsl(var(--ve-border)/0.28)] text-center font-mono">
                                <span className="text-[6.5px] text-[hsl(var(--ve-text-muted))] uppercase block tracking-wider leading-none mb-1">10G HIT RATE</span>
                                <span className="text-emerald-400 font-black block text-sm leading-none">{metrics.hitRateLast10}%</span>
                                <span className="text-[6.5px] text-[hsl(var(--ve-text-muted))] block mt-1 uppercase font-bold">LAST 10 GAMES</span>
                              </div>
                              <div className="bg-[hsl(var(--ve-surface-raised)/0.36)] p-2.5 rounded-xl border border-[hsl(var(--ve-border)/0.28)] text-center font-mono">
                                <span className="text-[6.5px] text-[hsl(var(--ve-text-muted))] uppercase block tracking-wider leading-none mb-1">PLAY/START RATE</span>
                                <span className="text-[hsl(var(--ve-accent-cyan))] font-black block text-sm leading-none">{metrics.playRatePercent}%</span>
                                <span className="text-[6.5px] text-[hsl(var(--ve-text-muted))] block mt-1 uppercase font-bold">PLATE SECURITY</span>
                              </div>
                            </div>

                            {/* Deep Splits Comparison */}
                            <div className="grid grid-cols-2 gap-3 text-[10px] font-mono bg-[hsl(var(--ve-surface-raised)/0.24)] p-3 rounded-xl border border-[hsl(var(--ve-border)/0.24)]">
                              <div className="space-y-1.5 text-left">
                                <span className="text-[7.5px] font-black text-[hsl(var(--ve-text-muted))] uppercase block tracking-wider border-b border-slate-900 pb-1">PLAYER STAT PLURALS</span>
                                <div className="space-y-1 text-slate-300">
                                  <div className="flex justify-between"><span>vs {metrics.pitcherHand}:</span><strong className="text-white">{metrics.pitcherHand === 'RHP' ? player.splits?.vRHP?.ops || "1.067" : player.splits?.vLHP?.ops || "0.958"} OPS</strong></div>
                                  <div className="flex justify-between"><span>Last 10 OPS:</span><strong className="text-emerald-400">{player.splits?.last10?.ops || "1.150"}</strong></div>
                                  <div className="flex justify-between"><span>Exit Velocity:</span><strong className="text-sky-400">{player.advanced?.exitVelocity || "94.7"} mph</strong></div>
                                </div>
                              </div>
                              <div className="space-y-1.5 border-l border-slate-900/60 pl-3 text-left">
                                <span className="text-[7.5px] font-black text-[hsl(var(--ve-text-muted))] uppercase block tracking-wider border-b border-slate-900 pb-1">PITCHER ARSENAL BREAKS</span>
                                <div className="space-y-1 text-slate-300">
                                  <div className="flex justify-between"><span>ERA Baseline:</span><strong className="text-rose-400">{metrics.pitcherEra}</strong></div>
                                  <div className="flex justify-between"><span>Favored Mix:</span><strong className="text-amber-400 truncate max-w-[85px]" title={metrics.pitchTypeFavored}>{metrics.pitchTypeFavored.split('(')[0].replace('vs ', '')}</strong></div>
                                  <div className="flex justify-between"><span>Launch Angle:</span><strong className="text-sky-400">{player.advanced?.launchAngle || "15.2"}°</strong></div>
                                </div>
                              </div>
                            </div>

                            {/* Modeling Equation explain card */}
                            <div className="bg-emerald-950/15 border border-emerald-900/30 p-3 rounded-lg text-left text-[9px] font-mono leading-relaxed space-y-1.5">
                              <div className="flex items-center gap-1.5 font-bold text-emerald-400 uppercase tracking-widest text-[8px]">
                                <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>Sabermetric Matchup Probability Formula:</span>
                              </div>
                              <p className="text-slate-300 font-mono text-[9px] bg-black/35 px-2.5 py-1 rounded border border-slate-900/50">
                                {metrics.mathFormula}
                              </p>
                              <p className="text-[hsl(var(--ve-text-muted))] leading-normal text-[8px] italic">
                                {metrics.edgeMathProof}
                              </p>
                            </div>

                            {/* Scouting narrative text */}
                            <div className={`p-3 rounded-xl border ${activeStyle.reasonsBg} space-y-1 text-left`}>
                              <span className="text-[7.5px] font-mono uppercase font-black text-[hsl(var(--ve-text-muted))] block tracking-widest leading-none">Scouting Narrative & Playbook Strategy:</span>
                              <p className={`text-[10px] italic leading-relaxed ${cardStyle === 'minimal' ? 'text-slate-800' : 'text-slate-200'}`}>
                                "{explanation}"
                              </p>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      selectedPlayers.map((ps, idx) => {
                        // Mini trend data points for custom sparkline
                        const mockSparkPoints = idx % 3 === 0 
                          ? "5,25 35,5 65,15 95,8" 
                          : idx % 3 === 1 
                          ? "5,8 35,28 65,12 95,20" 
                          : "5,18 35,15 65,28 95,6";
                        const aiConf = ps.aiConfidence ?? (idx % 3 === 0 ? 94 : idx % 3 === 1 ? 91 : 88);
                        const pConf = ps.playerConfidence ?? (idx % 3 === 0 ? 88 : idx % 3 === 1 ? 85 : 92);
                        const explanation = ps.customExplanation || (
                          idx % 3 === 0 
                            ? "Extreme velocity projections coupled with favorable horizontal break offsets."
                            : idx % 3 === 1 
                            ? "Hard hit statistics map with precise historical strike-zone control factors."
                            : "Elite base running indicators with maximum scoring index tonight."
                        );

                        return (
                          <div 
                            key={ps.player.id} 
                            className={`p-3 rounded-xl border ${activeStyle.nodeTagBg} ${activeStyle.cardBorder} flex flex-col gap-2`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <img 
                                  src={ps.player.headshot} 
                                  alt={ps.player.name}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-700 bg-slate-950"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="leading-none text-left">
                                  <span className={`text-xs font-black block uppercase ${cardStyle === 'minimal' ? 'text-slate-900' : 'text-slate-100'}`}>
                                    {ps.player.name}
                                  </span>
                                  <span className="text-[7.5px] font-mono text-[hsl(var(--ve-text-muted))] uppercase">
                                    {ps.player.team.split(' ').pop()} · NO. {ps.player.number}
                                  </span>
                                </div>
                              </div>

                              {/* Useful sparkline graph representation */}
                              <div className="w-18 h-6 bg-black/10 rounded-lg p-1 border border-slate-900/45 flex items-center justify-center">
                                <svg className="w-full h-full" viewBox="0 0 100 30">
                                  <polyline 
                                    fill="none" 
                                    stroke={activeStyle.activeLineColor1} 
                                    strokeWidth="1.5" 
                                    points={mockSparkPoints} 
                                  />
                                  <circle cx="95" cy={mockSparkPoints.split(" ").pop()?.split(",")[1]} r="2" fill={activeStyle.activeLineColor1} />
                                </svg>
                              </div>
                            </div>

                            {/* Confidence levels row */}
                            <div className="grid grid-cols-2 gap-3 text-[10px] font-mono bg-black/15 p-1.5 rounded-lg border border-slate-900/60">
                              <div className="flex items-center justify-between px-1 border-r border-slate-900/50">
                                <span className="text-[hsl(var(--ve-text-muted))] text-[8px] uppercase">V.A.I CONFID.</span>
                                <span className={`font-extrabold ${cardStyle === 'minimal' ? 'text-sky-600' : 'text-[var(--ve-accent)]'}`}>{aiConf}%</span>
                              </div>
                              <div className="flex items-center justify-between px-1">
                                <span className="text-[hsl(var(--ve-text-muted))] text-[8px] uppercase">PLAYER COEF.</span>
                                <span className={`font-extrabold ${cardStyle === 'minimal' ? 'text-amber-600' : 'text-amber-500'}`}>{pConf}%</span>
                              </div>
                            </div>

                            {/* Custom user explanation bullet */}
                            <div className={`text-[9.5px] leading-relaxed italic ${cardStyle === 'minimal' ? 'text-slate-600' : 'text-slate-300'} text-left`}>
                              "{explanation}"
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* BEST PARLAY PICK HERO LABEL FOR CARD 2 */}
                  {showBestParlay && (
                    <div className={`mt-2 p-2.5 rounded-xl border relative overflow-hidden z-10 text-left ${cardStyle === 'minimal' ? 'bg-amber-50/60 border-amber-250' : 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30'}`}>
                      <div className="absolute top-0 right-0 py-0.5 px-2 bg-amber-500 text-slate-950 text-[7px] font-mono font-black uppercase tracking-widest rounded-bl-lg">
                        HOT PARLAY
                      </div>
                      <span className="text-[7.5px] font-mono uppercase font-black text-[hsl(var(--ve-text-muted))] block mb-0.5 tracking-wider">
                        ⭐ RECOMMENDED CORRELATED PARLAY PICK:
                      </span>
                      <span className={`text-[11px] font-bold block leading-snug ${cardStyle === 'minimal' ? 'text-slate-900' : 'text-amber-300'}`}>
                        {bestParlayDesc}
                      </span>
                    </div>
                  )}

                  {/* PRO SUBSCRIPTION DISCOUNT COUPON FOR CARD 2 */}
                  {showCoupon && (
                    <div className={`mt-2 p-2 px-3 rounded-xl border flex justify-between items-center relative overflow-hidden z-10 text-left ${cardStyle === 'minimal' ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-sky-500/5 border-sky-500/20 text-[#38bdf8]'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] leading-none">🎟️</span>
                        <div className="text-left leading-none">
                          <span className="text-[7.5px] font-mono text-[hsl(var(--ve-text-muted))] block uppercase">Promote Coupon Premium Offer:</span>
                          <span className={`text-[10px] font-black ${cardStyle === 'minimal' ? 'text-slate-800' : 'text-slate-250'}`}>{couponText}</span>
                        </div>
                      </div>
                      <div className="bg-sky-500 text-white text-[9.5px] font-mono font-extrabold px-2.5 py-1 rounded-lg tracking-wider border border-[var(--ve-border-strong)] leading-none">
                        CODE: {couponCode}
                      </div>
                    </div>
                  )}

                  {/* Slide Back Arrow to Card 1 */}
                  {showSecondCard && !postSideways && activePreviewCardIndex === 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePreviewCardIndex(0);
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-[hsl(var(--ve-surface)/0.90)] hover:bg-[hsl(var(--ve-surface-raised)/0.92)] border border-[hsl(var(--ve-border)/0.34)] text-[hsl(var(--ve-accent-cyan))] rounded-full transition-all duration-250 opacity-0 group-hover/studio-card:opacity-100 shadow-2xl shadow-[hsl(var(--ve-shadow)/0.22)] cursor-pointer z-50 flex items-center justify-center hover:scale-105 active:scale-95"
                      title="Slide to Primary Card"
                      id="studio-slide-prev-btn"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  )}

                  {/* Indicator info for sliding */}
                  {showSecondCard && !postSideways && (
                    <div className="absolute top-20 right-4 bg-[hsl(var(--ve-surface)/0.82)] rounded-full py-1 px-3 border border-[hsl(var(--ve-border)/0.32)] text-[9px] font-mono text-[hsl(var(--ve-text-muted))] font-bold z-40 shadow flex gap-1.5 items-center backdrop-blur-xl">
                      <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--ve-accent-pink))] animate-pulse" />
                      CARD 2 / 2
                    </div>
                  )}

                  {/* Brand Footer for companion card */}
                  <div className={`border-t ${activeStyle.cardBorder} pt-3 mt-3 flex justify-between items-center text-[8.5px] font-mono text-[hsl(var(--ve-text-muted))] z-10 relative`}>
                    <div>
                      <span>INSIGHT ALIAS:</span>
                      <span className={`${activeStyle.footerUrlColor} ml-1`}>analytics.vouchedge.ai/{profile?.username || "Zhavior"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 ${activeStyle.ambientPingColor} rounded-full animate-ping`}></span>
                      <span>{formattedToday} • TRANSCRIPT VALIDATED</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </div>

            {/* ACTION TRIGGERS PANEL */}
            <div className="grid grid-cols-2 gap-3" id="vouch-studio-share-bar">
              <button
                onClick={handleSimulateXPost}
                className="py-3 px-4 bg-[linear-gradient(90deg,hsl(var(--ve-accent-cyan)),hsl(var(--ve-accent-pink)))] hover:brightness-110 text-[hsl(var(--ve-bg-deep))] font-bold text-xs rounded-xl shadow-lg shadow-[hsl(var(--ve-accent-cyan)/0.22)] transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 font-mono uppercase"
              >
                <Share2 className="w-4 h-4 text-[hsl(var(--ve-bg-deep))]" />
                <span>Publish to Twitter / X 🐦</span>
              </button>

              <button
                onClick={handlePublishAsFeedPost}
                disabled={isPublishingToFeed}
                className={`py-3 px-4 font-mono font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase ${
                  isPublishingToFeed 
                    ? 'bg-[hsl(var(--ve-surface-raised)/0.42)] border border-[hsl(var(--ve-border)/0.28)] text-[hsl(var(--ve-text-muted))] cursor-not-allowed'
                    : 'bg-[hsl(var(--ve-surface-raised)/0.44)] hover:bg-[hsl(var(--ve-surface-raised)/0.62)] border border-[hsl(var(--ve-accent-pink)/0.32)] text-[hsl(var(--ve-text-primary))]'
                }`}
              >
                <Tv className="w-4 h-4 text-emerald-300" />
                <span>{isPublishingToFeed ? 'Publishing...' : 'Save to VouchEdge Feed'}</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* TAB SUB-VIEW 2: ORIGINAL SAVED VOUCH BOARD CARD LIST */}
      {activeBoardTab === 'saved' && (
        <div className="space-y-4 animate-fade-in" id="vouch-board-saved-ledger">
          
          <div className="p-4 bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.28)] rounded-2xl flex items-start gap-3 shadow-lg shadow-[hsl(var(--ve-shadow)/0.10)]">
            <Info className="w-4.5 h-4.5 text-[hsl(var(--ve-accent-gold))] shrink-0 mt-0.5" />
            <div className="text-xs text-[hsl(var(--ve-text-muted))] leading-relaxed font-semibold">
              <span className="text-[hsl(var(--ve-accent-gold))] font-extrabold uppercase">Feed-Added Micro-Ledger:</span> 
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
                  Head over to the <strong className="text-[hsl(var(--ve-accent-cyan))]">Home Feed</strong> or browse <strong className="text-[hsl(var(--ve-accent-cyan))]">V.A.I Smart Picks</strong>. 
                  Clicking "Save to Board" will harvest those game props, placing them in this secured ledger block!
                </p>
              </div>
            </div>
          ) : (
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
                <div className="w-8 h-8 rounded-full bg-[hsl(var(--ve-surface-raised)/0.56)] font-bold text-[hsl(var(--ve-accent-cyan))] flex items-center justify-center text-xs border border-[hsl(var(--ve-accent-cyan)/0.30)] shrink-0">
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
                    <div className="w-14 h-14 rounded-full bg-[hsl(var(--ve-surface-raised)/0.52)] border border-[hsl(var(--ve-border)/0.30)] flex items-center justify-center font-bold text-[8px] text-[hsl(var(--ve-accent-cyan))] relative overflow-hidden flex-shrink-0">
                      {/* Miniature representation */}
                      <div className="absolute w-8 h-8 border border-dashed border-[hsl(var(--ve-accent-cyan)/0.16)] rounded-full animate-spin" />
                      <span className="text-[hsl(var(--ve-accent-cyan))] font-black">VE</span>
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
                className="flex-1 py-2 px-3 bg-[hsl(var(--ve-accent-cyan))] hover:brightness-110 text-[hsl(var(--ve-bg-deep))] rounded-xl text-center shadow-lg shadow-[hsl(var(--ve-accent-cyan)/0.20)]"
              >
                Publish Simulation ✓
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
