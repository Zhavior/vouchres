import { useState, useEffect } from 'react';
import { appAlert } from '../../../lib/appToast';
import { apiClient } from '../../../lib/apiClient';
import { MLBPlayer, Vouch } from '../../../types';
import { MLB_PLAYER_RECORDS } from '../../../data/playerData';
import { searchMLBPlayers, enrichPlayerStats, getActiveMLBRoster } from '../../../utils/mlbApi';
import { getTeamColors } from '../utils/teamColors';
import type { AiReportCache, DossierMode, MetricsTab, PlayerResearchConsoleProps, SplitTab } from '../types';

export function usePlayerResearchConsole({
  onAddLegToParlay,
  onSaveVouch,
  savedVouchIds,
  activeLegs,
  liveGames = [],
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
      const data = await apiClient.post<{ aiScore?: number; report?: string; status?: string; groundingMetadata?: { webSearchQueries?: string[] } }>(
        '/api/ai/player-research',
        { playerData: player },
      );
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
      appAlert(`⚠️ Cannot select player prop: The game for ${player.name} (${matchedGame.awayTeam} @ ${matchedGame.homeTeam}) is already done (status: Final). Placing picks on concluded games is strictly prohibited.`);
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


  const activeColors = getTeamColors(activePlayer.team);
  const activeAiReport = aiReportCache[activePlayer.id];


  return {
    // props passthrough
    onAddLegToParlay,
    onSaveVouch,
    savedVouchIds,
    activeLegs,
    liveGames,
    // state + setters + handlers
    searchTerm, setSearchTerm,
    selectedTeam, setSelectedTeam,
    selectedInjuryStatus, setSelectedInjuryStatus,
    selectedPosition, setSelectedPosition,
    opposingPitcherType, setOpposingPitcherType,
    dossierMode, setDossierMode,
    activePlayer, setActivePlayer,
    compareMode, setCompareMode,
    comparePlayer, setComparePlayer,
    displayedPlayers, setDisplayedPlayers,
    allTeams, setAllTeams,
    ROSTER_RENDER_CAP,
    isSearchingApi, setIsSearchingApi,
    isRefreshingApi, setIsRefreshingApi,
    activeSplitTab, setActiveSplitTab,
    activeMetricsTab, setActiveMetricsTab,
    expandedPropIds, setExpandedPropIds,
    togglePropDetails,
    aiReportCache, setAiReportCache,
    isResearching, setIsResearching,
    toastMessage, setToastMessage,
    showToast,
    runLiveAIResearch,
    teams,
    positions,
    filteredPlayers,
    handleWagerProposition,
    handleVouchProposition,
    selectActivePlayer,
    selectComparePlayer,
    activeColors,
    activeAiReport,
  };
}

export type PlayerResearchModel = ReturnType<typeof usePlayerResearchConsole>;
