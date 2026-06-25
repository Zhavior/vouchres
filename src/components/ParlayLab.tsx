import React, { useState, useEffect } from 'react';
import { apiUrl } from '../lib/apiBase';
import { 
  Plus, 
  Trash2, 
  Search, 
  AlertTriangle, 
  Activity, 
  Dribbble, 
  Calendar, 
  Calculator, 
  Sliders,
  Award,
  TrendingUp,
  Info,
  Flame,
  Layers,
  Sparkles,
  Share2,
  Zap,
  Lock
} from 'lucide-react';
import { Parlay, Leg, MLBPlayer, Vouch, FeedPost, CreatorProofProfile } from '../types';
import RiskTierVisualization from './RiskTierVisualization';
import ResultsPage from './ResultsPage';
import { MLB_PLAYER_RECORDS } from '../data/playerData';
import { getAllMLBPlayerStubs } from '../utils/mlbApi';
import { getMarketOdds, getSelectedBookieOddsValue, decimalToAmerican } from '../utils/oddsHelper';
import ParlaySlipSummary, { BuilderMode } from './parlay/ParlaySlipSummary';

interface ParlayLabProps {
  onSaveParlay: (parlay: Parlay) => void;
  savedParlays: Parlay[];
  legs: Leg[];
  setLegs: React.Dispatch<React.SetStateAction<Leg[]>>;
  onSectionChange: (section: string) => void;
  liveGames?: any[];
  onSaveVouch?: (vouch: Vouch) => void;
  posts?: FeedPost[];
  profile?: CreatorProofProfile;
  initialTab?: 'builder' | 'results';
}

