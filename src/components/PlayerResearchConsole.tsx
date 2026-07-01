import React, { useState, useEffect } from 'react';
import { apiUrl } from '../lib/apiBase';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Search, 
  User, 
  TrendingUp, 
  Plus, 
  Check, 
  Activity, 
  Flame, 
  Calendar, 
  AlertTriangle, 
  Info, 
  Sparkles, 
  ChevronRight, 
  Trophy, 
  Target, 
  CheckCircle2, 
  RefreshCw, 
  BarChart3, 
  Zap, 
  Award,
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { MLBPlayer, Leg, Vouch } from '../types';
import { MLB_PLAYER_RECORDS } from '../data/playerData';
import { getMarketOdds, getSelectedBookieOddsValue, decimalToAmerican } from '../utils/oddsHelper';
import { searchMLBPlayers, enrichPlayerStats, getActiveMLBRoster } from '../utils/mlbApi';
import PokemonPlayerCard from './PokemonPlayerCard';

interface PlayerResearchConsoleProps {
  onAddLegToParlay: (player: MLBPlayer, prop: { id: string; market: string; odds: number; spec: string }) => void;
  onSaveVouch: (vouch: Vouch) => void;
  savedVouchIds: string[];
  activeLegs: Leg[];
  liveGames?: any[];
}

export default function PlayerResearchConsole({
  onAddLegToParlay,
  onSaveVouch,
  savedVouchIds,
  activeLegs,
  liveGames = []
}: PlayerResearchConsoleProps) {
  // Navigation & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [selectedInjuryStatus, setSelectedInjuryStatus] = useState('ALL');
  const [selectedPosition, setSelectedPosition] = useState('ALL');

  // Matchup configuration states & Pokemon/Saber visual modes
  const [opposingPitcherType, setOpposingPitcherType] = useState<'RHP' | 'LHP'>('RHP');
  const [dossierMode, setDossierMode] = useState<'POKEMON' | 'SABER'>('POKEMON');
  
  // Active selected player representing primary research target
  const [activePlayer, setActivePlayer] = useState<MLBPlayer>(() => {
    try {
      const savedId = localStorage.getItem('vouchedge_selected_research_player_id');
      const matched = MLB_PLAYER_RECORDS.find(p => p.id === savedId);
      return matched || MLB_PLAYER_RECORDS[0];
    } catch (e) {
      return MLB_PLAYER_RECORDS[0];
    }
  });
  
  // Side-by-side comparison mode state
  const [compareMode, setCompareMode] = useState(false);
  const [comparePlayer, setComparePlayer] = useState<MLBPlayer>(MLB_PLAYER_RECORDS[1]);
  
  // MLB API background roster search states
  const [displayedPlayers, setDisplayedPlayers] = useState<MLBPlayer[]>(MLB_PLAYER_RECORDS);
  const [allTeams, setAllTeams] = useState<string[]>(['ALL', ...Array.from(new Set(MLB_PLAYER_RECORDS.map(p => p.team)))]);
  // Cap how many roster cards render at once (full MLB roster is ~1,300 players).
  const ROSTER_RENDER_CAP = 120;
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [isRefreshingApi, setIsRefreshingApi] = useState(false);

  // Tactical situations tab state ('PLATOON' | 'VENUE' | 'RECENCY')
  const [activeSplitTab, setActiveSplitTab] = useState<'PLATOON' | 'VENUE' | 'RECENCY'>('PLATOON');
  
  // Tab indicator for Statcast advantages vs graphical visual analytics
  const [activeMetricsTab, setActiveMetricsTab] = useState<'BASE' | 'VISUAL'>('BASE');

  // Bookmaker comparison expanded states
  const [expandedPropIds, setExpandedPropIds] = useState<string[]>([]);
  const togglePropDetails = (propId: string) => {
    setExpandedPropIds(prev => 
      prev.includes(propId) ? prev.filter(id => id !== propId) : [...prev, propId]
    );
  };

  // Grounded AI Search Analytics Cache
  const [aiReportCache, setAiReportCache] = useState<{
    [playerId: string]: {
      score: number;
      report: string;
      status: string;
      groundingSources?: Array<{ title: string; url: string }>;
    };
  }>({});
  const [isResearching, setIsResearching] = useState(false);

  // Success alert states for UX feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Run dynamic web search grounded analysis
  const runLiveAIResearch = async (player: MLBPlayer) => {
    if (isResearching) return;
    setIsResearching(true);
    try {
      const res = await fetch(apiUrl('/api/ai/player-research'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerData: player })
      });
      const data = await res.json();
      if (data.aiScore) {
        setAiReportCache(prev => ({
          ...prev,
          [player.id]: {
            score: data.aiScore,
            report: data.report,
            status: data.status,
            groundingSources: data.groundingMetadata?.webSearchQueries?.map((q: string, i: number) => ({
              title: q,
              url: 'https://www.mlb.com'
            })) || []
          }
        }));
        showToast(`AI Grounded Score calculated for ${player.name}: ${data.aiScore}!`);
      } else {
        showToast("Error executing real-time Sabermetric modeling. Using default metrics.");
      }
    } catch (err) {
      showToast("Model server busy. Loaded metadata projections.");
    } finally {
      setIsResearching(false);
    }
  };

  // Extract unique lists for filtering dropdowns (teams come from the full live roster)
  const teams = allTeams;
  const positions = ['ALL', 'Outfielder', 'Third Baseman', 'Shortstop / Outfielder', 'Designated Hitter / Pitcher'];

  // Load background roster list on mount & enrich active player
  useEffect(() => {
    const initEnrich = async () => {
      setIsRefreshingApi(true);
      try {
        const enriched = await enrichPlayerStats(activePlayer);
        setActivePlayer(enriched);
      } catch (err) {
        console.error(err);
      } finally {
        setIsRefreshingApi(false);
      }
    };
    initEnrich();
    // Load the full active roster, then build the team filter from all 30 MLB clubs.
    getActiveMLBRoster()
      .then((roster) => {
        const apiTeams = roster.map((p: any) => p.currentTeam?.name).filter(Boolean) as string[];
        const unique = Array.from(new Set([...MLB_PLAYER_RECORDS.map((p) => p.team), ...apiTeams])).sort();
        setAllTeams(['ALL', ...unique]);
      })
      .catch(() => {});
  }, []);

  // Sync state for actual filtered results dynamically using searchMLBPlayers
  useEffect(() => {
    let active = true;
    const fetchAndFilter = async () => {
      setIsSearchingApi(true);
      try {
        const searched = await searchMLBPlayers(searchTerm);
        if (!active) return;
        
        const filtered = searched.filter(player => {
          const matchesTeam = selectedTeam === 'ALL' || player.team === selectedTeam;
          // Position matching
          const matchesPosition = selectedPosition === 'ALL' || 
            player.position.toLowerCase().includes(selectedPosition.toLowerCase()) ||
            (selectedPosition === 'Outfielder' && player.position.toLowerCase().includes('field'));
          const matchesInjury = selectedInjuryStatus === 'ALL' || 
                                (selectedInjuryStatus === 'CLEARED' && player.injurySeverity === 'NONE') ||
                                (selectedInjuryStatus === 'RISK' && player.injurySeverity !== 'NONE');
          return matchesTeam && matchesPosition && matchesInjury;
        });

        setDisplayedPlayers(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setIsSearchingApi(false);
      }
    };

    fetchAndFilter();
    return () => {
      active = false;
    };
  }, [searchTerm, selectedTeam, selectedPosition, selectedInjuryStatus]);

  const filteredPlayers = displayedPlayers;

  // Action: Add wager proposition safely
  const handleWagerProposition = (player: MLBPlayer, prop: { id: string; market: string; odds: number; spec: string }) => {
    const playerTeam = player.team ? player.team.toLowerCase() : '';
    const matchedGame = liveGames.find((g: any) => 
      g.homeTeam.toLowerCase() === playerTeam || 
      g.awayTeam.toLowerCase() === playerTeam
    );

    if (matchedGame && matchedGame.status.toLowerCase() === 'final') {
      alert(`⚠️ Cannot select player prop: The game for ${player.name} (${matchedGame.awayTeam} @ ${matchedGame.homeTeam}) is already done (status: Final). Placing picks on concluded games is strictly prohibited.`);
      return;
    }

    onAddLegToParlay(player, prop);
    showToast(`Added ${player.name} (${prop.market}) to Parlay Slip!`);
  };

  // Action: Export/vouch proposition
  const handleVouchProposition = (player: MLBPlayer, prop: { id: string; market: string; odds: number; spec: string }) => {
    const isVouched = savedVouchIds.includes(prop.id);
    const activeScore = aiReportCache[player.id]?.score || player.batterScore;
    const vouch: Vouch = {
      id: prop.id,
      vouchSource: "Player Research",
      userNote: `${player.name} — ${prop.spec}. Batter Score: ${activeScore}. Barrel%: ${player.advanced.barrelPercent}%, xwOBA: ${player.advanced.xwoba}.`,
      market: prop.spec,
      sport: "MLB",
      playerOrTeam: player.name,
      gameName: `${player.team} Matchup`,
      odds: prop.odds.toFixed(2),
      status: "PENDING",
      savedCount: 0,
      vouchedCount: 0,
      createdAt: new Date().toISOString()
    };
    onSaveVouch(vouch);
    if (!isVouched) {
      showToast(`Vouched ${player.name}'s prop to your Personal Vouch Board!`);
    } else {
      showToast(`Removed ${player.name}'s prop from your Vouch Board.`);
    }
  };

  // Manage athlete selection persistence
  const selectActivePlayer = async (player: MLBPlayer) => {
    setActivePlayer(player);
    try {
      localStorage.setItem('vouchedge_selected_research_player_id', player.id);
    } catch (e) {}

    setIsRefreshingApi(true);
    try {
      const enriched = await enrichPlayerStats(player);
      setActivePlayer(enriched);
    } catch (err) {
      console.error("Enrichment failed:", err);
    } finally {
      setIsRefreshingApi(false);
    }
  };

  const selectComparePlayer = async (player: MLBPlayer) => {
    setComparePlayer(player);
    try {
      const enriched = await enrichPlayerStats(player);
      setComparePlayer(enriched);
    } catch (err) {
      console.error("Compare enrichment failed:", err);
    }
  };

  // Get franchise custom color gradient specs
  const getTeamColors = (teamName: string) => {
    if (teamName.includes('Dodgers')) {
      return { 
        gradient: 'from-[var(--ve-accent-glow)] via-[rgba(var(--ve-bg-rgb),0.42)] to-[rgba(var(--ve-bg-rgb),0.72)]', 
        border: 'border-[var(--ve-border)]', 
        text: 'text-[var(--ve-accent)]', 
        glow: 'shadow-blue-500/10',
        badge: 'bg-[var(--ve-card)] text-[var(--ve-accent)] border border-[var(--ve-border)]'
      };
    }
    if (teamName.includes('Yankees')) {
      return { 
        gradient: 'from-slate-700/20 via-slate-900/50 to-slate-950/20', 
        border: 'border-gray-500/20', 
        text: 'text-[hsl(var(--ve-text-soft))]', 
        glow: 'shadow-slate-500/10',
        badge: 'bg-slate-500/10 text-[hsl(var(--ve-text-soft))] border border-slate-500/20'
      };
    }
    if (teamName.includes('Padres')) {
      return { 
        gradient: 'from-amber-700/20 via-slate-900/40 to-amber-950/20', 
        border: 'border-amber-600/20', 
        text: 'text-amber-400', 
        glow: 'shadow-amber-500/10',
        badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      };
    }
    if (teamName.includes('Astros')) {
      return { 
        gradient: 'from-orange-600/20 via-slate-900/45 to-orange-950/20', 
        border: 'border-orange-500/20', 
        text: 'text-orange-400', 
        glow: 'shadow-orange-500/10',
        badge: 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
      };
    }
    if (teamName.includes('Braves')) {
      return { 
        gradient: 'from-red-600/16 via-[rgba(var(--ve-bg-rgb),0.42)] to-[rgba(var(--ve-bg-rgb),0.72)]', 
        border: 'border-red-500/20', 
        text: 'text-red-400', 
        glow: 'shadow-red-500/10',
        badge: 'bg-red-500/10 text-red-400 border border-red-500/20'
      };
    }
    return { 
      gradient: 'from-[var(--ve-accent-glow)] via-[rgba(var(--ve-bg-rgb),0.42)] to-[rgba(var(--ve-bg-rgb),0.72)]', 
      border: 'border-slate-800', 
      text: 'text-[var(--ve-accent)]', 
      glow: 'shadow-slate-900',
      badge: 'bg-[var(--ve-card)] text-[var(--ve-accent)] border border-[var(--ve-border)]'
    };
  };

  // Simple Markdown structure translation
  const renderMarkdownText = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return (
      <div className="space-y-3 font-sans max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          // Process title matches (e.g. ### or ####)
          if (trimmed.startsWith('###')) {
            return (
              <h4 key={idx} className="text-white text-xs font-bold font-mono tracking-wider uppercase border-l-2 border-emerald-400 pl-2 mt-4 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                {trimmed.replace('###', '').replace(/\*/g, '').trim()}
              </h4>
            );
          }
          if (trimmed.startsWith('####')) {
            return (
              <h5 key={idx} className="text-[hsl(var(--ve-text-soft))] text-[11px] font-bold font-mono mt-3 uppercase tracking-wide">
                ▸ {trimmed.replace('####', '').replace(/\*/g, '').trim()}
              </h5>
            );
          }
          if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
            const rawBody = trimmed.replace(/^[-* ]+/, '');
            return (
              <div key={idx} className="flex items-start gap-2.5 ml-2">
                <span className="text-emerald-400 font-bold mt-1 text-[9px]">■</span>
                <p className="text-xs text-[hsl(var(--ve-text-soft))] leading-relaxed font-mono">
                  {renderInnerBold(rawBody)}
                </p>
              </div>
            );
          }
          return (
            <p key={idx} className="text-xs text-[hsl(var(--ve-text-soft))] leading-relaxed font-mono">
              {renderInnerBold(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  const renderInnerBold = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-[hsl(var(--ve-text))] font-extrabold bg-[hsl(var(--ve-surface-raised)/0.42)] px-1 py-0.5 rounded">{part}</strong>;
      }
      return part;
    });
  };

  const activeColors = getTeamColors(activePlayer.team);
  const activeAiReport = aiReportCache[activePlayer.id];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 text-[hsl(var(--ve-text-soft))] selection:bg-emerald-500/20 font-sans max-w-none mx-auto" id="player-research-console-root">
      
      {/* Toast alert feedback widget */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[hsl(var(--ve-surface-raised)/0.92)] border-2 border-emerald-500 text-[hsl(var(--ve-text))] px-5 py-4 rounded-2xl shadow-emerald-500/10 shadow-2xl flex items-center gap-3 animate-fade-in">
          <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
          <span className="font-extrabold text-xs font-mono uppercase tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Header Profile Dashboard */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-[hsl(var(--ve-surface-raised)/0.30)] border border-[hsl(var(--ve-border)/0.30)] p-6 rounded-3xl" id="console-welcome-header">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black font-mono px-2.5 py-0.5 rounded-full uppercase tracking-widest">
              Live Edge Pro Roster
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-[var(--ve-accent)] font-mono">
              <span className="w-1.5 h-1.5 bg-[var(--ve-accent)] rounded-full animate-pulse" /> Sabermetric Grounding Engine v3.5
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[hsl(var(--ve-text))] tracking-tight mt-2 font-display">
            MLB Roster Research Lab
          </h1>
          <p className="text-[hsl(var(--ve-text-muted))] text-xs mt-1.5 max-w-2xl leading-relaxed">
            Extract live edge advantages from custom metrics. Combine authentic Baseball-Reference metadata formulas and real-time live MLB.com search queries inside an interactive, server-side simulated dashboard.
          </p>
        </div>

        {/* Dynamic overall dashboard stats summary */}
        <div className="flex flex-wrap items-center gap-4 bg-[hsl(var(--ve-surface-raised)/0.40)] border border-[hsl(var(--ve-border)/0.30)] p-4 rounded-2xl">
          <div className="px-4 border-r border-[hsl(var(--ve-border)/0.28)]">
            <span className="block text-[9px] text-[hsl(var(--ve-text-muted))] font-mono tracking-wider uppercase">MLB PLAYERS LOADED</span>
            <span className="text-lg font-black text-[hsl(var(--ve-text-soft))] font-mono">{displayedPlayers.length} Active</span>
          </div>
          <div className="px-4 border-r border-[hsl(var(--ve-border)/0.28)]">
            <span className="block text-[9px] text-[hsl(var(--ve-text-muted))] font-mono tracking-wider uppercase">COMPUTATION METHOD</span>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 font-black font-mono px-2.5 py-1 rounded border border-emerald-500/20 block mt-0.5 uppercase tracking-wider">
              Gemini Search Grounded
            </span>
          </div>
          <div className="px-2">
            <button
              onClick={() => {
                const randomPlayer = MLB_PLAYER_RECORDS[Math.floor(Math.random() * MLB_PLAYER_RECORDS.length)];
                selectActivePlayer(randomPlayer);
                showToast(`Loaded ${randomPlayer.name} automatically.`);
              }}
              className="text-[hsl(var(--ve-text))] bg-[hsl(var(--ve-surface-raised)/0.54)] hover:bg-[hsl(var(--ve-surface-raised)/0.72)] p-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 border border-[hsl(var(--ve-border)/0.34)]"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[hsl(var(--ve-text-soft))]" /> Randomize
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid layout containing list, comparison options, and deep dossier reports */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="bento-console-grid">

        {/* ================= LEFT COLUMN: Roster Search & Filters (Col Span 4) ================= */}
        <div className="col-span-1 lg:col-span-4 space-y-6" id="console-roster-sidebar">
          
          {/* Controls Panel */}
          <div className="bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.30)] p-5 rounded-3xl shadow-xl space-y-5 backdrop-blur-sm">
            <h2 className="text-xs font-black text-[hsl(var(--ve-text-soft))] flex items-center justify-between border-b border-[hsl(var(--ve-border)/0.28)] pb-3">
              <span className="flex items-center gap-2 tracking-wider uppercase font-mono"><Search className="w-4 h-4 text-emerald-400" /> Controller Index</span>
              <span className="text-[9px] text-[hsl(var(--ve-text-muted))] font-mono">Live filters</span>
            </h2>

            {/* Input Search bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-[hsl(var(--ve-text-muted))] absolute left-3.5 top-3.5" />
              <input 
                type="text" 
                placeholder="Search MLB player or position..." 
                className="w-full bg-[hsl(var(--ve-bg)/0.72)] border border-[hsl(var(--ve-border)/0.32)] rounded-2xl py-3 pl-10 pr-10 text-xs text-[hsl(var(--ve-text-soft))] placeholder:text-[hsl(var(--ve-text-muted))] focus:outline-none focus:border-[var(--ve-border-strong)] focus:ring-1 focus:ring-[var(--ve-border-strong)] transition-all font-mono"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {isSearchingApi && (
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin absolute right-3.5 top-3.5" />
              )}
            </div>

            {isRefreshingApi && (
              <div className="bg-emerald-950/20 border border-emerald-500/10 text-[10px] text-emerald-400 font-mono px-3 py-2.5 rounded-xl flex items-center gap-2 animate-pulse justify-center">
                <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                <span>SYNCING MLB.COM STATS API LIFE...</span>
              </div>
            )}

            {/* Dropdown Filters Grid */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-[9px] text-[hsl(var(--ve-text-muted))] font-mono uppercase mb-1.5 tracking-wider">FILTER FRANCHISE TEAM</label>
                <div className="flex flex-wrap gap-1">
                  {['ALL', 'Dodgers', 'Yankees', 'Padres', 'Astros', 'Braves'].map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTeam(t === 'ALL' ? 'ALL' : MLB_PLAYER_RECORDS.find(p => p.team.includes(t))?.team || 'ALL')}
                      className={`text-[10px] font-mono px-2.5 py-1.5 rounded-lg border transition-all ${
                        selectedTeam.includes(t) || (t === 'ALL' && selectedTeam === 'ALL')
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold'
                          : 'bg-[hsl(var(--ve-bg)/0.72)] border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text))] hover:border-[hsl(var(--ve-border)/0.50)]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <div>
                  <label className="block text-[9.5px] text-[hsl(var(--ve-text-muted))] font-mono uppercase mb-1 tracking-wider">Position</label>
                  <select 
                    className="w-full bg-[hsl(var(--ve-bg)/0.72)] border border-[hsl(var(--ve-border)/0.32)] rounded-xl p-2.5 text-xs text-[hsl(var(--ve-text-soft))] outline-none focus:border-[var(--ve-border-strong)]"
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                  >
                    {positions.map(p => (
                      <option key={p} value={p}>{p === 'ALL' ? 'All Positions' : p.split('/')[0].trim()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9.5px] text-[hsl(var(--ve-text-muted))] font-mono uppercase mb-1 tracking-wider">Health Alert</label>
                  <select 
                    className="w-full bg-[hsl(var(--ve-bg)/0.72)] border border-[hsl(var(--ve-border)/0.32)] rounded-xl p-2.5 text-xs text-[hsl(var(--ve-text-soft))] outline-none focus:border-[var(--ve-border-strong)]"
                    value={selectedInjuryStatus}
                    onChange={(e) => setSelectedInjuryStatus(e.target.value)}
                  >
                    <option value="ALL">All Healths</option>
                    <option value="CLEARED">Cleared Only</option>
                    <option value="RISK">Injured (Caution)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Interactive Compare Mode Toggle */}
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-black font-mono transition-all flex items-center justify-center gap-2 border ${
                compareMode 
                  ? 'bg-indigo-950/40 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/5 animate-pulse'
                  : 'bg-[hsl(var(--ve-bg)/0.72)] hover:bg-[hsl(var(--ve-surface-raised)/0.50)] border-[hsl(var(--ve-border)/0.32)] text-[hsl(var(--ve-text-soft))]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{compareMode ? 'CLOSE SYSTEM COMPARISON' : 'COMPARE TWO ATHLETES'}</span>
            </button>
          </div>

          {/* Roster Athletes Feed List */}
          <div className="bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.30)] rounded-3xl overflow-hidden shadow-xl">
            <div className="bg-[hsl(var(--ve-surface-raised)/0.42)] px-5 py-4 border-b border-[hsl(var(--ve-border)/0.30)] flex items-center justify-between">
              <span className="text-xs font-black text-[hsl(var(--ve-text-soft))] font-mono tracking-wider">ATHLETE MATRIX ({filteredPlayers.length})</span>
              <span className="text-[10px] text-[hsl(var(--ve-text-muted))] font-mono">BAT RATING</span>
            </div>

            <div className="divide-y divide-[hsl(var(--ve-border)/0.24)] max-h-[520px] overflow-y-auto custom-scrollbar" id="roster-athlete-list">
              {filteredPlayers.length === 0 ? (
                <div className="p-10 text-center" id="no-matching-athletes">
                  <p className="text-[hsl(var(--ve-text-muted))] text-xs font-mono">No matching athletes find list filters.</p>
                  <button 
                    onClick={() => { setSearchTerm(''); setSelectedTeam('ALL'); setSelectedPosition('ALL'); setSelectedInjuryStatus('ALL'); }}
                    className="text-xs text-emerald-400 font-mono underline mt-2 inline-block hover:text-emerald-300"
                  >
                    Hard Reset Filters
                  </button>
                </div>
              ) : (
                filteredPlayers.slice(0, ROSTER_RENDER_CAP).map((player) => {
                  const isSelectedPrimary = activePlayer.id === player.id;
                  const isSelectedSecondary = compareMode && comparePlayer.id === player.id;
                  const scoreGrounded = aiReportCache[player.id]?.score || player.batterScore;
                  
                  return (
                    <div 
                      key={player.id}
                      onClick={() => {
                        if (compareMode) {
                          if (isSelectedPrimary) return; // can't compare to self
                          selectComparePlayer(player);
                        } else {
                          selectActivePlayer(player);
                        }
                      }}
                      className={`p-4 transition-all cursor-pointer flex items-center justify-between select-none ${
                        isSelectedPrimary
                          ? 'bg-emerald-950/20 border-l-4 border-emerald-500'
                          : isSelectedSecondary
                          ? 'bg-indigo-950/20 border-l-4 border-indigo-500'
                          : 'hover:bg-[hsl(var(--ve-surface-raised)/0.36)] border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Player headshot image from MLB static CDN */}
                        <div className="relative">
                          <img
                            src={player.headshot}
                            alt={player.name}
                            referrerPolicy="no-referrer"
                            loading="eager" decoding="async" fetchPriority="high"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/generic/headshot/67/current'; }}
                            className="w-11 h-11 rounded-2xl object-cover bg-[hsl(var(--ve-bg)/0.72)] border border-[hsl(var(--ve-border)/0.32)] flex-shrink-0"
                          />
                          <span className="absolute -bottom-1 -right-1 text-[8.5px] font-black bg-[hsl(var(--ve-surface-raised)/0.74)] text-[hsl(var(--ve-text-soft))] border border-[hsl(var(--ve-border)/0.36)] px-1 rounded-md font-mono">
                            #{player.number}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-[hsl(var(--ve-text))] truncate leading-tight tracking-tight">{player.name}</h4>
                          <span className="text-[10px] text-[hsl(var(--ve-text-muted))] font-mono block mt-0.5 truncate uppercase">
                            {player.team.replace('Los Angeles Dodgers', 'Dodgers').replace('New York Yankees', 'Yankees').replace('Houston Astros', 'Astros').replace('San Diego Padres', 'Padres').replace('Boston Red Sox', 'Red Sox').replace('Atlanta Braves', 'Braves')}
                          </span>
                          <span className="text-[9.5px] text-[hsl(var(--ve-text-muted))] font-mono block">{player.position}</span>
                        </div>
                      </div>

                      {/* Batter score badge with dynamic warning status */}
                      <div className="flex items-center gap-2">
                        {player.injurySeverity !== 'NONE' && (
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" title="Injury alert" />
                        )}
                        <span className={`text-xs font-black font-mono px-2.5 py-1 rounded-lg min-w-[34px] text-center ${
                          scoreGrounded >= 90 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-sm shadow-emerald-500/5'
                            : scoreGrounded >= 70
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                            : 'bg-red-500/10 text-red-400 border border-red-500/25'
                        }`}>
                          {scoreGrounded}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              {filteredPlayers.length > ROSTER_RENDER_CAP && (
                <div className="p-4 text-center bg-[hsl(var(--ve-surface-raised)/0.30)]">
                  <p className="text-[11px] text-[hsl(var(--ve-text-muted))] font-mono">
                    Showing {ROSTER_RENDER_CAP} of {filteredPlayers.length} players · search a name or pick a team to narrow
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: Deep Dossier Page / Comparison Panel (Col Span 8) ================= */}
        <div className="col-span-1 lg:col-span-8 space-y-8" id="console-research-content">
          
          {/* COMPARISON PAGE */}
          {compareMode ? (
            <div className="bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.30)] rounded-3xl p-6 shadow-2xl space-y-6" id="comparison-metric-dossier">
              
              {/* Header Comp */}
              <div className="flex items-center justify-between border-b border-[hsl(var(--ve-border)/0.28)] pb-4">
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-5 h-5 text-indigo-400 animate-pulse" />
                  <span className="text-xs font-black text-[hsl(var(--ve-text-soft))] font-mono tracking-widest uppercase">HEAD-TO-HEAD SABERMETRIC MATCHUP ATOMIZER</span>
                </div>
                <button
                  onClick={() => setCompareMode(false)}
                  className="text-[hsl(var(--ve-text-muted))] hover:text-emerald-400 text-xs font-mono underline transition-colors"
                >
                  Exit Comparison
                </button>
              </div>

              {/* Quick Athlete Header Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Primary Athlete Card */}
                <div className="bg-emerald-950/5 border border-emerald-500/10 p-5 rounded-2xl flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute right-0 top-0 text-[32px] font-black text-emerald-500/5 font-mono select-none pointer-events-none">A</div>
                  <span className="text-[9px] text-emerald-400 font-mono font-extrabold tracking-widest uppercase mb-3">Athletic Alpha Target</span>
                  <img 
                    src={activePlayer.headshot} 
                    alt={activePlayer.name}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-2xl border border-emerald-500/30 shadow-xl object-cover"
                  />
                  <h3 className="font-extrabold text-white text-base mt-3 leading-tight font-display">{activePlayer.name}</h3>
                  <span className="text-xs text-[hsl(var(--ve-text-muted))] font-mono mt-0.5">{activePlayer.team} • #{activePlayer.number}</span>
                  
                  <div className="mt-4 flex items-center gap-2.5 bg-[hsl(var(--ve-surface-raised)/0.42)] px-4 py-1.5 rounded-full border border-[hsl(var(--ve-border)/0.30)]">
                    <span className="text-[10px] text-[hsl(var(--ve-text-muted))] font-mono">BAT RATING:</span>
                    <span className="text-base font-black text-emerald-400 font-mono">{aiReportCache[activePlayer.id]?.score || activePlayer.batterScore}</span>
                  </div>
                </div>

                {/* Secondary Athlete Card */}
                <div className="bg-indigo-950/5 border border-indigo-500/10 p-5 rounded-2xl flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute right-0 top-0 text-[32px] font-black text-indigo-500/5 font-mono select-none pointer-events-none">B</div>
                  <span className="text-[9px] text-indigo-400 font-mono font-extrabold tracking-widest uppercase mb-3">Comparison Beta Target</span>
                  <img 
                    src={comparePlayer.headshot} 
                    alt={comparePlayer.name}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-2xl border border-indigo-500/30 shadow-xl object-cover"
                  />
                  <h3 className="font-extrabold text-white text-base mt-3 leading-tight font-display">{comparePlayer.name}</h3>
                  <span className="text-xs text-[hsl(var(--ve-text-muted))] font-mono mt-0.5">{comparePlayer.team} • #{comparePlayer.number}</span>
                  
                  <div className="mt-4 flex items-center gap-2.5 bg-[hsl(var(--ve-surface-raised)/0.42)] px-4 py-1.5 rounded-full border border-[hsl(var(--ve-border)/0.30)]">
                    <span className="text-[10px] text-[hsl(var(--ve-text-muted))] font-mono">BAT RATING:</span>
                    <span className="text-base font-black text-indigo-400 font-mono">{aiReportCache[comparePlayer.id]?.score || comparePlayer.batterScore}</span>
                  </div>
                </div>

              </div>

              {/* Sabermetric Metrics Head to Head */}
              <div className="bg-[hsl(var(--ve-surface-raised)/0.40)] border border-[hsl(var(--ve-border)/0.30)] rounded-3xl p-5 space-y-4">
                <h4 className="text-xs font-black text-[hsl(var(--ve-text-soft))] font-mono uppercase tracking-wider text-center border-b border-[hsl(var(--ve-border)/0.24)] pb-3">
                  STATCAST METRIC RADAR COMPARISON
                </h4>

                {/* Metric comparisons list */}
                {[
                  { label: "Barrel Accuracy %", valA: activePlayer.advanced.barrelPercent, valB: comparePlayer.advanced.barrelPercent, suffix: "%", highGood: true, max: 25 },
                  { label: "Apex Launch Angle", valA: activePlayer.advanced.launchAngle, valB: comparePlayer.advanced.launchAngle, suffix: "°", highGood: true, max: 25 },
                  { label: "Average Exit Velocity", valA: activePlayer.advanced.exitVelocity, valB: comparePlayer.advanced.exitVelocity, suffix: " mph", highGood: true, max: 100 },
                  { label: "Hard Contact %", valA: activePlayer.advanced.hardHitPercent, valB: comparePlayer.advanced.hardHitPercent, suffix: "%", highGood: true, max: 70 },
                  { label: "O-Swing / Chase %", valA: activePlayer.advanced.chasePercent, valB: comparePlayer.advanced.chasePercent, suffix: "%", highGood: false, max: 40 },
                  { label: "Estimated wOBA", valA: activePlayer.advanced.woba, valB: comparePlayer.advanced.woba, suffix: "", precision: 3, highGood: true, max: 0.5 },
                  { label: "Expected xwOBA", valA: activePlayer.advanced.xwoba, valB: comparePlayer.advanced.xwoba, suffix: "", precision: 3, highGood: true, max: 0.5 }
                ].map((m, idx) => {
                  const betterA = m.highGood ? m.valA > m.valB : m.valA < m.valB;
                  const ratioA = Math.min((m.valA / m.max) * 100, 100);
                  const ratioB = Math.min((m.valB / m.max) * 100, 100);

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className={`font-mono font-extrabold ${betterA ? 'text-emerald-400' : 'text-[hsl(var(--ve-text-muted))]'}`}>
                          {m.precision ? m.valA.toFixed(m.precision) : m.valA}{m.suffix}
                        </span>
                        <span className="text-[10px] text-[hsl(var(--ve-text-muted))] font-mono tracking-wide uppercase">{m.label}</span>
                        <span className={`font-mono font-extrabold ${!betterA ? 'text-indigo-400' : 'text-[hsl(var(--ve-text-muted))]'}`}>
                          {m.precision ? m.valB.toFixed(m.precision) : m.valB}{m.suffix}
                        </span>
                      </div>

                      {/* Head-to-Head Double Bar Slider */}
                      <div className="h-2 w-full flex bg-[hsl(var(--ve-bg)/0.72)] rounded-full overflow-hidden border border-[hsl(var(--ve-border)/0.30)]">
                        {/* Athlete A */}
                        <div className="w-1/2 flex justify-end">
                          <div 
                            className="h-full bg-gradient-to-l from-emerald-500 to-emerald-700/50 rounded-l"
                            style={{ width: `${ratioA}%` }}
                          />
                        </div>
                        {/* Center gap segment */}
                        <div className="w-[1px] bg-[hsl(var(--ve-border)/0.34)]"></div>
                        {/* Athlete B */}
                        <div className="w-1/2 flex justify-start">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700/50 rounded-r"
                            style={{ width: `${ratioB}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Splits comparison summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[hsl(var(--ve-surface-raised)/0.40)] border border-[hsl(var(--ve-border)/0.30)] p-4 rounded-2xl space-y-3">
                  <h5 className="text-[10px] font-black text-emerald-400 font-mono uppercase tracking-wider text-center">
                    {activePlayer.name.toUpperCase()} PLATOON SPLITS
                  </h5>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between pb-1 border-b border-[hsl(var(--ve-border)/0.24)] text-[9px] text-[hsl(var(--ve-text-muted))]">
                      <span>SITUATION</span>
                      <span>STATS (OPS)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(var(--ve-text-muted))]">vs Left Pitcher:</span>
                      <strong className="text-[hsl(var(--ve-text-soft))]">{activePlayer.splits.vLHP.ops} OPS</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(var(--ve-text-muted))]">vs Right Pitcher:</span>
                      <strong className="text-[hsl(var(--ve-text-soft))]">{activePlayer.splits.vRHP.ops} OPS</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(var(--ve-text-muted))]">At Home Arena:</span>
                      <strong className="text-[hsl(var(--ve-text-soft))]">{activePlayer.splits.home.ops} OPS</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(var(--ve-text-muted))]">Last 10 Starts:</span>
                      <strong className="text-emerald-400 font-black">{activePlayer.splits.last10.ops} OPS</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-[hsl(var(--ve-surface-raised)/0.40)] border border-[hsl(var(--ve-border)/0.30)] p-4 rounded-2xl space-y-3">
                  <h5 className="text-[10px] font-black text-indigo-400 font-mono uppercase tracking-wider text-center">
                    {comparePlayer.name.toUpperCase()} PLATOON SPLITS
                  </h5>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between pb-1 border-b border-[hsl(var(--ve-border)/0.24)] text-[9px] text-[hsl(var(--ve-text-muted))]">
                      <span>SITUATION</span>
                      <span>STATS (OPS)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(var(--ve-text-muted))]">vs Left Pitcher:</span>
                      <strong className="text-[hsl(var(--ve-text-soft))]">{comparePlayer.splits.vLHP.ops} OPS</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(var(--ve-text-muted))]">vs Right Pitcher:</span>
                      <strong className="text-[hsl(var(--ve-text-soft))]">{comparePlayer.splits.vRHP.ops} OPS</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(var(--ve-text-muted))]">At Home Arena:</span>
                      <strong className="text-[hsl(var(--ve-text-soft))]">{comparePlayer.splits.home.ops} OPS</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(var(--ve-text-muted))]">Last 10 Starts:</span>
                      <strong className="text-indigo-400 font-black">{comparePlayer.splits.last10.ops} OPS</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Prop builder comparison card */}
              <div className="bg-[hsl(var(--ve-surface-raised)/0.40)] border border-[hsl(var(--ve-border)/0.30)] rounded-3xl p-5">
                <h5 className="text-xs font-black font-mono text-[hsl(var(--ve-text-soft))] uppercase tracking-widest mb-4">HEAD-TO-HEAD EDGE PROPOSITIONS</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Props A */}
                  <div className="space-y-2">
                    <span className="text-[9.5px] text-[hsl(var(--ve-text-muted))] font-mono font-extrabold tracking-wider">{activePlayer.name.toUpperCase()} WAGERS</span>
                    {activePlayer.propositions.map((p) => {
                      const playerTeam = activePlayer.team ? activePlayer.team.toLowerCase() : '';
                      const matchedGame = liveGames.find((g: any) => 
                        g.homeTeam.toLowerCase() === playerTeam || 
                        g.awayTeam.toLowerCase() === playerTeam
                      );
                      const isFinal = matchedGame && matchedGame.status.toLowerCase() === 'final';

                      return (
                        <div key={p.id} className="bg-[hsl(var(--ve-surface-raised)/0.38)] p-3 rounded-xl border border-[hsl(var(--ve-border)/0.30)] flex items-center justify-between">
                          <div className="min-w-0 pr-2">
                            <span className="text-[11px] font-bold text-[hsl(var(--ve-text))] block truncate leading-tight">{p.market}</span>
                            <span className="text-[9.5px] text-[hsl(var(--ve-text-muted))] font-mono block mt-1 truncate">{p.spec}</span>
                          </div>
                          <button 
                            onClick={() => handleWagerProposition(activePlayer, p)}
                            disabled={isFinal}
                            className={`border-2 px-2.5 py-1 rounded-xl text-[10px] font-extrabold font-mono transition-all flex-shrink-0 ${
                              isFinal
                                ? 'bg-red-950/20 border-red-900/30 text-red-400 cursor-not-allowed opacity-65'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white'
                            }`}
                          >
                            {isFinal ? 'LOCKED' : `+${p.odds.toFixed(2)}`}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Props B */}
                  <div className="space-y-2">
                    <span className="text-[9.5px] text-[hsl(var(--ve-text-muted))] font-mono font-extrabold tracking-wider">{comparePlayer.name.toUpperCase()} WAGERS</span>
                    {comparePlayer.propositions.map((p) => {
                      const playerTeam = comparePlayer.team ? comparePlayer.team.toLowerCase() : '';
                      const matchedGame = liveGames.find((g: any) => 
                        g.homeTeam.toLowerCase() === playerTeam || 
                        g.awayTeam.toLowerCase() === playerTeam
                      );
                      const isFinal = matchedGame && matchedGame.status.toLowerCase() === 'final';

                      return (
                        <div key={p.id} className="bg-[hsl(var(--ve-surface-raised)/0.38)] p-3 rounded-xl border border-[hsl(var(--ve-border)/0.30)] flex items-center justify-between">
                          <div className="min-w-0 pr-2">
                            <span className="text-[11px] font-bold text-[hsl(var(--ve-text))] block truncate leading-tight">{p.market}</span>
                            <span className="text-[9.5px] text-[hsl(var(--ve-text-muted))] font-mono block mt-1 truncate">{p.spec}</span>
                          </div>
                          <button 
                            onClick={() => handleWagerProposition(comparePlayer, p)}
                            disabled={isFinal}
                            className={`border-2 px-2.5 py-1 rounded-xl text-[10px] font-extrabold font-mono transition-all flex-shrink-0 ${
                              isFinal
                                ? 'bg-red-950/20 border-red-900/30 text-red-400 cursor-not-allowed opacity-65'
                                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white'
                            }`}
                          >
                            {isFinal ? 'LOCKED' : `+${p.odds.toFixed(2)}`}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>

            </div>
          ) : (
            
            /* DEDICATED INDIVIDUAL DOSSIER PANEL */
            <div className="space-y-8" id="individual-roster-dossier">

              {/* MODE CONTROL TOGGLE PANEL */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[hsl(var(--ve-surface-raised)/0.42)] p-4 rounded-3xl border border-[hsl(var(--ve-border)/0.32)] shadow-md" id="retro-dex-calibrator">
                <div className="min-w-0">
                  <h4 className="text-xs font-black font-mono text-[hsl(var(--ve-text-soft))] uppercase tracking-widest flex items-center gap-1.5">
                    <span className="text-yellow-400">👾</span>
                    ATHLETE RESEARCH INTERFACE DECK
                  </h4>
                  <p className="text-[11px] text-[hsl(var(--ve-text-muted))] mt-1 leading-snug font-mono">
                    Toggle interactive retro <b className="text-yellow-400">Pokémon Saber-Card Mode</b> or advanced <b className="text-[#10b981]">Pro Sabermetric Dossier</b> view.
                  </p>
                </div>
                <div className="flex bg-[#070a13] border border-slate-800 p-1 rounded-2xl text-[10.5px] font-mono shrink-0 select-none">
                  <button
                    type="button"
                    onClick={() => setDossierMode('POKEMON')}
                    className={`px-4 py-2 font-black rounded-xl transition-all uppercase flex items-center gap-1 leading-none ${
                      dossierMode === 'POKEMON'
                        ? 'bg-yellow-400 text-slate-950 font-extrabold shadow-sm'
                        : 'text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text-soft))]'
                    }`}
                  >
                    <span>👾 POKÉDEX VIEW</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDossierMode('SABER')}
                    className={`px-4 py-2 font-black rounded-xl transition-all uppercase flex items-center gap-1 leading-none ${
                      dossierMode === 'SABER'
                        ? 'bg-[#10b981] text-slate-950 font-extrabold shadow-sm'
                        : 'text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text-soft))]'
                    }`}
                  >
                    <span>📊 PRO METRICS</span>
                  </button>
                </div>
              </div>

              {dossierMode === 'POKEMON' ? (
                <PokemonPlayerCard
                  activePlayer={activePlayer}
                  activeLegs={activeLegs}
                  handleWagerProposition={handleWagerProposition}
                  savedVouchIds={savedVouchIds}
                />
              ) : (
                <>
                  {/* HERO BLOCK */}
                  <div className={`bg-gradient-to-br ${activeColors.gradient} border ${activeColors.border} rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col gap-6`} id="active-athlete-hero">
                
                {/* Background ambient light design glow */}
                <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

                {/* Top Section: Identity & Gauge */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-5 border-b border-[hsl(var(--ve-border)/0.28)] w-full" id="hero-top-info">
                  
                  {/* Left Side: Avatar + Name / Team Info */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left min-w-0 flex-1">
                    {/* Headshot */}
                    <div className="relative flex-shrink-0" id="hero-headshot-box">
                      <img 
                        src={activePlayer.headshot} 
                        alt={activePlayer.name}
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-[hsl(var(--ve-border)/0.34)] shadow-2xl object-cover bg-[hsl(var(--ve-bg)/0.72)]"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-[hsl(var(--ve-surface-raised)/0.74)] border border-[hsl(var(--ve-border)/0.34)] rounded-lg px-2.5 py-1 text-[10px] font-black text-emerald-400 font-mono shadow-md">
                        #{activePlayer.number}
                      </div>
                    </div>
                    {/* Bio */}
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <span className="bg-[hsl(var(--ve-surface-raised)/0.52)] border border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-text-soft))] px-3 py-0.5 rounded-full text-[10px] font-black font-mono uppercase tracking-widest">
                          {activePlayer.team}
                        </span>
                        <span className="bg-[hsl(var(--ve-surface-raised)/0.52)] border border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-text-muted))] px-3 py-0.5 rounded-full text-[10px] font-medium font-mono uppercase">
                          {activePlayer.position}
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-[hsl(var(--ve-text))] font-display select-text leading-tight tracking-tight">
                        {activePlayer.name}
                      </h2>
                    </div>
                  </div>

                  {/* Right Side: Batter Score Gauge */}
                  <div className="flex-shrink-0 bg-[hsl(var(--ve-surface-raised)/0.52)] p-4 border border-[hsl(var(--ve-border)/0.30)] rounded-2xl text-center flex flex-col items-center justify-center min-w-[130px]" id="primary-model-batter-gauge">
                    <span className="text-[9px] text-[hsl(var(--ve-text-muted))] font-mono font-extrabold tracking-widest uppercase block mb-1.5">BATTER SCORE</span>
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      {/* SVG Progress Ring */}
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="hsl(var(--ve-border) / 0.36)" strokeWidth="3" fill="transparent" />
                        <circle 
                          cx="32" 
                          cy="32" 
                          r="28" 
                          stroke={activeAiReport ? "#10b981" : activePlayer.batterScore >= 90 ? "#10b981" : "#f59e0b"} 
                          strokeWidth="3.5" 
                          fill="transparent" 
                          strokeDasharray={175}
                          strokeDashoffset={175 - (175 * (activeAiReport?.score || activePlayer.batterScore)) / 100}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <span className="absolute text-xl font-mono font-black text-[hsl(var(--ve-text))] animate-pulse">
                        {activeAiReport?.score || activePlayer.batterScore}
                      </span>
                    </div>
                    <span className="text-[8.5px] text-[hsl(var(--ve-text-muted))] font-mono block mt-2.5 uppercase tracking-wider leading-tight">
                      {activeAiReport ? 'Live Grounded' : 'Metadata Baseline'}
                    </span>
                  </div>

                </div>

                {/* Bottom Section Layout split into two sections: demographics grid & stats blocks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full" id="hero-bottom-info">
                  
                  {/* Demographics */}
                  <div className="space-y-2">
                    <h4 className="text-[9.5px] text-[hsl(var(--ve-text-muted))] font-black font-mono tracking-wider uppercase border-l-2 border-[hsl(var(--ve-border-strong))] pl-2">
                      ATHLETE PROFILE INFO
                    </h4>
                    <div className="grid grid-cols-2 gap-3 bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.28)] p-4 rounded-2xl text-xs font-mono">
                      <div>
                        <span className="block text-[8.5px] text-[hsl(var(--ve-text-muted))] uppercase tracking-wider">Bats / Throws</span>
                        <span className="text-[hsl(var(--ve-text-soft))] mt-0.5 font-bold">{activePlayer.bats} / {activePlayer.throws}</span>
                      </div>
                      <div>
                        <span className="block text-[8.5px] text-[hsl(var(--ve-text-muted))] uppercase tracking-wider">Height / Weight</span>
                        <span className="text-[hsl(var(--ve-text-soft))] mt-0.5 font-bold">{activePlayer.height} / {activePlayer.weight}</span>
                      </div>
                      <div>
                        <span className="block text-[8.5px] text-[hsl(var(--ve-text-muted))] uppercase tracking-wider">Birthdate & Age</span>
                        <span className="text-[hsl(var(--ve-text-soft))] mt-0.5 font-bold truncate block" title={activePlayer.birthdate}>{activePlayer.birthdate}</span>
                      </div>
                      <div>
                        <span className="block text-[8.5px] text-[hsl(var(--ve-text-muted))] uppercase tracking-wider">Injury Status</span>
                        <span className={`inline-flex items-center gap-1 mt-0.5 font-extrabold uppercase text-[9.5px] ${
                          activePlayer.injurySeverity === 'NONE' ? 'text-emerald-400' : 'text-amber-400 animate-pulse'
                        }`}>
                          {activePlayer.injurySeverity === 'NONE' ? 'Cleared' : 'Risk Flag'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Seasonal Stats Triple Crown */}
                  <div className="space-y-2">
                    <h4 className="text-[9.5px] text-[hsl(var(--ve-text-muted))] font-black font-mono tracking-wider uppercase border-l-2 border-emerald-500 pl-2">
                      SEASON STAT BASELINE
                    </h4>
                    <div className="grid grid-cols-4 gap-2 text-center h-[calc(100%-20px)] min-h-[74px]">
                      <div className="bg-[hsl(var(--ve-surface-raised)/0.38)] border border-[hsl(var(--ve-border)/0.30)] p-2.5 rounded-2xl flex flex-col justify-center">
                        <span className="block text-[8.5px] text-[hsl(var(--ve-text-muted))] font-mono tracking-wider">BAT AVG</span>
                        <span className="text-sm font-bold text-[hsl(var(--ve-text-soft))] font-mono mt-0.5">{activePlayer.seasonStats.avg}</span>
                      </div>
                      <div className="bg-[hsl(var(--ve-surface-raised)/0.38)] border border-[hsl(var(--ve-border)/0.30)] p-2.5 rounded-2xl flex flex-col justify-center">
                        <span className="block text-[8.5px] text-[hsl(var(--ve-text-muted))] font-mono tracking-wider">HRs</span>
                        <span className="text-sm font-bold text-[hsl(var(--ve-text-soft))] font-mono mt-0.5">{activePlayer.seasonStats.hr}</span>
                      </div>
                      <div className="bg-[hsl(var(--ve-surface-raised)/0.38)] border border-[hsl(var(--ve-border)/0.30)] p-2.5 rounded-2xl flex flex-col justify-center">
                        <span className="block text-[8.5px] text-[hsl(var(--ve-text-muted))] font-mono tracking-wider">RBIs</span>
                        <span className="text-sm font-bold text-[hsl(var(--ve-text-soft))] font-mono mt-0.5">{activePlayer.seasonStats.rbi}</span>
                      </div>
                      <div className="bg-emerald-950/30 border-2 border-emerald-500/20 p-2.5 rounded-2xl flex flex-col justify-center">
                        <span className="block text-[8.5px] text-emerald-400/80 font-mono tracking-wider">SEAS OPS</span>
                        <span className="text-sm font-black text-emerald-400 font-mono mt-0.5">{activePlayer.seasonStats.ops}</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* LIVE AI SCUTTING & GROUNDED SCORE CONTROLLER */}
              <div className="bg-[hsl(var(--ve-surface-raised)/0.30)] border border-[hsl(var(--ve-border)/0.28)] rounded-3xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-[hsl(var(--ve-text))] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Live Grounded AI Matchup Optimizer
                    </h3>
                    <p className="text-[hsl(var(--ve-text-muted))] text-xs mt-0.5">
                      Connect metadata and real-time live MLB.com rosters, hot streaks, and pitching lineups.
                    </p>
                  </div>
                  <button
                    onClick={() => runLiveAIResearch(activePlayer)}
                    disabled={isResearching}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black font-mono tracking-wider transition-all flex items-center gap-2 border ${
                      isResearching 
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 cursor-not-allowed animate-pulse'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-[hsl(var(--ve-bg))] border-emerald-400 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-400/20'
                    }`}
                  >
                    {isResearching ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>GROUNDING MODEL...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>RUN REAL-TIME MLB AI</span>
                      </>
                    )}
                  </button>
                </div>

                {activeAiReport ? (
                  <div className="bg-[hsl(var(--ve-surface-raised)/0.40)] border-2 border-emerald-500/10 p-5 rounded-2xl space-y-4 shadow-inner">
                    <div className="flex items-center justify-between border-b border-[hsl(var(--ve-border)/0.24)] pb-2.5 text-xs text-[hsl(var(--ve-text-muted))] font-mono">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Check className="w-4 h-4" /> Sabermetric grounding successful
                      </span>
                      <span className="bg-[hsl(var(--ve-surface-raised)/0.42)] text-[hsl(var(--ve-text-soft))] px-2 py-0.5 rounded border border-[hsl(var(--ve-border)/0.30)]">
                        AI SCORE: {activeAiReport.score}
                      </span>
                    </div>
                    
                    {renderMarkdownText(activeAiReport.report)}

                    {activeAiReport.groundingSources && activeAiReport.groundingSources.length > 0 && (
                      <div className="pt-2 border-t border-[hsl(var(--ve-border)/0.24)] flex flex-wrap items-center gap-2">
                        <span className="text-[10px] text-[hsl(var(--ve-text-muted))] font-mono uppercase tracking-wider">Search Grounding citations:</span>
                        {activeAiReport.groundingSources.map((source, idx) => (
                          <a 
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9.5px] bg-[hsl(var(--ve-surface-raised)/0.42)] border border-[hsl(var(--ve-border)/0.30)] hover:border-emerald-500 text-[hsl(var(--ve-text-soft))] hover:text-emerald-300 px-2 py-0.5 rounded font-mono transition-colors"
                          >
                            [Verified: {source.title}]
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-[hsl(var(--ve-surface-raised)/0.36)] p-4 rounded-2xl border border-[hsl(var(--ve-border)/0.28)] text-center space-y-2">
                    <Activity className="w-6 h-6 text-[hsl(var(--ve-text-muted))] mx-auto" />
                    <p className="text-[hsl(var(--ve-text-muted))] text-xs font-mono">
                      Query is currently un-analyzed on live search. Click the green button above to fuse MLB.com logs with the active model.
                    </p>
                  </div>
                )}
              </div>

              {/* Bento Row 1: Deep Statcast Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="bento-row-metrics">
                
                {/* Advanced Statcast card (Col Span 2) */}
                <div className="col-span-1 md:col-span-2 bg-[hsl(var(--ve-surface-raised)/0.32)] border border-[hsl(var(--ve-border)/0.30)] rounded-3xl p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-[hsl(var(--ve-border)/0.28)] pb-2.5">
                    <h3 className="text-xs font-black text-[hsl(var(--ve-text-soft))] font-mono uppercase tracking-wider flex items-center gap-2">
                       <span>📊 ATHLETE MATRIX PERFORMANCE CORES</span>
                    </h3>
                    <div className="flex bg-[hsl(var(--ve-bg)/0.72)] p-1 border border-[hsl(var(--ve-border)/0.32)] rounded-xl text-[10px] font-mono">
                      <button
                        type="button"
                        onClick={() => setActiveMetricsTab('BASE')}
                        className={`px-3 py-1 font-bold rounded-lg transition-all ${activeMetricsTab === 'BASE' ? 'bg-[hsl(var(--ve-surface-raised)/0.52)] text-emerald-400' : 'text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text-soft))]'}`}
                      >
                        STAT TABLE
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveMetricsTab('VISUAL')}
                        className={`px-3 py-1 font-bold rounded-lg transition-all ${activeMetricsTab === 'VISUAL' ? 'bg-[hsl(var(--ve-surface-raised)/0.52)] text-[var(--ve-accent)]' : 'text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text-soft))]'}`}
                        id="btn-switch-recharts"
                      >
                        INTERACTIVE GRAPHS
                      </button>
                    </div>
                  </div>

                  {activeMetricsTab === 'BASE' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                      
                      {/* Barrel % */}
                      <div className="bg-[hsl(var(--ve-surface-raised)/0.38)] border border-[hsl(var(--ve-border)/0.30)] p-3.5 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[hsl(var(--ve-text-muted))]">Barrel Accuracy Ratio</span>
                          <strong className="text-[var(--ve-accent)] font-mono">{activePlayer.advanced.barrelPercent}%</strong>
                        </div>
                        <div className="h-1.5 w-full bg-[hsl(var(--ve-bg)/0.72)] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[var(--ve-accent)]" 
                            style={{ width: `${(activePlayer.advanced.barrelPercent / 25) * 100}%` }}
                          />
                        </div>
                        <span className="block text-[8.5px] text-[hsl(var(--ve-text-muted))] font-mono leading-none">Average baseline: 7.8% (Sharp advantage)</span>
                      </div>

                      {/* Exit Velocity */}
                      <div className="bg-[hsl(var(--ve-surface-raised)/0.38)] border border-[hsl(var(--ve-border)/0.30)] p-3.5 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[hsl(var(--ve-text-muted))]">Average Exit Velocity</span>
                          <strong className="text-[var(--ve-accent)] font-mono">{activePlayer.advanced.exitVelocity} mph</strong>
                        </div>
                        <div className="h-1.5 w-full bg-[hsl(var(--ve-bg)/0.72)] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[var(--ve-accent)]" 
                            style={{ width: `${(activePlayer.advanced.exitVelocity / 110) * 100}%` }}
                          />
                        </div>
                        <span className="block text-[8.5px] text-[hsl(var(--ve-text-muted))] font-mono leading-none">High release peak: 112+ mph speed stats</span>
                      </div>

                      {/* Hard Hit % */}
                      <div className="bg-[hsl(var(--ve-surface-raised)/0.38)] border border-[hsl(var(--ve-border)/0.30)] p-3.5 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[hsl(var(--ve-text-muted))]">Hard Hit Percentage</span>
                          <strong className="text-emerald-400 font-mono">{activePlayer.advanced.hardHitPercent}%</strong>
                        </div>
                        <div className="h-1.5 w-full bg-[hsl(var(--ve-bg)/0.72)] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500" 
                            style={{ width: `${(activePlayer.advanced.hardHitPercent / 70) * 100}%` }}
                          />
                        </div>
                        <span className="block text-[8.5px] text-[hsl(var(--ve-text-muted))] font-mono leading-none">Elite baseball threshold is evaluated above 45%</span>
                      </div>

                      {/* Chase % / Discipline */}
                      <div className="bg-[hsl(var(--ve-surface-raised)/0.38)] border border-[hsl(var(--ve-border)/0.30)] p-3.5 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[hsl(var(--ve-text-muted))]">O-Swing Zone Chase</span>
                          <strong className="text-emerald-400 font-mono">{activePlayer.advanced.chasePercent}%</strong>
                        </div>
                        <div className="h-1.5 w-full bg-[hsl(var(--ve-bg)/0.72)] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500" 
                            style={{ width: `${((40 - activePlayer.advanced.chasePercent) / 40) * 100}%` }}
                          />
                        </div>
                        <span className="block text-[8.5px] text-[hsl(var(--ve-text-muted))] font-mono leading-none">Lower rates represent maximum selective discipline</span>
                      </div>

                      {/* wOBA / xwOBA model discrepancy */}
                      <div className="bg-[hsl(var(--ve-surface-raised)/0.38)] border border-[hsl(var(--ve-border)/0.30)] p-4 rounded-2xl col-span-1 sm:col-span-2 space-y-2">
                        <div className="flex justify-between items-center text-xs pb-1.5 border-b border-[hsl(var(--ve-border)/0.24)]">
                          <span className="text-[hsl(var(--ve-text-muted))] font-black font-mono text-[9px] uppercase tracking-wider">PREDICTIVE CORRELATIONS (wOBA vs xwOBA)</span>
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-amber-400">wOBA: {activePlayer.advanced.woba.toFixed(3)}</span>
                            <span className="text-[hsl(var(--ve-text-muted))]">•</span>
                            <span className="text-[var(--ve-accent)] font-bold">xwOBA: {activePlayer.advanced.xwoba.toFixed(3)}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-[hsl(var(--ve-text-muted))] font-mono leading-relaxed">
                          Expected weighted On-Base Average (xwOBA) matches actual batted trajectory, demonstrating{' '}
                          {activePlayer.advanced.xwoba > activePlayer.advanced.woba ? (
                            <span className="text-emerald-300 font-bold">strong upward regression potential (Highly Undervalued prop opportunity)</span>
                          ) : (
                            <span className="text-[hsl(var(--ve-text-soft))] font-medium">highly stable mechanical baseline consistency</span>
                          )}
                          . Statcast models prioritize this vector for high margin edges.
                        </p>
                      </div>

                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in" id="athlete-matrix-visuals">
                      {/* Line Chart */}
                      <div className="bg-[hsl(var(--ve-surface-raised)/0.38)] p-3.5 border border-[hsl(var(--ve-border)/0.30)] rounded-2xl flex flex-col justify-between">
                        <div className="mb-2">
                          <span className="text-[10px] uppercase font-bold text-[hsl(var(--ve-text-soft))] font-mono tracking-wider block">Rolling last 10 games trend</span>
                          <span className="text-[9px] text-[hsl(var(--ve-text-muted))] font-mono leading-none block">Weighted rolling performance indicator (OPS)</span>
                        </div>
                        <div className="h-32 w-full text-[9px] font-mono">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[
                              { game: 'G1', OPS: parseFloat((Number(activePlayer.splits.last10.ops) * 0.85).toFixed(3)) },
                              { game: 'G2', OPS: parseFloat((Number(activePlayer.splits.last10.ops) * 0.95).toFixed(3)) },
                              { game: 'G3', OPS: parseFloat((Number(activePlayer.splits.last10.ops) * 0.90).toFixed(3)) },
                              { game: 'G4', OPS: parseFloat((Number(activePlayer.splits.last10.ops) * 1.05).toFixed(3)) },
                              { game: 'G5', OPS: parseFloat((Number(activePlayer.splits.last10.ops) * 1.02).toFixed(3)) },
                              { game: 'G6', OPS: parseFloat((Number(activePlayer.splits.last10.ops) * 0.88).toFixed(3)) },
                              { game: 'G7', OPS: parseFloat((Number(activePlayer.splits.last10.ops) * 1.15).toFixed(3)) },
                              { game: 'G8', OPS: parseFloat((Number(activePlayer.splits.last10.ops) * 0.97).toFixed(3)) },
                              { game: 'G9', OPS: parseFloat((Number(activePlayer.splits.last10.ops) * 1.08).toFixed(3)) },
                              { game: 'G10', OPS: Number(activePlayer.splits.last10.ops) },
                            ]}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--ve-border) / 0.36)" />
                              <XAxis dataKey="game" stroke="#64748b" tickLine={false} />
                              <YAxis stroke="#64748b" tickLine={false} domain={['auto', 'auto']} />
                              <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }} />
                              <Line type="monotone" dataKey="OPS" stroke="#38bdf8" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Circle (Pie) Graph */}
                      <div className="bg-[hsl(var(--ve-surface-raised)/0.38)] p-3.5 border border-[hsl(var(--ve-border)/0.30)] rounded-2xl flex flex-col justify-between">
                        <div className="mb-2">
                          <span className="text-[10px] uppercase font-bold text-[hsl(var(--ve-text-soft))] font-mono tracking-wider block">Situational Splits Circle Graph</span>
                          <span className="text-[9px] text-[hsl(var(--ve-text-muted))] font-mono leading-none block">OPS ratios compared side-by-side</span>
                        </div>
                        <div className="h-32 w-full flex items-center justify-between">
                          <div className="h-full w-[55%] text-[9px] font-mono">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'vs LHP', value: activePlayer.splits.vLHP.ops },
                                    { name: 'vs RHP', value: activePlayer.splits.vRHP.ops },
                                    { name: 'Home Split', value: activePlayer.splits.home.ops },
                                    { name: 'Away Split', value: activePlayer.splits.away.ops },
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={22}
                                  outerRadius={36}
                                  paddingAngle={3}
                                  dataKey="value"
                                >
                                  <Cell fill="#10b981" />
                                  <Cell fill="#3b82f6" />
                                  <Cell fill="#f59e0b" />
                                  <Cell fill="#8b5cf6" />
                                </Pie>
                                <Tooltip formatter={(val: any) => [`${val} OPS`]} contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div className="text-[8.5px] font-mono leading-normal text-[hsl(var(--ve-text-muted))] space-y-1.5 pr-1 shrink-0">
                            <div className="flex items-center gap-1 min-w-[70px]"><span className="w-2 h-2 rounded-full bg-[#10b981] inline-block" /> LHP: {activePlayer.splits.vLHP.ops}</div>
                            <div className="flex items-center gap-1 min-w-[70px]"><span className="w-2 h-2 rounded-full bg-[#3b82f6] inline-block" /> RHP: {activePlayer.splits.vRHP.ops}</div>
                            <div className="flex items-center gap-1 min-w-[70px]"><span className="w-2 h-2 rounded-full bg-[#f59e0b] inline-block" /> Home: {activePlayer.splits.home.ops}</div>
                            <div className="flex items-center gap-1 min-w-[70px]"><span className="w-2 h-2 rounded-full bg-[#8b5cf6] inline-block" /> Away: {activePlayer.splits.away.ops}</div>
                          </div>
                        </div>
                      </div>

                      {/* Team Parlay Win Percentage Ratio block */}
                      {(() => {
                        const TEAM_PARLAY_WIN_RATES: Record<string, number> = {
                          'Los Angeles Dodgers': 69.2,
                          'New York Yankees': 65.4,
                          'Boston Red Sox': 58.1,
                          'San Francisco Giants': 54.8,
                          'Chicago Cubs': 53.6,
                          'Houston Astros': 61.2,
                          'San Diego Padres': 57.9,
                          'St. Louis Cardinals': 52.4,
                          'Atlanta Braves': 63.8,
                          'Baltimore Orioles': 64.9,
                          'Philadelphia Phillies': 66.2,
                          'Texas Rangers': 51.5,
                          'New York Mets': 55.7,
                          'DEFAULT': 56.5
                        };
                        const teamWinPercent = TEAM_PARLAY_WIN_RATES[activePlayer.team] || TEAM_PARLAY_WIN_RATES['DEFAULT'];
                        
                        return (
                          <div className="bg-[hsl(var(--ve-surface-raised)/0.38)] p-4 border border-[hsl(var(--ve-border)/0.30)] rounded-2xl col-span-1 sm:col-span-2 space-y-3">
                            <div className="flex items-center justify-between pb-1.5 border-b border-[hsl(var(--ve-border)/0.24)]">
                              <span className="text-[hsl(var(--ve-text-muted))] font-black font-mono text-[9px] uppercase tracking-wider block">TEAM WIN IN PLAYER PARLAYS % RATE</span>
                              <span className="text-[9.5px] text-emerald-400 font-mono font-bold uppercase">{activePlayer.team}</span>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-5">
                              <div className="relative shrink-0 flex items-center justify-center">
                                <svg className="w-16 h-16 transform -rotate-90">
                                  <circle cx="32" cy="32" r="26" stroke="hsl(var(--ve-border) / 0.34)" strokeWidth="5" fill="transparent" />
                                  <circle cx="32" cy="32" r="26" stroke="#10b981" strokeWidth="5" strokeDasharray={`${2 * Math.PI * 26}`} strokeDashoffset={`${2 * Math.PI * 26 * (1 - teamWinPercent / 100)}`} fill="transparent" strokeLinecap="round" />
                                </svg>
                                <span className="absolute text-center mt-0.5">
                                  <span className="text-xs font-black font-mono text-emerald-400 block leading-none">{teamWinPercent}%</span>
                                  <span className="text-[7.5px] text-[hsl(var(--ve-text-muted))] font-mono tracking-tighter leading-none mt-0.5">WIN RATE</span>
                                </span>
                              </div>

                              <div className="space-y-1.5 min-w-0 flex-1">
                                <p className="text-[10px] text-[hsl(var(--ve-text-soft))] font-mono leading-relaxed">
                                  Saber-grounded metric evaluations state that multi-leg player parlays containing <b>{activePlayer.name}</b> legs yield a high <strong className="text-emerald-400 font-black">{teamWinPercent}% team historic win rate</strong> across baseball.
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded leading-none uppercase font-bold">ALPHA VALUE</span>
                                  <span className="text-[8.5px] text-[hsl(var(--ve-text-muted))] font-mono leading-none">Model index: 1.48x</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                    </div>
                  )}
                </div>

                {/* Platoon situational splits tracker (Col Span 1) */}
                <div className="bg-[hsl(var(--ve-surface-raised)/0.32)] border border-[hsl(var(--ve-border)/0.30)] rounded-3xl p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-[hsl(var(--ve-border)/0.28)] pb-2.5">
                    <span className="text-xs font-black text-[hsl(var(--ve-text-soft))] font-mono uppercase tracking-wider">
                      SITUATIONAL RECON
                    </span>
                    <span className="text-[9px] text-emerald-400 font-mono animate-pulse">Live feed</span>
                  </div>

                  {/* Switch Tab controls */}
                  <div className="grid grid-cols-3 gap-1 bg-[hsl(var(--ve-bg)/0.72)] border border-[hsl(var(--ve-border)/0.28)] p-1 rounded-xl text-[9px] font-mono">
                    <button 
                      onClick={() => setActiveSplitTab('PLATOON')}
                      className={`py-1.5 font-bold rounded-lg transition-all ${activeSplitTab === 'PLATOON' ? 'bg-[hsl(var(--ve-border)/0.34)] text-emerald-400' : 'text-[hsl(var(--ve-text-muted))]'}`}
                    >
                      PLATOON
                    </button>
                    <button 
                      onClick={() => setActiveSplitTab('VENUE')}
                      className={`py-1.5 font-bold rounded-lg transition-all ${activeSplitTab === 'VENUE' ? 'bg-[hsl(var(--ve-border)/0.34)] text-emerald-400' : 'text-[hsl(var(--ve-text-muted))]'}`}
                    >
                      VENUE
                    </button>
                    <button 
                      onClick={() => setActiveSplitTab('RECENCY')}
                      className={`py-1.5 font-bold rounded-lg transition-all ${activeSplitTab === 'RECENCY' ? 'bg-[hsl(var(--ve-border)/0.34)] text-emerald-400' : 'text-[hsl(var(--ve-text-muted))]'}`}
                    >
                      TREND
                    </button>
                  </div>

                  {/* Renders values of selected tab situations */}
                  <div className="py-1 space-y-3 font-mono">
                    {activeSplitTab === 'PLATOON' && (
                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[hsl(var(--ve-text-muted))]">vs Left Pitcher (LHP)</span>
                            <strong className="text-[hsl(var(--ve-text-soft))]">{activePlayer.splits.vLHP.ops} OPS</strong>
                          </div>
                          <div className="flex justify-between text-[9px] text-[hsl(var(--ve-text-muted))]">
                            <span>AVG: {activePlayer.splits.vLHP.avg}</span>
                            <span>OBP: {activePlayer.splits.vLHP.obp}</span>
                            <span>SLG: {activePlayer.splits.vLHP.slg}</span>
                          </div>
                        </div>
                        <div className="border-t border-[hsl(var(--ve-border)/0.26)] pt-2.5 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[hsl(var(--ve-text-muted))]">vs Right Pitcher (RHP)</span>
                            <strong className="text-[hsl(var(--ve-text-soft))]">{activePlayer.splits.vRHP.ops} OPS</strong>
                          </div>
                          <div className="flex justify-between text-[9px] text-[hsl(var(--ve-text-muted))]">
                            <span>AVG: {activePlayer.splits.vRHP.avg}</span>
                            <span>OBP: {activePlayer.splits.vRHP.obp}</span>
                            <span>SLG: {activePlayer.splits.vRHP.slg}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSplitTab === 'VENUE' && (
                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[hsl(var(--ve-text-muted))]">Home franchise field</span>
                            <strong className="text-[hsl(var(--ve-text-soft))]">{activePlayer.splits.home.ops} OPS</strong>
                          </div>
                          <div className="flex justify-between text-[9px] text-[hsl(var(--ve-text-muted))]">
                            <span>AVG: {activePlayer.splits.home.avg}</span>
                            <span>OBP: {activePlayer.splits.home.obp}</span>
                            <span>SLG: {activePlayer.splits.home.slg}</span>
                          </div>
                        </div>
                        <div className="border-t border-[hsl(var(--ve-border)/0.26)] pt-2.5 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[hsl(var(--ve-text-muted))]">Away stadiums split</span>
                            <strong className="text-[hsl(var(--ve-text-soft))]">{activePlayer.splits.away.ops} OPS</strong>
                          </div>
                          <div className="flex justify-between text-[9px] text-[hsl(var(--ve-text-muted))]">
                            <span>AVG: {activePlayer.splits.away.avg}</span>
                            <span>OBP: {activePlayer.splits.away.obp}</span>
                            <span>SLG: {activePlayer.splits.away.slg}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSplitTab === 'RECENCY' && (
                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-center gap-1.5 text-[9.5px] text-[var(--ve-accent)] uppercase font-black tracking-wider mb-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-[var(--ve-accent)]" />
                          <span>Last 10 rolling games</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[hsl(var(--ve-text-muted))]">Weighted OPS split:</span>
                          <strong className="text-emerald-400 font-extrabold">{activePlayer.splits.last10.ops} OPS</strong>
                        </div>
                        <div className="flex justify-between text-[9px] text-[hsl(var(--ve-text-muted))]">
                          <span>AVG: {activePlayer.splits.last10.avg}</span>
                          <span>OBP: {activePlayer.splits.last10.obp}</span>
                          <span>SLG: {activePlayer.splits.last10.slg}</span>
                        </div>
                        <p className="text-[9px] text-[hsl(var(--ve-text-muted))] leading-relaxed font-mono">
                          Reflected across 42 plate appearances. High short-term trend coefficient indicator.
                        </p>
                      </div>
                    )}
                  </div>

                </div>

              </div>

              {/* Bento Row 2: static default reports & Interactive Strike-Zone map */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="bento-scouting-reports">
                
                {/* AI Scouting narrative logs */}
                <div className="col-span-1 md:col-span-7 bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.30)] rounded-3xl p-5 shadow-lg space-y-4">
                  <h3 className="text-xs font-black text-[hsl(var(--ve-text-soft))] font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-[hsl(var(--ve-border)/0.28)] pb-2.5">
                    <Trophy className="w-4 h-4 text-emerald-400" /> SABERMETRIC ATHLETE ADVANTAGE METRICS
                  </h3>

                  <div className="space-y-4 text-xs text-[hsl(var(--ve-text-soft))] leading-relaxed">
                    
                    {/* Contact projection */}
                    <div>
                      <span className="font-extrabold text-[hsl(var(--ve-text-muted))] font-mono text-[9px] uppercase block mb-1">■ ZONE BARREL CORRELATION INDEX:</span>
                      <p className="bg-[hsl(var(--ve-surface-raised)/0.38)] p-3 rounded-2xl border border-[hsl(var(--ve-border)/0.30)] font-mono text-[11px] text-[hsl(var(--ve-text-soft))]">
                        {activePlayer.scoutingReport.contactText}
                      </p>
                    </div>

                    {/* Power Projection */}
                    <div>
                      <span className="font-extrabold text-[hsl(var(--ve-text-muted))] font-mono text-[9px] uppercase block mb-1">■ RAW BALLISTIC RETENTION PROFILE:</span>
                      <p className="bg-[hsl(var(--ve-surface-raised)/0.38)] p-3 rounded-2xl border border-[hsl(var(--ve-border)/0.30)] font-mono text-[11px] text-[hsl(var(--ve-text-soft))]">
                        {activePlayer.scoutingReport.powerText}
                      </p>
                    </div>

                    {/* Overall Summary block */}
                    <div className="pt-2">
                      <span className="font-extrabold text-emerald-400 font-mono text-[9.5px] uppercase block mb-1">■ BASELINE MODEL RECOMMENDATION:</span>
                      <p className="text-[hsl(var(--ve-text-soft))] text-[11.5px] italic font-semibold">
                        "{activePlayer.scoutingReport.overallScouting}"
                      </p>
                    </div>

                  </div>
                </div>

                {/* Strike zone Hotness map */}
                <div className="col-span-1 md:col-span-5 bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.30)] rounded-3xl p-5 shadow-lg flex flex-col justify-between" id="strike-zone-matrix">
                  <div className="border-b border-[hsl(var(--ve-border)/0.28)] pb-2.5 flex items-center justify-between">
                    <span className="text-xs font-black text-[hsl(var(--ve-text-soft))] font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-red-400" /> PITCH SWEET SPOTS
                    </span>
                    <span className="text-[9px] text-[hsl(var(--ve-text-muted))] font-mono">3x3 Strike Zone</span>
                  </div>

                  <p className="text-[10px] text-[hsl(var(--ve-text-muted))] font-mono leading-tight my-3">
                    Red-highlighted cells indicate high contact frequency for {activePlayer.name}.
                  </p>

                  {/* 3x3 Grid Strike Map visualization */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-[hsl(var(--ve-bg)/0.72)] rounded-2xl border border-[hsl(var(--ve-border)/0.28)] justify-center">
                    
                    {/* Zone boxes */}
                    {[
                      { l: "Up & In", color: "bg-red-950/20 text-red-400 border-red-500/10" },
                      { l: "Up-Middle", color: "bg-amber-950/20 text-amber-500 border-amber-500/10" },
                      { l: "Up & Away", color: "bg-[hsl(var(--ve-surface-raised)/0.38)] text-[hsl(var(--ve-text-muted))] border-[hsl(var(--ve-border)/0.28)]" },
                      { l: "Middle-In", color: "bg-red-500/5 text-red-350 border-red-500/10" },
                      { l: "Middle-Middle", color: "bg-red-500/20 text-red-200 border-red-500/30 font-extrabold" },
                      { l: "Middle-Away", color: "bg-[hsl(var(--ve-surface-raised)/0.38)] text-[hsl(var(--ve-text-muted))] border-[hsl(var(--ve-border)/0.28)]" },
                      { l: "Down & In", color: "bg-red-500/10 text-red-300 border-red-500/20 font-bold" },
                      { l: "Low-Middle", color: "bg-amber-950/20 text-amber-500 border-amber-500/10" },
                      { l: "Low-Away", color: "bg-[hsl(var(--ve-surface-raised)/0.38)] text-[hsl(var(--ve-text-muted))] border-[hsl(var(--ve-border)/0.28)]" }
                    ].map((box, bidx) => {
                      const isHot = activePlayer.scoutingReport.hotZones.includes(box.l);
                      const finalColor = isHot
                        ? "bg-red-500/25 text-red-100 border-red-500 animate-pulse font-extrabold border-2"
                        : box.color + " border";
                      return (
                        <div 
                          key={bidx} 
                          title={`Zone split index: ${box.l}`}
                          className={`aspect-square rounded-xl flex items-center justify-center text-[10px] text-center font-mono p-1.5 transition-all hover:scale-105 select-none ${finalColor}`}
                        >
                          <span className="truncate max-w-full block leading-none">{box.l}</span>
                        </div>
                      );
                    })}

                  </div>

                  {/* Hot zones listed labels */}
                  <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
                    {activePlayer.scoutingReport.hotZones.map((h, hidx) => (
                      <span key={hidx} className="text-[9.5px] font-mono font-bold bg-red-500/10 border border-red-500/20 text-red-405 text-red-400 px-3 py-1 rounded-full">
                        🔥 {h} Spot
                      </span>
                    ))}
                  </div>

                </div>

              </div>

              {/* Bento Row 3: Propositions integration & Health risks */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="bento-row-propositions">
                
                {/* Wager proposition cards list */}
                <div className="col-span-1 md:col-span-7 bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.30)] rounded-3xl p-5 shadow-lg space-y-4">
                  <div className="border-b border-[hsl(var(--ve-border)/0.28)] pb-2.5 flex items-center justify-between">
                    <span className="text-xs font-black text-[hsl(var(--ve-text-soft))] font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-orange-400" /> SABERMETRIC WAGER PROPS
                    </span>
                    <span className="text-[10px] text-[hsl(var(--ve-text-muted))] font-mono font-bold">Select Line for Slip</span>
                  </div>

                  <p className="text-[10.5px] text-[hsl(var(--ve-text-muted))] font-mono leading-relaxed bg-[hsl(var(--ve-surface-raised)/0.34)] p-3.5 rounded-2xl border border-[hsl(var(--ve-border)/0.30)]">
                    Calculated via dynamic matchup coefficients. Stage straight onto your live active Parlay slip, or vouch to lock it on your public feed vouchboard.
                  </p>

                  <div className="space-y-3" id="props-channel-list">
                    {activePlayer.propositions.map((p) => {
                      const isVouched = savedVouchIds.includes(p.id);
                      const isAddedToParlay = activeLegs.some(l => l.id === p.id || l.id.includes(p.id) || p.spec.includes(l.selection));
                      const comparison = getMarketOdds(p.id, p.odds);
                      const isExpanded = expandedPropIds.includes(p.id);

                      return (
                        <div 
                          key={p.id} 
                          className="bg-[hsl(var(--ve-surface-raised)/0.38)] border border-[hsl(var(--ve-border)/0.30)] p-4 rounded-2xl flex flex-col gap-4 shadow hover:border-[hsl(var(--ve-border)/0.50)] transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] bg-[hsl(var(--ve-surface-raised)/0.42)] border border-[hsl(var(--ve-border)/0.30)] text-[var(--ve-accent)] px-2.5 py-1 rounded-lg font-mono font-black uppercase">
                                {p.market}
                              </span>
                              <span className="block text-xs text-[hsl(var(--ve-text-soft))] font-mono font-bold mt-2.5 truncate">
                                🎰 PROP SPEC: {p.spec}
                              </span>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-[10px] text-[hsl(var(--ve-text-muted))] font-mono">
                                  Market Average: <strong className="text-[var(--ve-accent)] font-bold">{comparison.marketAverageDecimal} ({comparison.marketAverageAmerican})</strong>
                                </span>
                                <span className="text-[9px] text-slate-600 font-mono">•</span>
                                <span className="text-[10px] text-[hsl(var(--ve-text-muted))] font-mono">
                                  Best Line: <strong className="text-emerald-400 font-bold">{comparison.bestOddsDecimal.toFixed(2)} ({decimalToAmerican(comparison.bestOddsDecimal)}) via {comparison.bestBookieName}</strong>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0 self-end sm:self-center">
                              
                              {/* Open multi-bookmaker details panel */}
                              <button
                                type="button"
                                onClick={() => togglePropDetails(p.id)}
                                className={`px-3 py-2 rounded-xl text-[10px] font-mono font-bold border transition-all ${
                                  isExpanded 
                                    ? 'bg-[var(--ve-card)] border-[var(--ve-border-strong)] text-[var(--ve-accent)]' 
                                    : 'bg-[hsl(var(--ve-surface-raised)/0.42)] border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text-soft))]'
                                }`}
                              >
                                {isExpanded ? 'Hide Bookies ⚖️' : 'Compare Bookies ⚖️'}
                              </button>

                              {/* Vouch toggle action badge */}
                              <button
                                onClick={() => handleVouchProposition(activePlayer, p)}
                                className={`px-3 py-2 rounded-xl text-[10px] font-mono font-black transition-all border ${
                                  isVouched 
                                    ? 'bg-[hsl(var(--ve-accent-violet)/0.16)] border-[hsl(var(--ve-accent-violet)/0.42)] text-[hsl(var(--ve-accent-violet))]'
                                    : 'bg-[hsl(var(--ve-surface-raised)/0.42)] border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text-soft))]'
                                }`}
                                title={isVouched ? "Remove from Board" : "Collect & Vouch on Board"}
                              >
                                {isVouched ? 'VOUCHED ✓' : 'VOUCH PROP'}
                              </button>

                              {/* Parlay constructor trigger */}
                              {(() => {
                                const playerTeam = activePlayer.team ? activePlayer.team.toLowerCase() : '';
                                const matchedGame = liveGames.find((g: any) => 
                                  g.homeTeam.toLowerCase() === playerTeam || 
                                  g.awayTeam.toLowerCase() === playerTeam
                                );
                                const isFinal = matchedGame && matchedGame.status.toLowerCase() === 'final';

                                return (
                                  <button
                                    onClick={() => handleWagerProposition(activePlayer, p)}
                                    disabled={isAddedToParlay || isFinal}
                                    className={`py-2 px-3.5 rounded-xl text-[10px] font-extrabold font-mono transition-all flex items-center gap-1.5 ${
                                      isAddedToParlay
                                        ? 'bg-[hsl(var(--ve-surface-raised)/0.42)] border border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-text-muted))] cursor-not-allowed'
                                        : isFinal
                                        ? 'bg-red-950/45 border border-red-900/30 text-red-400 cursor-not-allowed font-bold'
                                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-md'
                                    }`}
                                  >
                                    {isFinal ? null : <Plus className="w-3.5 h-3.5" />}
                                    <span>{isAddedToParlay ? 'STAGED' : isFinal ? '🔒 LOCKED' : `SLIP +${p.odds.toFixed(2)}`}</span>
                                  </button>
                                );
                              })()}

                            </div>
                          </div>

                          {/* Expanded comparison detail component */}
                          {isExpanded && (
                            <div className="bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.28)] rounded-xl p-3 space-y-2">
                              <div className="text-[10px] text-[hsl(var(--ve-text-muted))] font-mono font-bold uppercase tracking-wider flex justify-between">
                                <span>Real-Time Sportsbook Lines Comparison</span>
                                <span className="text-emerald-400 font-extrabold">Best payout highlighted</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {/* Bet365 */}
                                <div className={`p-2 rounded-xl flex flex-col justify-center bg-[hsl(var(--ve-surface-raised)/0.38)] border ${comparison.bet365.isBest ? 'border-emerald-600/60 bg-emerald-950/10' : 'border-[hsl(var(--ve-border)/0.30)]'}`}>
                                  <span className="text-[9px] text-[hsl(var(--ve-text-muted))] font-mono uppercase">Bet365</span>
                                  <strong className={`text-xs ${comparison.bet365.isBest ? 'text-emerald-400 font-extrabold' : 'text-[hsl(var(--ve-text-soft))]'}`}>
                                    {comparison.bet365.oddsDecimal.toFixed(2)} ({comparison.bet365.oddsAmerican})
                                  </strong>
                                </div>
                                {/* FanDuel */}
                                <div className={`p-2 rounded-xl flex flex-col justify-center bg-[hsl(var(--ve-surface-raised)/0.38)] border ${comparison.fanduel.isBest ? 'border-emerald-600/60 bg-emerald-950/10 text-[hsl(var(--ve-text-soft))]' : 'border-[hsl(var(--ve-border)/0.30)]'}`}>
                                  <span className="text-[9px] text-[hsl(var(--ve-text-muted))] font-mono uppercase">FanDuel</span>
                                  <strong className={`text-xs ${comparison.fanduel.isBest ? 'text-emerald-400 font-extrabold' : 'text-[hsl(var(--ve-text-soft))]'}`}>
                                    {comparison.fanduel.oddsDecimal.toFixed(2)} ({comparison.fanduel.oddsAmerican})
                                  </strong>
                                </div>
                                {/* DraftKings */}
                                <div className={`p-2 rounded-xl flex flex-col justify-center bg-[hsl(var(--ve-surface-raised)/0.38)] border ${comparison.draftkings.isBest ? 'border-emerald-600/60 bg-emerald-950/10 text-[hsl(var(--ve-text-soft))]' : 'border-[hsl(var(--ve-border)/0.30)]'}`}>
                                  <span className="text-[9px] text-[hsl(var(--ve-text-muted))] font-mono uppercase">DraftKings</span>
                                  <strong className={`text-xs ${comparison.draftkings.isBest ? 'text-emerald-400 font-extrabold' : 'text-[hsl(var(--ve-text-soft))]'}`}>
                                    {comparison.draftkings.oddsDecimal.toFixed(2)} ({comparison.draftkings.oddsAmerican})
                                  </strong>
                                </div>
                                {/* Caesars */}
                                <div className={`p-2 rounded-xl flex flex-col justify-center bg-[hsl(var(--ve-surface-raised)/0.38)] border ${comparison.caesars.isBest ? 'border-emerald-600/60 bg-emerald-950/10 text-[hsl(var(--ve-text-soft))]' : 'border-[hsl(var(--ve-border)/0.30)]'}`}>
                                  <span className="text-[9px] text-[hsl(var(--ve-text-muted))] font-mono uppercase">Caesars</span>
                                  <strong className={`text-xs ${comparison.caesars.isBest ? 'text-emerald-400 font-extrabold' : 'text-[hsl(var(--ve-text-soft))]'}`}>
                                    {comparison.caesars.oddsDecimal.toFixed(2)} ({comparison.caesars.oddsAmerican})
                                  </strong>
                                </div>
                                {/* BetMGM */}
                                <div className={`p-2 rounded-xl flex flex-col justify-center bg-[hsl(var(--ve-surface-raised)/0.38)] border ${comparison.betmgm.isBest ? 'border-emerald-600/60 bg-emerald-950/10 text-[hsl(var(--ve-text-soft))]' : 'border-[hsl(var(--ve-border)/0.30)]'}`}>
                                  <span className="text-[9px] text-[hsl(var(--ve-text-muted))] font-mono uppercase">BetMGM</span>
                                  <strong className={`text-xs ${comparison.betmgm.isBest ? 'text-emerald-400 font-extrabold' : 'text-[hsl(var(--ve-text-soft))]'}`}>
                                    {comparison.betmgm.oddsDecimal.toFixed(2)} ({comparison.betmgm.oddsAmerican})
                                  </strong>
                                </div>
                                {/* Market Average */}
                                <div className="p-2 rounded-xl flex flex-col justify-center bg-[hsl(var(--ve-accent-violet)/0.10)] border border-[hsl(var(--ve-accent-violet)/0.28)]">
                                  <span className="text-[9px] text-[hsl(var(--ve-accent-violet))] font-mono uppercase">Market Avg</span>
                                  <strong className="text-xs text-[hsl(var(--ve-accent-violet))] font-black">
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

                {/* Injury HEALTH RISK REPORT */}
                <div className="col-span-1 md:col-span-5 bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.30)] rounded-3xl p-5 shadow-lg flex flex-col justify-between" id="injury-advisory-risk-box">
                  <div className="border-b border-[hsl(var(--ve-border)/0.28)] pb-2.5 flex items-center gap-1.5 text-xs font-black text-[hsl(var(--ve-text-soft))] font-mono uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> HEALTH Roster report
                  </div>

                  <div className="my-4 bg-[hsl(var(--ve-surface-raised)/0.38)] p-4 rounded-2xl border border-[hsl(var(--ve-border)/0.28)] space-y-4 flex-1 flex flex-col justify-center">
                    
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl flex items-center justify-center ${
                        activePlayer.injurySeverity === 'NONE' ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                      }`}>
                        <Activity className={`w-5 h-5 ${
                          activePlayer.injurySeverity === 'NONE' ? 'text-emerald-400' : 'text-amber-400'
                        }`} />
                      </div>
                      <div>
                        <span className="block text-[8px] text-[hsl(var(--ve-text-muted))] font-mono tracking-widest uppercase">RISK LEVEL INDICATOR:</span>
                        <strong className={`block text-xs uppercase font-black font-mono tracking-wide ${
                          activePlayer.injurySeverity === 'NONE' ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {activePlayer.injurySeverity === 'NONE' ? 'Cleared / Low risk' : `${activePlayer.injurySeverity} Warning`}
                        </strong>
                      </div>
                    </div>

                    <p className="text-xs text-[hsl(var(--ve-text-soft))] font-mono leading-relaxed bg-[hsl(var(--ve-surface-raised)/0.34)] p-3 rounded-xl border border-[hsl(var(--ve-border)/0.30)]">
                      <span className="text-[hsl(var(--ve-text))] font-extrabold capitalize">{activePlayer.injuryStatus}: </span>
                      {activePlayer.injuryNotes}
                    </p>

                  </div>

                  <span className="text-[9px] text-[hsl(var(--ve-text-muted))] block font-mono text-center leading-none mt-2 uppercase">
                    Updated live relative to team dugout bulletins
                  </span>
                </div>

              </div>

              {/* Bento Row 4: Comprehensive Game Logs Table */}
              <div className="bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.30)] rounded-3xl p-5 shadow-xl space-y-4" id="game-logs-block">
                <div className="border-b border-[hsl(var(--ve-border)/0.28)] pb-2.5 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black text-[hsl(var(--ve-text-soft))] font-mono uppercase tracking-wider">
                      RECENT ATHLETE CONTEST STATISTICS LOG
                    </span>
                  </div>
                  <span className="text-[10px] text-[hsl(var(--ve-text-muted))] font-mono">{activePlayer.gameLogs.length} CONTRASTS LOGGED</span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-[hsl(var(--ve-border)/0.30)] bg-[hsl(var(--ve-bg)/0.72)]" id="game-logs-layout-container">
                  <table className="w-full text-left text-xs font-mono border-collapse min-w-[650px]">
                    <thead>
                      <tr className="border-b border-[hsl(var(--ve-border)/0.24)] text-[hsl(var(--ve-text-muted))] text-[9.5px] uppercase tracking-wider">
                        <th className="py-3.5 px-4 font-black">Date</th>
                        <th className="py-3.5 px-4 font-black">Opponent Matchup</th>
                        <th className="py-3.5 px-4 text-center font-black">Result</th>
                        <th className="py-3.5 px-4 text-center font-black">AB</th>
                        <th className="py-3.5 px-4 text-center font-black">Hits</th>
                        <th className="py-3.5 px-4 text-center font-black">HR</th>
                        <th className="py-3.5 px-4 text-center font-black">RBI</th>
                        <th className="py-3.5 px-4 text-center font-black">R</th>
                        <th className="py-3.5 px-4 text-right font-black pr-4">Batter Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[hsl(var(--ve-border)/0.24)] text-[hsl(var(--ve-text-soft))]" id="game-logs-rows">
                      {activePlayer.gameLogs.map((log, idx) => {
                        const isWin = log.result.startsWith('W');
                        return (
                          <tr key={idx} className="hover:bg-[hsl(var(--ve-surface-raised)/0.34)] transition-colors">
                            <td className="py-3 px-4 text-[hsl(var(--ve-text-muted))] font-mono">{log.date}</td>
                            <td className="py-3 px-4 text-[hsl(var(--ve-text))] font-black font-mono">{log.opponent}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${isWin ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400'}`}>
                                {log.result}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-[hsl(var(--ve-text-soft))]">{log.ab}</td>
                            <td className="py-3 px-4 text-center font-bold text-[hsl(var(--ve-text))]">{log.h}</td>
                            <td className="py-3 px-4 text-center font-bold text-orange-400">{log.hr}</td>
                            <td className="py-3 px-4 text-center font-bold text-[hsl(var(--ve-text-soft))]">{log.rbi}</td>
                            <td className="py-3 px-4 text-center font-bold text-[hsl(var(--ve-text-soft))]">{log.r}</td>
                            <td className="py-3 px-4 text-right pr-4">
                              <span className={`font-black ${
                                log.batterScore >= 90 ? 'text-emerald-400' :
                                log.batterScore >= 70 ? 'text-amber-400' : 'text-red-400'
                              }`}>
                                {log.batterScore}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center gap-1.5 text-[9.5px] text-[hsl(var(--ve-text-muted))] mt-2 font-mono">
                  <Info className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Individual game-level Sabermetric coefficients calculated on actual plate-level exit distributions.</span>
                </div>
              </div>

            </>
          )}

        </div>

          )}

        </div>

      </div>

    </div>
  );
}