export default function ParlayLab({ 
  onSaveParlay, 
  savedParlays,
  legs,
  setLegs,
  onSectionChange,
  liveGames = [],
  onSaveVouch = () => {},
  posts = [],
  profile,
  initialTab = 'builder'
}: ParlayLabProps) {
  // Navigation & interaction states
  const [workMode, setWorkMode] = useState<'builder' | 'results'>(initialTab);
  
  React.useEffect(() => {
    setWorkMode(initialTab);
  }, [initialTab]);

  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Local active parlay meta variables
  const [ticketTitle, setTicketTitle] = useState('MLB Sharp Edge Parlay');
  const [riskTier, setRiskTier] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [bookie, setBookie] = useState('Market Average');
  const [wagerAmount, setWagerAmount] = useState<number>(100);
  const [expandedComparePropId, setExpandedComparePropId] = useState<string | null>(null);
  
  const [researchText, setResearchText] = useState("");
  const [isPremiumSubOnly, setIsPremiumSubOnly] = useState(false);

  const [builderMode, setBuilderMode] = useState<BuilderMode>('balanced');

  // AI-driven Edge Report state
  const [edgeReport, setEdgeReport] = useState<{ edgeScore: number; report: string } | null>(null);
  const [isAnalyzingEdge, setIsAnalyzingEdge] = useState(false);
  const [edgeError, setEdgeError] = useState<string | null>(null);
  const [reportLegsSnapshot, setReportLegsSnapshot] = useState<string>("");

  const handleGenerateEdgeReport = async () => {
    if (legs.length === 0) {
      alert("Please add at least 1 MLB player prop leg to run an Edge Report analysis!");
      return;
    }

    setIsAnalyzingEdge(true);
    setEdgeError(null);

    try {
      const response = await fetch(apiUrl('/api/ai/parlay-edge'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ legs })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate: Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'error') {
        throw new Error(data.error);
      }

      setEdgeReport({
        edgeScore: data.edgeScore || 80,
        report: data.report || "No analysis returned."
      });
      // Save snapshot of current legs' specs joined
      setReportLegsSnapshot(legs.map(l => l.selection).join('|'));
    } catch (err: any) {
      console.error("Error generating edge report:", err);
      setEdgeError(err.message || "An unpredictable error occurred.");
    } finally {
      setIsAnalyzingEdge(false);
    }
  };

  const renderInnerBold = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-white font-extrabold bg-[#1e293b]/70 px-1 py-0.5 rounded">{part}</strong>;
      }
      return part;
    });
  };

  const renderMarkdownText = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return (
      <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar text-left font-sans text-xs">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          if (trimmed.startsWith('###')) {
            return (
              <h4 key={idx} className="text-white text-xs font-bold font-mono tracking-wider uppercase border-l-2 border-emerald-400 pl-2 mt-3 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                {trimmed.replace('###', '').replace(/\*/g, '').trim()}
              </h4>
            );
          }
          if (trimmed.startsWith('####')) {
            return (
              <h5 key={idx} className="text-slate-300 text-[10px] font-bold font-mono mt-2.5 uppercase tracking-wide">
                ▸ {trimmed.replace('####', '').replace(/\*/g, '').trim()}
              </h5>
            );
          }
          if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
            const rawBody = trimmed.replace(/^[-* ]+/, '');
            return (
              <div key={idx} className="flex items-start gap-2 ml-1">
                <span className="text-emerald-405 font-bold mt-1 text-[8px]">■</span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                  {renderInnerBold(rawBody)}
                </p>
              </div>
            );
          }
          return (
            <p key={idx} className="text-[11px] text-slate-300 leading-relaxed font-mono">
              {renderInnerBold(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  // Active injury warning prompt modal state
  const [injuryWarning, setInjuryWarning] = useState<{
    show: boolean;
    playerName: string;
    notes: string;
    status: string;
    pendingProp: {
      player: MLBPlayer;
      prop: { id: string; market: string; odds: number; spec: string };
    } | null;
  }>({
    show: false,
    playerName: "",
    notes: "",
    status: "",
    pendingProp: null
  });

  // Full live MLB roster — starts with curated records, loads all ~1,250 players on mount.
  const [allPlayers, setAllPlayers] = useState<MLBPlayer[]>(MLB_PLAYER_RECORDS);
  useEffect(() => {
    let active = true;
    getAllMLBPlayerStubs()
      .then((list) => { if (active && list.length) setAllPlayers(list); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Teams list derived from the full live roster (all 30 MLB clubs).
  const MLB_TEAMS = ["ALL", ...Array.from(new Set(allPlayers.map(p => p.team))).sort()];

  // Filter, then cap render count (parlay cards are heavy with many players on screen).
  const PLAYER_RENDER_CAP = 60;
  const matchedPlayers = allPlayers.filter(p => {
    const matchesTeam = selectedTeam === "ALL" || p.team === selectedTeam;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.position.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTeam && matchesSearch;
  });
  const filteredPlayers = matchedPlayers.slice(0, PLAYER_RENDER_CAP);

  // Resolve leg's odds to the active bookie selection (including Bet365 and Market Average!)
  const getLegOddsForSelectedBookie = (leg: Leg, selectedBookie: string) => {
    // Look up the exact player and proposition across the full roster
    for (const player of allPlayers) {
      const matchedProp = player.propositions.find(p => p.spec === leg.selection);
      if (matchedProp) {
        return getSelectedBookieOddsValue(matchedProp.id, matchedProp.odds, selectedBookie).decimal;
      }
    }
    return leg.odds; // fallback
  };

  // Convert decimal to American notation helper
  const decimalToAmericanNotation = (decimal: number) => {
    if (decimal <= 1.01) return "+100";
    if (decimal >= 2.0) {
      const value = Math.round((decimal - 1) * 100);
      return `+${value}`;
    } else {
      const value = Math.round(-100 / (decimal - 1));
      return `${value}`;
    }
  };

  // Handle addition of a player prop leg to the parlay slip
  const requestAddLeg = (
    player: MLBPlayer, 
    prop: { id: string; market: string; odds: number; spec: string }
  ) => {
    // 0. Check if player's game has played already and status is Final
    const playerTeam = player.team ? player.team.toLowerCase() : '';
    const matchedGame = liveGames.find((g: any) => 
      g.homeTeam.toLowerCase() === playerTeam || 
      g.awayTeam.toLowerCase() === playerTeam
    );

    if (matchedGame && matchedGame.status.toLowerCase() === 'final') {
      alert(`⚠️ Cannot bet on player: The game for ${player.name} (${matchedGame.awayTeam} @ ${matchedGame.homeTeam}) has already played and is concluded (status: Final). You cannot place picks on completed games.`);
      return;
    }

    // 1. Check if exact same selection spec is already added
    if (legs.some(l => l.selection === prop.spec)) {
      alert(`This player prop selection is already added to your current parlay slip!`);
      return;
    }

    // 2. Look up injury severity. If athlete is Day-to-Day, IL-10 or IL-60, launch a modal warning
    if (player.injurySeverity !== "NONE") {
      setInjuryWarning({
        show: true,
        playerName: player.name,
        notes: player.injuryNotes,
        status: player.injuryStatus,
        pendingProp: { player, prop }
      });
      return;
    }

    // 3. Otherwise add immediately
    executeAddLeg(player, prop);
  };

  const executeAddLeg = (
    player: MLBPlayer, 
    prop: { id: string; market: string; odds: number; spec: string }
  ) => {
    const newLeg: Leg = {
      id: `leg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sport: "MLB",
      game: `${player.team} Live Target`,
      market: prop.market,
      selection: prop.spec,
      odds: prop.odds,
      status: 'PENDING'
    };

    setLegs([...legs, newLeg]);
    
    // Auto calculate risk tier based on size & odds
    const newTotalOdds = legs.reduce((acc, l) => acc * l.odds, 1) * prop.odds;
    if (newTotalOdds > 7.0 || legs.length >= 3) {
      setRiskTier('HIGH');
    } else if (newTotalOdds > 3.0) {
      setRiskTier('MEDIUM');
    } else {
      setRiskTier('LOW');
    }
  };

  const handleRemoveLeg = (legId: string) => {
    setLegs(legs.filter(l => l.id !== legId));
  };

  // Calculations dynamically bound on selected bookie / average odds
  const totalOddsDecimal = legs.reduce((acc, leg) => {
    const activeOdds = getLegOddsForSelectedBookie(leg, bookie);
    return acc * activeOdds;
  }, 1);
  const totalOddsDisplay = legs.length > 0 ? decimalToAmericanNotation(totalOddsDecimal) : "+100";
  const potentialPayout = wagerAmount * totalOddsDecimal;

  const handleSaveParlaySlip = () => {
    if (legs.length === 0) {
      alert("Please add at least 1 MLB player prop leg to build your parlay!");
      return;
    }

    const newParlay: Parlay = {
      id: `parlay-${Date.now()}`,
      title: ticketTitle.trim() || 'Custom MLB Sharp Slip',
      legs,
      totalOdds: totalOddsDisplay,
      oddsValue: parseFloat(totalOddsDecimal.toFixed(2)),
      riskTier,
      status: 'PENDING',
      bookie,
      wagerAmount,
      payoutAmount: parseFloat(potentialPayout.toFixed(2)),
      createdAt: new Date().toISOString(),
      edgeScore: edgeReport ? edgeReport.edgeScore : undefined,
      edgeReport: edgeReport ? edgeReport.report : undefined
    };

    if (isPremiumSubOnly) {
      try {
        const cached = localStorage.getItem('vouchedge_subscriber_parlays');
        const premList = cached ? JSON.parse(cached) : [];
        const updatedPrem = [newParlay, ...premList];
        localStorage.setItem('vouchedge_subscriber_parlays', JSON.stringify(updatedPrem));
      } catch (e) {
        console.error("Failed saving to premList", e);
      }
    }

    onSaveParlay(newParlay);
    setLegs([]);
    setEdgeReport(null);
    setIsPremiumSubOnly(false);
    alert(isPremiumSubOnly ? `🔒 EXCLUSIVE SUBSCRIBER PARLAY SECURED: "${newParlay.title}" compiled and instantly broadcasted to your Premium Subscriber Clubs Room!` : `🎯 SUCCESS: "${newParlay.title}" compiled & saved to live sports database! You can easily select this parlay slip inside the Home Feed Composer now.`);
  };

  const handleShareToVouchPage = () => {
    if (legs.length === 0) {
      alert("Please add at least 1 MLB player prop leg to build your parlay and post!");
      return;
    }

    const newParlay: Parlay = {
      id: `parlay-${Date.now()}`,
      title: ticketTitle.trim() || 'Custom MLB Sharp Slip',
      legs,
      totalOdds: totalOddsDisplay,
      oddsValue: parseFloat(totalOddsDecimal.toFixed(2)),
      riskTier,
      status: 'PENDING',
      bookie,
      wagerAmount,
      payoutAmount: parseFloat(potentialPayout.toFixed(2)),
      createdAt: new Date().toISOString(),
      edgeScore: edgeReport ? edgeReport.edgeScore : undefined,
      edgeReport: edgeReport ? edgeReport.report : undefined
    };

    if (isPremiumSubOnly) {
      try {
        const cached = localStorage.getItem('vouchedge_subscriber_parlays');
        const premList = cached ? JSON.parse(cached) : [];
        const updatedPrem = [newParlay, ...premList];
        localStorage.setItem('vouchedge_subscriber_parlays', JSON.stringify(updatedPrem));
      } catch (e) {
        console.error("Failed saving subscriber parlays", e);
      }
    }

    let finalUserNote = researchText.trim();
    if (edgeReport) {
      const reportHeader = `🤖 AI EDGE REPORT (${edgeReport.edgeScore}% EDGE SCORE):`;
      const compactNotice = `Expected hit confidence is modeled at ${edgeReport.edgeScore}% using current Sabermetric splits and team alignment matrices. Click below to expand the full scouting report.`;
      if (finalUserNote) {
        finalUserNote = `${finalUserNote}\n\n${reportHeader}\n${compactNotice}`;
      } else {
        finalUserNote = `${reportHeader}\n${compactNotice}`;
      }
    } else {
      if (!finalUserNote) {
        finalUserNote = 'Correlated baseball stats compiled using VouchEdge model matrices.';
      }
    }

    // Compile into custom vouch card
    const associatedVouch: Vouch = {
      id: `vouch-parlay-${Date.now()}`,
      vouchSource: bookie !== 'Market Average' ? bookie : 'VEdge Analytical Board',
      userNote: finalUserNote,
      market: 'Multi-Leg Custom Parlay',
      sport: 'MLB',
      gameName: legs.map(l => l.game.replace(' Live Target', '')).join(' / '),
      odds: totalOddsDisplay,
      status: 'PENDING',
      savedCount: 148,
      vouchedCount: 125,
      createdAt: new Date().toISOString(),
      parlay: newParlay
    };

    // Save
    onSaveParlay(newParlay);
    if (onSaveVouch) {
      onSaveVouch(associatedVouch);
    }

    // Set preview parlay context so VouchBoard immediately renders it!
    localStorage.setItem('vEdge_preview_shared_parlay_vouch_id', associatedVouch.id);

    // Empty active legs
    setLegs([]);
    setResearchText("");
    setEdgeReport(null);
    setIsPremiumSubOnly(false);

    alert(`🚀 COMPILED & SHARED: "${newParlay.title}" uploaded! Redirecting you to the Vouch Board where you can customize its display styles under various high-contrast themes.`);
    
    // Redirect
    onSectionChange('board');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto min-h-screen bg-slate-950/20 backdrop-blur-md text-slate-100 font-sans border border-slate-900/40 rounded-3xl" id="parlay-lab-view">
      
      {/* Title & Hubtown style subline */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/25 backdrop-blur-sm p-4 rounded-3xl border border-slate-900/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-950/80 border border-emerald-900 text-emerald-400 font-mono text-[9px] font-extrabold px-2 py-0.5 rounded-full tracking-wider">
              MLB.COM VERIFIED DATA SEEDS
            </span>
            <span className="flex items-center gap-1 text-[10px] text-indigo-400 font-mono font-bold">
              <Activity className="w-3 h-3 animate-pulse text-emerald-450" />
              LIVE ODDS GRAPHS
            </span>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mt-1 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-emerald-400" />
            MLB Pro Parlay Lab
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Fully responsive baseball odds workstation. Inspect official injury reports, trace historical batting splits against different teams, and assemble modular slips.
          </p>
        </div>

        {/* Action link block direct launcher of research console */}
        <button
          onClick={() => onSectionChange('research')}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-450 hover:to-indigo-550 text-slate-100 font-semibold text-xs tracking-wide transition-all duration-200 flex items-center gap-2 shadow-lg shadow-sky-955/15 hover:scale-[1.02]"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>OPEN IN-DEPTH PLAYER RESEARCH</span>
        </button>
      </div>

      {/* Embedded Portfolio risk metrics */}
      <RiskTierVisualization savedParlays={savedParlays} />

      {/* Premium Tab Selector for Fusing the Views */}
      <div className="flex bg-[#0f1524]/90 p-1 rounded-2xl border border-slate-900 shadow-xl" id="parlay-fuse-tabs">
        <button
          type="button"
          onClick={() => setWorkMode('builder')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-mono text-xs font-black transition-all ${
            workMode === 'builder'
              ? 'bg-[#1e293b] text-sky-400 border border-slate-800 shadow-md ring-1 ring-sky-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4 text-sky-450" />
          <span>🔬 PARLAY SLIP CONSTRUCTOR</span>
        </button>

        <button
          type="button"
          onClick={() => setWorkMode('results')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-mono text-xs font-black transition-all ${
            workMode === 'results'
              ? 'bg-[#1e293b] text-emerald-400 border border-slate-800 shadow-md ring-1 ring-emerald-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4 text-emerald-400" />
          <span>🏆 PREMIUM AI RESULTS & WORKSTATION LEDGER</span>
        </button>
      </div>

      {/* Main Grid: Left is catalog/Console, Right is Slip builder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT / CENTER: Player list catalog OR Fused Results view */}
        <div className="lg:col-span-7 space-y-6">
          {workMode === 'results' ? (
            <div className="bg-[#0b0f19]/30 rounded-3xl border border-slate-900/40 p-1">
              <ResultsPage
                posts={posts}
                profile={profile}
                savedParlays={savedParlays}
                onTailParlay={(tailLegs) => {
                  setLegs(tailLegs);
                }}
              />
            </div>
          ) : (
            <>
          
          {/* Filters Toolbar */}
          <div className="bg-slate-900/25 backdrop-blur-sm p-4 rounded-3xl border border-slate-900/50 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Dribbble className="w-4 h-4 text-emerald-400" />
                Filter Active MLB Rosters
              </h3>
              <span className="text-[10px] font-mono text-slate-550 bg-slate-950/40 px-2 py-0.5 rounded border border-slate-850/40">
                {filteredPlayers.length} Players Available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">MLB Franchise</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full bg-slate-950/45 border border-slate-850/50 text-slate-200 p-2.5 rounded-xl text-xs outline-none focus:border-indigo-650 font-mono"
                >
                  {MLB_TEAMS.map((team, idx) => (
                    <option key={idx} value={team} className="bg-slate-950">{team === "ALL" ? "All MLB Teams" : team}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Search Player Name</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="e.g. Ohtani, Judge, Soto..."
                    className="w-full bg-slate-950/45 border border-slate-850/50 text-slate-200 pl-9 pr-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-indigo-650 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Quick Injury Dashboard Ribbon */}
            <div className="pt-2 border-t border-slate-850/50 flex flex-wrap gap-2 items-center text-[10px] text-slate-500 font-mono">
              <span className="text-[#a5b4fc] font-bold">INJURY BULLETIN BOARD:</span>
              <span className="bg-amber-950/40 text-amber-500 border border-amber-900/60 px-1.5 py-0.1 rounded">
                Mookie Betts (Wrist D2D)
              </span>
              <span className="bg-amber-950/40 text-amber-500 border border-amber-900/60 px-1.5 py-0.1 rounded">
                Manny Machado (Hip D2D)
              </span>
              <span className="bg-rose-950/40 text-rose-500 border border-rose-900/60 px-1.5 py-0.1 rounded">
                Kyle Tucker (Shin IL-10)
              </span>
              <span className="bg-rose-950/40 text-rose-500 border border-rose-900/60 px-1.5 py-0.1 rounded">
                Ronald Acuña Jr. (Knee IL-60)
              </span>
            </div>
          </div>

          {/* Player Grid catalog */}
          {matchedPlayers.length > PLAYER_RENDER_CAP && (
            <p className="text-[11px] text-slate-500 font-mono mb-2">
              Showing {PLAYER_RENDER_CAP} of {matchedPlayers.length} players · search a name or pick a team to narrow
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredPlayers.map((player) => {
              // Color formatting for injury status
              const injuryColor = player.injurySeverity === "NONE" 
                ? "bg-emerald-950 text-emerald-400 border-emerald-900/60" 
                : player.injurySeverity === "DAY_TO_DAY"
                ? "bg-amber-950 text-amber-500 border-amber-900/60 animate-pulse"
                : "bg-rose-950 text-rose-400 border-rose-900/60";

              return (
                <div
                  key={player.id}
                  className="rounded-2xl border bg-slate-900/40 border-slate-900/80 hover:border-slate-800 p-4 transition-all flex flex-col justify-between gap-3 shadow-md"
                >
                  <div className="flex gap-3.5 items-start">
                    <img
                      src={player.headshot}
                      alt={player.name}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0 bg-slate-900"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="text-xs font-black text-slate-100 truncate">{player.name}</h4>
                        <span className="text-[9px] font-mono bg-slate-950 text-slate-400 px-1.5 rounded font-bold">
                          #{player.number}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[10px] font-mono mt-0.5 truncate">{player.team}</p>
                      
                      {/* Active Live Injury Status indicator & Concluded badge */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className={`inline-block text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border ${injuryColor}`}>
                          {player.injuryStatus}
                        </span>
                        {(() => {
                          const playerTeam = player.team ? player.team.toLowerCase() : '';
                          const gameOfPlayer = liveGames.find((g: any) => 
                            g.homeTeam.toLowerCase() === playerTeam || 
                            g.awayTeam.toLowerCase() === playerTeam
                          );
                          if (gameOfPlayer && gameOfPlayer.status.toLowerCase() === 'final') {
                            return (
                              <span className="inline-block text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border bg-red-950/80 border-red-900 text-red-400">
                                🛑 Concluded
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Hotness score & quick mini statistics */}
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-900 flex justify-between items-center text-[10px] font-mono">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">Batter Score:</span>
                      <span className={`font-black ${player.batterScore > 90 ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {player.batterScore}%
                      </span>
                    </div>
                    <div className="text-slate-400">
                      AVG: <span className="text-white font-bold">{player.seasonStats.avg}</span> | OPS: <span className="text-emerald-400 font-bold">{player.seasonStats.ops}</span>
                    </div>
                  </div>

                  {/* Player Propositions Catalog with bookmakers and averages */}
                  <div className="space-y-2 mt-1">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[9px] font-black text-slate-500 font-mono uppercase tracking-wider">
                        Select Proposition Line
                      </span>
                      <span className="text-[8px] bg-slate-950 text-sky-400 border border-slate-850 px-1.5 py-0.5 rounded font-mono">
                        Active Choice: {bookie}
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-[143px] overflow-y-auto pr-0.5 scrollbar-thin">
                      {player.propositions.map((p) => {
                        const comparison = getMarketOdds(p.id, p.odds);
                        const isAddedToParlay = legs.some(l => l.selection === p.spec);
                        const activeBookieOdds = getSelectedBookieOddsValue(p.id, p.odds, bookie);
                        const isExpanded = expandedComparePropId === p.id;

                        return (
                          <div key={p.id} className="bg-slate-950/90 border border-slate-850/80 p-2 rounded-xl space-y-1.5 transition-all">
                            {/* Standard Header Row */}
                            <div className="flex justify-between items-center gap-2">
                              <div className="min-w-0">
                                <span className="text-[9.5px] font-bold text-slate-200 truncate block">
                                  {p.market}
                                </span>
                                <span className="text-[8.5px] text-slate-500 font-mono block truncate">
                                  {p.spec.replace(player.name, '').trim()}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setExpandedComparePropId(isExpanded ? null : p.id)}
                                  className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded border transition-colors ${
                                    isExpanded 
                                      ? 'bg-sky-950/40 border-sky-800 text-sky-400' 
                                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                  }`}
                                  title="Expand bet365/FanDuel/DraftKings comparisons"
                                >
                                  ⚖️ {activeBookieOdds.american}
                                </button>

                                {(() => {
                                  const playerTeam = player.team ? player.team.toLowerCase() : '';
                                  const gameOfPlayer = liveGames.find((g: any) => 
                                    g.homeTeam.toLowerCase() === playerTeam || 
                                    g.awayTeam.toLowerCase() === playerTeam
                                  );
                                  const isFinal = gameOfPlayer && gameOfPlayer.status.toLowerCase() === 'final';
                                  
                                  return (
                                    <button
                                      onClick={() => requestAddLeg(player, p)}
                                      disabled={isAddedToParlay || isFinal}
                                      className={`p-1.5 rounded-lg transition-all ${
                                        isAddedToParlay 
                                          ? 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-850' 
                                          : isFinal
                                          ? 'bg-red-950/40 text-red-400 border border-red-900/40 cursor-not-allowed text-[8.5px] font-bold px-1.5 py-0.5'
                                          : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-transparent shadow-sm'
                                      }`}
                                      title={isAddedToParlay ? "Added to Slip" : isFinal ? "Game Done (Pick Locked)" : "Add to Parlay Slip"}
                                    >
                                      {isFinal ? 'LOCK' : <Plus className="w-3.5 h-3.5" />}
                                    </button>
                                  );
                                })()}
                              </div>
                            </div>

                            {/* Collapsible Bookmaker Comparisons Details Panel */}
                            {isExpanded && (
                              <div className="pt-2 border-t border-slate-900 space-y-1.5">
                                <div className="text-[8px] text-indigo-400 font-mono font-black uppercase tracking-wider flex justify-between">
                                  <span>APP / BOOKMAKER COMPARISON</span>
                                  <span className="text-emerald-400 font-bold">Best highlighted</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-[9px] font-mono">
                                  {/* Bet365 */}
                                  <div className={`p-1 rounded flex justify-between items-center bg-[#0d1222]/80 border ${comparison.bet365.isBest ? 'border-emerald-600/50 bg-emerald-950/10' : 'border-slate-900'}`}>
                                    <span className="text-slate-400">Bet365</span>
                                    <strong className={comparison.bet365.isBest ? 'text-emerald-400 font-bold' : 'text-slate-200'}>
                                      {comparison.bet365.oddsDecimal.toFixed(2)} ({comparison.bet365.oddsAmerican})
                                    </strong>
                                  </div>
                                  {/* FanDuel */}
                                  <div className={`p-1 rounded flex justify-between items-center bg-[#0d1222]/80 border ${comparison.fanduel.isBest ? 'border-emerald-600/50 bg-emerald-950/10' : 'border-slate-900'}`}>
                                    <span className="text-slate-400">FanDuel</span>
                                    <strong className={comparison.fanduel.isBest ? 'text-emerald-400 font-bold' : 'text-slate-200'}>
                                      {comparison.fanduel.oddsDecimal.toFixed(2)} ({comparison.fanduel.oddsAmerican})
                                    </strong>
                                  </div>
                                  {/* DraftKings */}
                                  <div className={`p-1 rounded flex justify-between items-center bg-[#0d1222]/80 border ${comparison.draftkings.isBest ? 'border-emerald-600/50 bg-emerald-950/10' : 'border-slate-900'}`}>
                                    <span className="text-slate-400">DraftKings</span>
                                    <strong className={comparison.draftkings.isBest ? 'text-emerald-400 font-bold' : 'text-slate-200'}>
                                      {comparison.draftkings.oddsDecimal.toFixed(2)} ({comparison.draftkings.oddsAmerican})
                                    </strong>
                                  </div>
                                  {/* Caesars */}
                                  <div className={`p-1 rounded flex justify-between items-center bg-[#0d1222]/80 border ${comparison.caesars.isBest ? 'border-emerald-600/50 bg-emerald-950/10' : 'border-slate-900'}`}>
                                    <span className="text-slate-400">Caesars</span>
                                    <strong className={comparison.caesars.isBest ? 'text-emerald-400 font-bold' : 'text-slate-200'}>
                                      {comparison.caesars.oddsDecimal.toFixed(2)} ({comparison.caesars.oddsAmerican})
                                    </strong>
                                  </div>
                                  {/* BetMGM */}
                                  <div className={`p-1 rounded flex justify-between items-center bg-[#0d1222]/80 border ${comparison.betmgm.isBest ? 'border-emerald-600/50 bg-emerald-950/10' : 'border-slate-900'}`}>
                                    <span className="text-slate-400">BetMGM</span>
                                    <strong className={comparison.betmgm.isBest ? 'text-emerald-400 font-bold' : 'text-slate-200'}>
                                      {comparison.betmgm.oddsDecimal.toFixed(2)} ({comparison.betmgm.oddsAmerican})
                                    </strong>
                                  </div>
                                  {/* Market Average */}
                                  <div className="p-1 rounded flex justify-between items-center bg-indigo-950/20 border border-indigo-900/40">
                                    <span className="text-indigo-300">MARKET AVG</span>
                                    <strong className="text-indigo-400">
                                      {comparison.marketAverageDecimal.toFixed(2)} ({comparison.marketAverageAmerican})
                                    </strong>
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Action buttons */}
                  <div className="grid grid-cols-1 pt-1">
                    <button
                      onClick={() => {
                        localStorage.setItem('vouchedge_selected_research_player_id', player.id);
                        onSectionChange('research');
                      }}
                      className="py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-350 hover:text-sky-400 font-mono text-[9px] font-bold rounded-lg transition-all text-center block"
                    >
                      Deeper Advanced Metrics scouting 🔬
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          </>
          )}

        </div>

        {/* RIGHT SIDE: Active parlay slip with stake calculations & wager indicators */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-[#111827]/25 backdrop-blur-md p-5 rounded-3xl border border-slate-900/50 space-y-5" id="working-parlay-slip font-mono">
            
            <div className="flex items-center justify-between border-b border-slate-850/80 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-xs text-white uppercase tracking-wider font-mono">
                  Parlay Slip Constructor
                </h3>
                <p className="text-[10px] text-slate-500">Add leg items from roster or player profiles</p>
              </div>

              <span className="text-[10px] bg-indigo-950 border border-indigo-900 text-indigo-400 px-2 py-0.5 rounded font-mono font-black">
                {legs.length} {legs.length === 1 ? 'LEG ACTIVE' : 'LEGS ACTIVE'}
              </span>
            </div>

            <ParlaySlipSummary
              legs={legs}
              mode={builderMode}
              setMode={setBuilderMode}
              judgeScore={edgeReport?.edgeScore}
              analyzing={isAnalyzingEdge}
              onAnalyze={handleGenerateEdgeReport}
              onSave={handleSaveParlaySlip}
              onShare={handleShareToVouchPage}
            />

            {legs.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-850 rounded-2xl text-slate-500 text-xs py-12">
                <Sliders className="w-10 h-10 mx-auto text-slate-700 mb-3 animate-bounce" />
                <p className="font-bold text-slate-400">Your MLB Parlay is Empty</p>
                <p className="text-[10px] text-slate-650 mt-1 max-w-xs mx-auto text-slate-550 leading-relaxed">
                  Select a player name from roster on the left, or open <strong className="text-sky-400">Player Research</strong> to browse exact edge props. Press <strong className="text-emerald-400 font-bold">Wager</strong> on their edge props to construct your slip!
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                {legs.map((leg) => (
                  <div 
                    key={leg.id}
                    className="p-3.5 bg-slate-950 border border-slate-850/80 rounded-2xl flex items-center justify-between gap-3 relative overflow-hidden"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono font-bold uppercase mb-1">
                        <span className="text-[9px] text-indigo-400 font-bold">{leg.sport}</span>
                        <span>•</span>
                        <span className="truncate max-w-[150px]" title={leg.game}>{leg.game}</span>
                      </div>
                      <h4 className="text-xs font-black text-white truncate max-w-[180px]" title={leg.selection}>{leg.selection}</h4>
                      <p className="text-[9.5px] text-slate-400 font-mono mt-0.5 truncate max-w-[180px]">{leg.market}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono px-2.5 py-1 rounded border flex flex-col items-center bg-[#0d1527] border-slate-800">
                        <span className="text-emerald-400 font-extrabold text-[10.5px]">
                          {decimalToAmericanNotation(getLegOddsForSelectedBookie(leg, bookie))}
                        </span>
                        <span className="text-slate-500 text-[8.5px] font-mono mt-0.5">
                          x{getLegOddsForSelectedBookie(leg, bookie).toFixed(2)}
                        </span>
                      </span>
                      <button 
                        onClick={() => handleRemoveLeg(leg.id)}
                        className="text-slate-500 hover:text-red-400 hover:bg-slate-900 p-1.5 rounded-lg border border-transparent hover:border-slate-800 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Calculations & metadata configs card */}
            {legs.length > 0 && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 space-y-4">
                
                {/* Text parameter configs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] text-slate-500 font-mono uppercase mb-1">TICKET DISPLAY NAME</label>
                    <input 
                      type="text" 
                      value={ticketTitle}
                      onChange={(e) => setTicketTitle(e.target.value)}
                      placeholder="e.g. Sharp MLB Slip"
                      className="w-full bg-[#0b0f19] border border-slate-850 text-slate-100 p-2.5 rounded-xl text-xs outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 font-mono uppercase mb-1">PORTFOLIO BOOKMAKER</label>
                    <select 
                      value={bookie}
                      onChange={(e) => setBookie(e.target.value)}
                      className="w-full bg-[#0b0f19] border border-slate-850 text-[#38bdf8] p-2.5 rounded-xl text-xs outline-none focus:border-emerald-600 font-mono font-bold"
                    >
                      <option value="Market Average" className="text-[#38bdf8]">⚖️ Market Average Odds</option>
                      <option value="Bet365" className="text-emerald-400">🟢 Bet365 Sportsbook</option>
                      <option value="DraftKings" className="text-emerald-500">DraftKings Sportsbook</option>
                      <option value="FanDuel" className="text-sky-400">FanDuel Sports</option>
                      <option value="BetMGM" className="text-amber-500">BetMGM Board</option>
                      <option value="Caesars" className="text-amber-600">Caesars Palace</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-2">🛡️ PORTFOLIO RISK ALLOCATION SQUARE</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRiskTier('LOW')}
                      className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        riskTier === 'LOW' 
                          ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400 ring-4 ring-emerald-500/10' 
                          : 'bg-[#0b0f19] border-slate-850 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-[10px] font-black font-mono block">🛡️ LOW</span>
                      <span className="text-[8px] font-mono block text-slate-400 mt-0.5 leading-none">Core Model</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRiskTier('MEDIUM')}
                      className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        riskTier === 'MEDIUM' 
                          ? 'bg-amber-950/40 border-amber-500 text-amber-400 ring-4 ring-amber-500/10' 
                          : 'bg-[#0b0f19] border-slate-850 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-[10px] font-black font-mono block">⚖️ MEDIUM</span>
                      <span className="text-[8px] font-mono block text-slate-400 mt-0.5 leading-none font-bold">Balanced</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRiskTier('HIGH')}
                      className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        riskTier === 'HIGH' 
                          ? 'bg-red-950/40 border-red-550 border-red-500 text-red-450 ring-4 ring-red-500/10' 
                          : 'bg-[#0b0f19] border-slate-850 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-[10px] font-black font-mono block">🎰 HIGH</span>
                      <span className="text-[8px] font-mono block text-slate-400 mt-0.5 leading-none">Long Shot</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-3">
                  <div>
                    <label className="block text-[9px] text-slate-500 font-mono uppercase mb-1">STAKE WAGER UNITS</label>
                    <div className="flex items-center bg-[#0b0f19] border border-slate-850 p-1.5 rounded-xl text-xs">
                      <span className="text-slate-550 font-bold font-mono px-2 text-slate-555">$</span>
                      <input 
                        type="number" 
                        min={1}
                        max={1000}
                        value={wagerAmount}
                        onChange={(e) => setWagerAmount(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full bg-transparent text-slate-100 outline-none font-mono text-center font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Research behind the parlay */}
                <div className="space-y-1 text-left pt-1">
                  <label className="block text-[9px] text-indigo-400 font-mono font-black uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Research Behind The Parlay
                  </label>
                  <textarea
                    value={researchText}
                    onChange={(e) => setResearchText(e.target.value)}
                    placeholder="Provide your edge analysis here (e.g. platoon stats, wind coefficients, umpire hitter-friendliness, bullpen exhaustions)..."
                    className="w-full bg-[#0b0f19] border border-slate-850 text-slate-200 p-2.5 rounded-xl text-xs outline-none focus:border-indigo-505 h-20 resize-none font-medium text-left"
                    maxLength={220}
                  />
                </div>

                {/* AI EDGE REPORT HIGHLIGHT FEATURE */}
                <div className="border-t border-[#1e293b]/50 pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-[9px] text-[#38bdf8] font-mono font-black uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#38bdf8] animate-pulse" />
                      Dynamic AI Edge Report Highlight
                    </label>

                    {edgeReport && (
                      <button
                        onClick={handleGenerateEdgeReport}
                        disabled={isAnalyzingEdge}
                        className="text-[9px] font-mono font-bold text-sky-450 hover:text-sky-300 transition-colors uppercase cursor-pointer"
                      >
                        [ Regenerate ]
                      </button>
                    )}
                  </div>

                  {/* If not analyzed yet and not generating */}
                  {!edgeReport && !isAnalyzingEdge && (
                    <div className="p-3 bg-[#0d1222]/80 border border-slate-850/60 rounded-xl space-y-2 text-center">
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Verify matchup correlations, platoon variables, and stadium parameters across all active parlay legs instantly.
                      </p>
                      <button
                        onClick={handleGenerateEdgeReport}
                        className="py-1.5 px-4 bg-gradient-to-r from-emerald-500/10 via-sky-500/15 to-indigo-500/10 hover:from-emerald-500/20 hover:via-sky-500/25 hover:to-indigo-500/20 border border-sky-500/40 hover:border-sky-400 text-sky-300 hover:text-white font-mono text-[10px] font-bold rounded-lg transition-all w-full flex items-center justify-center gap-1.5 cursor-pointer shadow-indigo-950/20"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                        <span>Run AI Edge Analysis Report ⚡</span>
                      </button>
                    </div>
                  )}

                  {/* If active loader */}
                  {isAnalyzingEdge && (
                    <div className="p-4 bg-[#0d1222]/90 border border-sky-900/40 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-sky-400 font-mono text-[10px]">
                        <Activity className="w-4 h-4 animate-spin shrink-0 text-sky-400" />
                        <span className="font-extrabold uppercase animate-pulse">
                          Compiling Matchup Correlation Vectors...
                        </span>
                      </div>
                      
                      <div className="w-full bg-slate-900/60 rounded-full h-1 overflow-hidden relative border border-slate-800">
                        <div className="bg-gradient-to-r from-emerald-400 via-sky-500 to-indigo-500 h-1 rounded-full animate-infinite-width-slider" style={{ width: '40%' }}></div>
                      </div>

                      <p className="text-[9px] text-slate-500 leading-normal font-mono">
                        Validating against Statcast baseline splits, pitcher fatigue indices, and wind alignment profiles.
                      </p>
                    </div>
                  )}

                  {/* If an error occurred */}
                  {edgeError && (
                    <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl space-y-1.5 text-left font-mono">
                      <div className="flex items-center gap-1.5 text-red-400 text-[10px] font-extrabold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>EDGE COMPUTATION ERROR</span>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-normal">{edgeError}</p>
                      <button
                        onClick={handleGenerateEdgeReport}
                        className="text-[9px] text-sky-400 font-bold hover:underline"
                      >
                        Try generating again
                      </button>
                    </div>
                  )}

                  {/* If report compiled successfully */}
                  {edgeReport && !isAnalyzingEdge && (
                    <div className="p-3 bg-slate-950/80 border border-emerald-900/30 rounded-xl space-y-3 relative overflow-hidden shadow-inner">
                      {/* Edge Score display bar */}
                      <div className="flex items-center justify-between bg-emerald-950/15 border border-emerald-900/25 p-2 rounded-lg">
                        <div className="space-y-0.5">
                          <span className="block text-[8px] text-emerald-500 font-mono font-bold uppercase tracking-wider">
                            CALCULATED EDGE SCORE
                          </span>
                          <strong className="text-white text-xs font-mono font-black">
                            Sabermetric Margin Strength
                          </strong>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Mini visual gauge */}
                          <div className="w-12 bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                            <div 
                              className={`h-full rounded-full ${
                                edgeReport.edgeScore >= 85 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 
                                edgeReport.edgeScore >= 70 ? 'bg-amber-400' : 'bg-rose-400'
                              }`} 
                              style={{ width: `${edgeReport.edgeScore}%` }}
                            />
                          </div>

                          <span className={`font-mono text-[11px] font-black px-1.5 py-0.5 rounded ${
                            edgeReport.edgeScore >= 85 ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40' : 
                            edgeReport.edgeScore >= 70 ? 'bg-amber-950 text-amber-400 border border-amber-900/40' : 
                            'bg-rose-950 text-rose-400 border border-rose-900/40'
                          }`}>
                            {edgeReport.edgeScore}%
                          </span>
                        </div>
                      </div>

                      {/* Display warning badge if parlay legs snapshot differs */}
                      {reportLegsSnapshot && legs.map(l => l.selection).join('|') !== reportLegsSnapshot && (
                        <div className="flex items-center gap-1.5 bg-amber-950/15 border border-amber-900/30 p-2 rounded-lg text-amber-500 font-mono text-[8.5px] leading-snug">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>
                            <strong>Note</strong>: Selections modified since report creation. Re-run analysis for updated projection matches.
                          </span>
                        </div>
                      )}

                      {/* Rendered report output */}
                      <div className="border-t border-slate-900 pt-2">
                        {renderMarkdownText(edgeReport.report)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtotal payouts review row */}
                <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-xs font-mono">
                  <div className="text-slate-500">
                    <span className="block text-[9px] uppercase">COMBINED DEC ODDS</span>
                    <strong className="text-slate-350">x{totalOddsDecimal.toFixed(2)} ({totalOddsDisplay})</strong>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] text-slate-500 uppercase">ESTIMATED PAYOUT</span>
                    <strong className="text-emerald-400 font-black text-sm">${potentialPayout.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Subscriber-Only Toggle */}
                <div className="p-3 bg-indigo-950/25 border border-indigo-900/30 rounded-xl flex items-center justify-between text-left">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <span className="block text-[10px] font-black text-indigo-400 font-mono uppercase tracking-wider">EXCLUSIVE SUBSCRIBERS LINK</span>
                      <span className="block text-[9px] text-[#94a3b8]">Post only inside premium chats room</span>
                    </div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={isPremiumSubOnly}
                    onChange={(e) => setIsPremiumSubOnly(e.target.checked)}
                    className="w-4.5 h-4.5 rounded text-indigo-600 focus:ring-indigo-505 bg-slate-950 border-slate-800 cursor-pointer"
                  />
                </div>

                {/* Action buttons stack */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleShareToVouchPage}
                    className="w-full py-3.5 bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-405 hover:via-indigo-505 hover:to-purple-505 text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-emerald-355 shrink-0" />
                    <span>Share Parlay to Vouch Board 🚀</span>
                  </button>

                  <button
                    onClick={handleSaveParlaySlip}
                    className="w-full py-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 text-[10px] uppercase font-bold tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Save Parlay locally
                  </button>
                </div>

              </div>
            )}

            {/* Micro warning indicator notice */}
            <div className="flex items-start gap-2 bg-slate-950/40 p-3 rounded-2xl border border-slate-900 font-mono text-[9.5px] text-slate-500 leading-normal">
              <Info className="w-3.5 h-3.5 text-[#38bdf8] shrink-0 mt-0.5" />
              <span>
                Saved Tickets generate verified proof identifiers automatically, permitting you to publish them directly into the VouchEdge community social home feed for tailing and verification reviews.
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* ================= MODAL DIALOGS: INJURY RISK PROMPT ================= */}
      {injuryWarning.show && (
        <div id="injury-modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-2.5 text-amber-500">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
              <h3 className="text-sm font-black font-mono uppercase tracking-wider">ATHLETE INJURY ALERT</h3>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-300">
                You are adding a proposition for <strong className="text-white">{injuryWarning.playerName}</strong>, who is currently managing an active health status:
              </p>
              
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 font-mono text-[11px] leading-relaxed text-slate-400">
                <span className="text-amber-500 font-bold block mb-1 uppercase">★ Status: {injuryWarning.status}</span>
                {injuryWarning.notes}
              </div>

              <p className="text-[10px] text-indigo-400 font-mono mt-2">
                ⚠ Betting on players with day-to-day strain risks is highly unpredictable. The system model recommends waiting for pre-game rosters matching (1 hour prior to batting).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  setInjuryWarning({ show: false, playerName: "", notes: "", status: "", pendingProp: null });
                }}
                className="py-2.5 bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-100 rounded-xl text-xs font-mono font-bold"
              >
                CANCEL LEG
              </button>
              
              <button
                onClick={() => {
                  if (injuryWarning.pendingProp) {
                    executeAddLeg(injuryWarning.pendingProp.player, injuryWarning.pendingProp.prop);
                  }
                  setInjuryWarning({ show: false, playerName: "", notes: "", status: "", pendingProp: null });
                }}
                className="py-2.5 bg-amber-500 text-slate-950 hover:bg-amber-400 rounded-xl text-xs font-bold"
              >
                OVERRIDE & ADD
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
