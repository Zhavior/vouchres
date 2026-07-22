"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "../lib/motion";
import {
  Search, LayoutGrid, Table2, X, Plus, Shield, TrendingUp,
  Activity, Zap, ChevronRight, BarChart3, Crosshair, Sparkles,
  AlertTriangle, CheckCircle2, Lock, RefreshCw,
} from "lucide-react";

/* ============================================================================
   PlayerResearchHub — Premium Analytics Dashboard
   ----------------------------------------------------------------------------
   3 modes: Scout (deep dive) / Compare (head-to-head) / Build (prop board)
   List: toggle between card grid and sortable table
   Detail: modal overlay with 5 tabs (Overview / Splits / Game Log / AI / Markets)
   Style: Bloomberg terminal — dark glass, large numbers, data-confidence badges

   Drop-in replacement for: src/components/PlayerResearchConsole.tsx
   Backend player registry is the main source of truth. MLB_PLAYER_RECORDS only
   enriches official backend players or acts as a fallback when backend is down.
   ============================================================================ */

import { MLBPlayer, Leg, Vouch } from "../types";
import { MLB_PLAYER_RECORDS } from "../data/playerData";
import { apiClient } from "../lib/apiClient";
import { openParlayAdd } from "../lib/parlays/parlayAddContract";
import { resolveParlayPlayerRole } from "../lib/parlays/parlayMarketCatalog";
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
  Z8_SURFACE,
  Z8_WARNING,
} from "../theme/z8Tokens";

interface Markets {
  onAddLegToParlay: (player: MLBPlayer, prop: { id: string; market: string; odds: number | null; spec: string; truthLabel?: string }) => void;
  onSaveVouch: (vouch: Vouch) => void;
  savedVouchIds: string[];
  activeLegs: Leg[];
  liveGames?: any[];
}


const PLAYER_RESEARCH_PRO_TABS = [
  'Overview',
  'Game Log',
  'Splits',
  'Statcast',
  'Matchup',
  'Markets',
  'V.A.I Fit',
] as const;

const PLAYER_RESEARCH_TRUTH_RULES = [
  'Official IDs only: playerId, teamId, gamePk, gameStartTime.',
  'No fake odds. Unknown sportsbook prices display as Odds TBD.',
  'Sourced stats render with truth badges. Missing stats render as Unavailable.',
  'Model scores are labeled estimates, never guarantees.',
];

const PLAYER_RESEARCH_PRO_IDEAS = [
  'Last 10 / 15 / 30 / season game logs',
  'Hits, total bases, HR, RBI, runs, stolen base trends',
  'Statcast trend panels for EV, launch angle, barrels, hard-hit, xwOBA',
  'Pitcher matchup, park, weather, lineup, and game status context',
  'Banker / Analyst / Hunter / Shark fit panel',
  'Research receipts and parlay-safe market buttons',
] as const;

type Mode = "scout" | "compare" | "build";
type ListStyle = "grid" | "table";
type DetailTab = "overview" | "splits" | "gamelog" | "ai" | "markets";

interface BackendRegistryPlayer {
  playerId: number;
  id: string;
  playerName: string;
  name: string;
  teamId: number;
  team: string;
  position: string;
  bats?: "L" | "R" | "S" | "U";
  throws?: "L" | "R" | "U";
  headshot: string;
  rosterType?: string;
  dataSource?: string;
}

const fallbackByName = new Map(MLB_PLAYER_RECORDS.map((player) => [player.name.toLowerCase(), player]));

function normalizeHand(value: string | undefined, fallback: "L" | "R" | "S" = "R"): "L" | "R" | "S" {
  return value === "L" || value === "R" || value === "S" ? value : fallback;
}

function normalizeThrow(value: string | undefined): "L" | "R" {
  return value === "L" || value === "R" ? value : "R";
}

function fallbackPlayerShell(player: BackendRegistryPlayer): MLBPlayer {
  const name = player.playerName || player.name || `Player ${player.playerId}`;
  return {
    id: String(player.playerId || player.id),
    name,
    team: player.team || "MLB",
    position: player.position || "MLB",
    number: "—",
    headshot: player.headshot || `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${player.playerId}/headshot/67/current`,
    injuryStatus: "Status unavailable",
    injurySeverity: "NONE",
    injuryNotes: "Backend registry identity only. Enriched local research is unavailable for this player.",
    batterScore: 50,
    seasonStats: { avg: "—", hr: "—", rbi: "—", ops: "—" },
    gameLogs: [],
    propositions: [
      { id: `prop_${player.playerId}_hit_1`, market: "1+ Hit", odds: null, spec: `${name} 1+ Hit`, truthLabel: "Base hit prop · Odds pending sportsbook feed" },
      { id: `prop_${player.playerId}_hit_2`, market: "2+ Hits", odds: null, spec: `${name} 2+ Hits`, truthLabel: "Multi-hit prop · Odds pending sportsbook feed" },
      { id: `prop_${player.playerId}_hit_3`, market: "3+ Hits", odds: null, spec: `${name} 3+ Hits`, truthLabel: "High hit-count prop · Odds pending sportsbook feed" },
      { id: `prop_${player.playerId}_hit_4`, market: "4+ Hits", odds: null, spec: `${name} 4+ Hits`, truthLabel: "Rare hit-count prop · Odds pending sportsbook feed" },

      { id: `prop_${player.playerId}_single`, market: "Single", odds: null, spec: `${name} Single`, truthLabel: "Base-hit type · Odds pending sportsbook feed" },
      { id: `prop_${player.playerId}_double`, market: "Double", odds: null, spec: `${name} Double`, truthLabel: "Extra-base prop · Odds pending sportsbook feed" },
      { id: `prop_${player.playerId}_triple`, market: "Triple", odds: null, spec: `${name} Triple`, truthLabel: "Rare extra-base prop · Odds pending sportsbook feed" },
      { id: `prop_${player.playerId}_hr`, market: "Home Run", odds: null, spec: `${name} HR`, truthLabel: "Power prop · Odds pending sportsbook feed" },

      { id: `prop_${player.playerId}_rbi_1`, market: "1+ RBI", odds: null, spec: `${name} 1+ RBI`, truthLabel: "Run-production prop · Odds pending sportsbook feed" },
      { id: `prop_${player.playerId}_rbi_2`, market: "2+ RBI", odds: null, spec: `${name} 2+ RBI`, truthLabel: "Run-production prop · Odds pending sportsbook feed" },
      { id: `prop_${player.playerId}_rbi_3`, market: "3+ RBI", odds: null, spec: `${name} 3+ RBI`, truthLabel: "High run-production prop · Odds pending sportsbook feed" },
      { id: `prop_${player.playerId}_rbi_4`, market: "4+ RBI", odds: null, spec: `${name} 4+ RBI`, truthLabel: "Rare run-production prop · Odds pending sportsbook feed" },
      { id: `prop_${player.playerId}_rbi_5`, market: "5+ RBI", odds: null, spec: `${name} 5+ RBI`, truthLabel: "Ceiling run-production prop · Odds pending sportsbook feed" },

      { id: `prop_${player.playerId}_sb_1`, market: "1 Stolen Base", odds: null, spec: `${name} 1 SB`, truthLabel: "Speed prop · Odds pending sportsbook feed" },

      { id: `prop_${player.playerId}_tb_1`, market: "1+ Total Base", odds: null, spec: `${name} 1+ TB`, truthLabel: "Total-base floor prop · Odds pending sportsbook feed" },
      { id: `prop_${player.playerId}_tb_2`, market: "2+ Total Bases", odds: null, spec: `${name} 2+ TB`, truthLabel: "Total-base prop · Odds pending sportsbook feed" },
      { id: `prop_${player.playerId}_tb_3`, market: "3+ Total Bases", odds: null, spec: `${name} 3+ TB`, truthLabel: "Extra-base ceiling prop · Odds pending sportsbook feed" },
      { id: `prop_${player.playerId}_tb_4`, market: "4+ Total Bases", odds: null, spec: `${name} 4+ TB`, truthLabel: "Quadra / 4-base prop · Odds pending sportsbook feed" },
    ],
    bats: normalizeHand(player.bats),
    throws: normalizeThrow(player.throws),
    height: "—",
    weight: "—",
    birthdate: "—",
    advanced: {
      barrelPercent: 0,
      launchAngle: 0,
      exitVelocity: 0,
      hardHitPercent: 0,
      chasePercent: 0,
      woba: 0,
      xwoba: 0,
      sweetSpotPercent: 0,
    },
    splits: {
      vLHP: { avg: "—", obp: "—", slg: "—", ops: "—" },
      vRHP: { avg: "—", obp: "—", slg: "—", ops: "—" },
      home: { avg: "—", obp: "—", slg: "—", ops: "—" },
      away: { avg: "—", obp: "—", slg: "—", ops: "—" },
      last10: { avg: "—", obp: "—", slg: "—", ops: "—" },
    },
    scoutingReport: {
      powerText: "Backend registry identity is available. Deeper research requires enriched stats.",
      contactText: "Backend registry identity is available. Deeper research requires enriched stats.",
      disciplineText: "Backend registry identity is available. Deeper research requires enriched stats.",
      overallScouting: "Official MLB player registry record loaded from the backend.",
      hotZones: ["Data unavailable"],
      riskFactor: "MEDIUM",
    },
  };
}

function mapBackendPlayer(player: BackendRegistryPlayer): MLBPlayer {
  const name = player.playerName || player.name || "";
  const fallback = fallbackByName.get(name.toLowerCase());
  const shell = fallbackPlayerShell(player);
  return {
    ...shell,
    ...(fallback || {}),
    id: String(player.playerId || player.id),
    name: name || fallback?.name || shell.name,
    team: player.team || fallback?.team || shell.team,
    position: player.position || fallback?.position || shell.position,
    headshot: player.headshot || fallback?.headshot || shell.headshot,
    bats: normalizeHand(player.bats, fallback?.bats || "R"),
    throws: normalizeThrow(player.throws || fallback?.throws),
  };
}

async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  return apiClient.get<T>(path, undefined, signal);
}

const isSeedPlayerRecord = (player: MLBPlayer) => {
  return MLB_PLAYER_RECORDS.some((seed) => seed.id === player.id);
};

const getOfficialSeasonStat = (player: MLBPlayer, key: keyof MLBPlayer["seasonStats"]) => {
  if (isSeedPlayerRecord(player)) return "—";
  return player.seasonStats[key] || "—";
};

const getSeasonStatSourceLabel = (player: MLBPlayer) => {
  return isSeedPlayerRecord(player) ? "Seed Data" : "MLB API";
};

const parseOfficialSeasonStat = (player: MLBPlayer, key: keyof MLBPlayer["seasonStats"]) => {
  const value = getOfficialSeasonStat(player, key);
  const numeric = Number.parseFloat(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : Number.NEGATIVE_INFINITY;
};

export default function PlayerResearchHub({
  onAddLegToParlay,
  onSaveVouch,
  savedVouchIds,
  activeLegs,
  liveGames,
}: Markets) {
  const [mode, setMode] = useState<Mode>("scout");
  const [listStyle, setListStyle] = useState<ListStyle>("grid");
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [quickFilter, setQuickFilter] = useState<"all" | "top5" | "wind" | "confirmed" | "hot">("all");
  const [sortBy, setSortBy] = useState<"batterScore" | "hr" | "avg" | "ops" | "name">("batterScore");
  const [selectedPlayer, setSelectedPlayer] = useState<MLBPlayer | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [registryPlayers, setRegistryPlayers] = useState<MLBPlayer[]>(MLB_PLAYER_RECORDS);
  const [allRegistryPlayers, setAllRegistryPlayers] = useState<MLBPlayer[]>([]);
  const [backendCount, setBackendCount] = useState<number | null>(null);
  const [registryStatus, setRegistryStatus] = useState<"loading" | "ready" | "fallback" | "error">("loading");
  const [registryError, setRegistryError] = useState("");

  // Compare mode
  const [compareA, setCompareA] = useState<MLBPlayer | null>(null);
  const [compareB, setCompareB] = useState<MLBPlayer | null>(null);

  // AI research state
  const [aiReports, setAiReports] = useState<Record<string, string>>({});
  const [researching, setResearching] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadRegistry() {
      try {
        setRegistryStatus("loading");
        const [countPayload, registryPayload] = await Promise.all([
          fetchJson<{ count: number }>("/api/mlb/players/count", controller.signal),
          fetchJson<{ players: BackendRegistryPlayer[] }>("/api/mlb/players/registry", controller.signal),
        ]);
        setBackendCount(countPayload.count);
        const mapped = (registryPayload.players || []).map(mapBackendPlayer);
        setAllRegistryPlayers(mapped);
        setRegistryPlayers(mapped);
        setRegistryStatus("ready");
        setRegistryError("");
      } catch (error) {
        if (controller.signal.aborted) return;
        setRegistryPlayers(MLB_PLAYER_RECORDS);
        setBackendCount(null);
        setRegistryStatus("fallback");
        setRegistryError(error instanceof Error ? error.message : "Backend player registry unavailable.");
      }
    }
    loadRegistry();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const query = search.trim();
    if (!query) {
      if (allRegistryPlayers.length) setRegistryPlayers(allRegistryPlayers);
      return;
    }
    const controller = new AbortController();
    async function runBackendSearch() {
      try {
        const payload = await fetchJson<{ players: BackendRegistryPlayer[] }>(
          `/api/mlb/players/search?q=${encodeURIComponent(query)}`,
          controller.signal
        );
        setRegistryPlayers((payload.players || []).map(mapBackendPlayer));
        setRegistryStatus("ready");
        setRegistryError("");
      } catch (error) {
        if (controller.signal.aborted) return;
        setRegistryStatus("fallback");
        setRegistryError(error instanceof Error ? error.message : "Backend search unavailable.");
      }
    }
    const timer = window.setTimeout(runBackendSearch, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [search, allRegistryPlayers]);

  const players = registryPlayers;


  const teams = useMemo(() => {
    const set = new Set(players.map((p) => p.team));
    return ["ALL", ...Array.from(set).sort()];
  }, [players]);

  const filtered = useMemo(() => {
    let result = players;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q) || p.position.toLowerCase().includes(q)
      );
    }
    if (teamFilter !== "ALL") {
      result = result.filter((p) => p.team === teamFilter);
    }

    if (quickFilter === "top5") {
      result = result.slice(0, 5);
    } else if (quickFilter === "wind") {
      result = result.filter((p) => (p.advanced as any)?.weatherBoost || p.scoutingReport?.hotZones?.length);
    } else if (quickFilter === "confirmed") {
      result = result.filter((p) => p.injuryStatus?.toLowerCase().includes("active") || (p as any).isStarter);
    } else if (quickFilter === "hot") {
      result = result.filter((p) => parseOfficialSeasonStat(p, "hr") >= 15 || p.batterScore >= 80);
    }

    const sorted = [...result];
    sorted.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "batterScore") return b.batterScore - a.batterScore;
      if (sortBy === "hr") return parseOfficialSeasonStat(b, "hr") - parseOfficialSeasonStat(a, "hr");
      if (sortBy === "avg") return parseOfficialSeasonStat(b, "avg") - parseOfficialSeasonStat(a, "avg");
      if (sortBy === "ops") return parseOfficialSeasonStat(b, "ops") - parseOfficialSeasonStat(a, "ops");
      return 0;
    });
    return sorted;
  }, [players, search, teamFilter, sortBy, quickFilter]);

  const openDetail = (player: MLBPlayer, tab: DetailTab = "overview") => {
    setSelectedPlayer(player);
    setDetailTab(tab);
  };

  const closeDetail = () => setSelectedPlayer(null);

  const runAIResearch = async (player: MLBPlayer) => {
    if (aiReports[player.id]) return;
    setResearching(player.id);
    // Simulated AI research (the real API call would go to /api/ai/player-research)
    setTimeout(() => {
      setAiReports((prev) => ({
        ...prev,
        [player.id]: `${player.name} shows ${player.advanced.barrelPercent > 15 ? "elite" : "above-average"} barrel rate (${player.advanced.barrelPercent}%) with ${player.advanced.hardHitPercent}% hard-hit contact. His ${player.splits.vRHP.ops} OPS vs RHP suggests a strong platoon advantage against right-handed pitching. Recent form (${player.splits.last10.ops} OPS over last 10) indicates ${parseFloat(player.splits.last10.ops) > parseOfficialSeasonStat(player, "ops") ? "heating up" : "cooling off"}. Key risk: ${player.scoutingReport.riskFactor} risk factor. Hot zones: ${player.scoutingReport.hotZones.join(", ")}.`,
      }));
      setResearching(null);
    }, 1500);
  };

  return (
    <main className={`${Z8_PAGE} min-h-screen`}>
      {/* ====== Header ====== */}
      <header className={`sticky top-0 z-40 ${Z8_PANEL_PREMIUM} rounded-none border-x-0 border-t-0`}>
        <div className={`mx-auto flex h-14 max-w-7xl items-center justify-between ${Z8_PAGE_PAD_X}`}>
          <div className="flex items-center gap-3">
            <div className={`${Z8_SURFACE} flex h-8 w-8 items-center justify-center rounded-lg border-vouch-cyan/30 bg-vouch-cyan/10`}>
              <Search className="h-4 w-4 text-vouch-cyan" />
            </div>
            <span className="text-sm font-bold text-white">Player Research</span>
            <span className={`${Z8_LABEL} text-white/40`}>
              {backendCount ?? players.length} players · {registryStatus === "ready" ? "backend registry" : registryStatus === "loading" ? "loading registry" : "fallback records"}
            </span>
            {registryError && <span className={`${Z8_LABEL} hidden text-vouch-amber md:inline`}>{registryError}</span>}
            <span className={`${Z8_LABEL} hidden text-vouch-cyan/80 lg:inline`}>
              Truth Lens · Verified stats · Live pricing feed pending
            </span>
          </div>
          {/* Mode tabs */}
          <div className={`${Z8_SURFACE} flex rounded-lg p-0.5`}>
            {([
              { id: "scout" as Mode, label: "Scout", icon: Crosshair },
              { id: "compare" as Mode, label: "Compare", icon: BarChart3 },
              { id: "build" as Mode, label: "Build", icon: Plus },
            ]).map((t) => (
              <button
                key={t.id}
                onClick={() => setMode(t.id)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                  mode === t.id ? Z8_ACTIVE : Z8_IDLE
                }`}
              >
                <t.icon className="w-3 h-3" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className={`mx-auto max-w-7xl ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y} ${Z8_PAGE_GAP} lg:flex-row lg:items-start lg:gap-6 flex flex-col`}>
        {/* Left Sidebar */}
        <div className="lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:w-[280px] w-full shrink-0 flex flex-col gap-4 mb-4 lg:mb-0">
          <div className={`${Z8_PANEL_PREMIUM} flex flex-col gap-3 p-3`}>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                type="text"
                placeholder="Search players, teams, positions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${Z8_SURFACE} w-full rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-vouch-cyan/45 focus:outline-none`}
              />
            </div>
            
            {mode === "scout" && (
              <>
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className={`${Z8_SURFACE} rounded-xl px-3 py-2 text-xs text-white/70 focus:outline-none w-full`}
                >
                  {teams.map((t) => <option key={t} value={t}>{t === "ALL" ? "All Teams" : t}</option>)}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className={`${Z8_SURFACE} rounded-xl px-3 py-2 text-xs text-white/70 focus:outline-none w-full`}
                >
                  <option value="batterScore">Sort: Batter Score</option>
                  <option value="hr">Sort: Home Runs</option>
                  <option value="avg">Sort: AVG</option>
                  <option value="ops">Sort: OPS</option>
                  <option value="name">Sort: Name</option>
                </select>
                <div className={`${Z8_SURFACE} flex rounded-lg p-0.5 w-full`}>
                  <button onClick={() => setListStyle("grid")} className={`flex-1 flex justify-center rounded-md p-1.5 transition-all ${listStyle === "grid" ? "text-vouch-cyan" : "text-white/35"}`}>
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setListStyle("table")} className={`flex-1 flex justify-center rounded-md p-1.5 transition-all ${listStyle === "table" ? "text-vouch-cyan" : "text-white/35"}`}>
                    <Table2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 1-Tap Smart Filter Pills Bar */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">1-Tap Smart Filters</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: "all", label: "All Slate", icon: LayoutGrid },
                      { id: "top5", label: "Top 5 Spots", icon: Zap },
                      { id: "wind", label: "Wind Out", icon: TrendingUp },
                      { id: "confirmed", label: "Confirmed", icon: CheckCircle2 },
                      { id: "hot", label: "Hot Streaks", icon: Sparkles },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setQuickFilter(f.id as any)}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all ${
                          quickFilter === f.id
                            ? "bg-vouch-cyan/20 border border-vouch-cyan text-vouch-cyan shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                            : "bg-white/[0.03] border border-white/5 text-white/50 hover:text-white hover:bg-white/[0.06]"
                        }`}
                      >
                        <f.icon className="w-3 h-3" /> {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {activeLegs && activeLegs.length > 0 && (
            <div className={`${Z8_PANEL_PREMIUM} p-3 flex flex-col gap-2`}>
              <div className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-vouch-cyan" />
                Active Slip ({activeLegs.length})
              </div>
              {activeLegs.map((leg, i) => (
                <div key={leg.id || i} className={`p-2 rounded-lg ${Z8_SURFACE} flex justify-between items-center`}>
                  <div className="flex flex-col truncate pr-2 min-w-0">
                    <span className="text-xs font-bold text-white truncate">{leg.selection}</span>
                    <span className="text-[10px] text-white/45 truncate">{leg.market}</span>
                  </div>
                  <span className="text-xs font-mono text-[var(--ve-accent)] shrink-0">
                    {leg.odds !== null && leg.odds > 0 ? `+${leg.odds}` : leg.odds || "TBD"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* ====== SCOUT MODE ====== */}
          {mode === "scout" && (
            <>
              {/* Player list */}
            {filtered.length === 0 ? (
              <div className={`${Z8_PANEL_PREMIUM} rounded-2xl px-5 py-12 text-center`} role="status">
                <Search className="mx-auto h-6 w-6 text-white/25" />
                <p className="mt-3 text-sm font-bold text-white/70">No players found</p>
                <p className="mt-1 text-xs text-white/40">Try another player, team, or position.</p>
              </div>
            ) : listStyle === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filtered.map((p, i) => {
                  const hrProp = p.propositions?.find((prop) => /home run|\bhr\b/i.test(`${prop.market} ${prop.spec}`));
                  return (
                    <PlayerCard
                      key={p.id}
                      player={p}
                      index={i}
                      onClick={() => openDetail(p)}
                      onAddLeg={hrProp ? () => onAddLegToParlay(p, hrProp) : undefined}
                    />
                  );
                })}
              </div>
            ) : (
              <PlayerTable players={filtered} onRowClick={(p) => openDetail(p)} sortBy={sortBy} />
            )}
          </>
        )}

        {/* ====== COMPARE MODE ====== */}
        {mode === "compare" && (
          <CompareView
            players={players}
            compareA={compareA}
            compareB={compareB}
            onSelectA={setCompareA}
            onSelectB={setCompareB}
            onAddLeg={onAddLegToParlay}
          />
        )}

        {/* ====== BUILD MODE ====== */}
        {mode === "build" && (
          <BuildView players={players} onAddLeg={onAddLegToParlay} activeLegs={activeLegs} />
        )}
        </div>
      </div>

      {/* ====== Detail Modal ====== */}
      <AnimatePresence>
        {selectedPlayer && (
          <PlayerDetailModal
            player={selectedPlayer}
            tab={detailTab}
            onTabChange={setDetailTab}
            onClose={closeDetail}
            onAddLeg={onAddLegToParlay}
            onSaveVouch={onSaveVouch}
            aiReport={aiReports[selectedPlayer.id]}
            researching={researching === selectedPlayer.id}
            onRunAI={() => runAIResearch(selectedPlayer)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/* ============================================================================
   Player Card — glass card with headshot, team color, batter score
   ============================================================================ */
function PlayerCard({ player, index, onClick, onAddLeg }: { player: MLBPlayer; index: number; onClick: () => void; onAddLeg?: () => void }) {
  const scoreColor = player.batterScore >= 90 ? "#34d399" : player.batterScore >= 75 ? "#fbbf24" : "#f87171";
  const tierLabel = player.batterScore >= 90 ? "ELITE" : player.batterScore >= 75 ? "STRONG" : "VALID";
  const injuryColor =
    player.injurySeverity === "NONE" ? "#34d399" :
    player.injurySeverity === "DAY_TO_DAY" ? "#fbbf24" : "#f87171";

  const hrProp = player.propositions?.find((p) => /home run|\bhr\b/i.test(`${p.market} ${p.spec}`));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="relative rounded-2xl p-4 text-left overflow-hidden transition-all group cursor-pointer flex flex-col justify-between"
      style={{
        background: "linear-gradient(160deg, rgba(15,23,42,0.7) 0%, rgba(5,11,18,0.9) 100%)",
        border: `1px solid ${player.batterScore >= 90 ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.08)"}`,
        backdropFilter: "blur(12px)",
      }}
    >
      <div>
        {/* Top Header: Headshot + Matchup Progress Gauge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-obsidian-700 border border-white/10 shrink-0">
            <img src={player.headshot} alt={player.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
          </div>
          {/* Gauge Meter */}
          <div className="flex-1 min-w-0 text-right">
            <div className="flex items-center justify-end gap-1.5 mb-1">
              <span className="text-[9px] font-black font-mono px-1.5 py-0.5 rounded" style={{ background: `${scoreColor}20`, color: scoreColor }}>
                {tierLabel}
              </span>
              <span className="text-sm font-black font-mono text-white">{player.batterScore}</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${player.batterScore}%`, background: `linear-gradient(90deg, ${scoreColor}, #22d3ee)` }} />
            </div>
          </div>
        </div>

        {/* Name + Matchup Subtitle */}
        <div className="text-sm font-black text-white truncate group-hover:text-vouch-cyan transition-colors">{player.name}</div>
        <div className="text-[10px] text-white/50 truncate font-mono">
          {player.team} · #{player.number} <span className="text-vouch-cyan">vs RHP Matchup</span>
        </div>

        {/* Context Badges (Lineup + Weather) */}
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/30 text-cyan-200">
            #2 BATTER
          </span>
          <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 flex items-center gap-0.5">
            +4% WIND OUT
          </span>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-1.5 mt-3">
          {[
            { label: "AVG", value: getOfficialSeasonStat(player, "avg") },
            { label: "HR", value: getOfficialSeasonStat(player, "hr") },
            { label: "OPS", value: getOfficialSeasonStat(player, "ops") },
          ].map((s) => (
            <div key={s.label} className="flex-1 text-center py-1 rounded-lg border border-white/5 bg-white/[0.02]">
              <div className="text-[7px] text-white/35 font-mono uppercase">{s.label}</div>
              <div className="text-xs font-bold font-mono text-white/80">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer: Injury status & Quick-Add Slip Button */}
      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: injuryColor }} />
          <span className="text-[9px] text-white/40 truncate max-w-[80px]">{player.injuryStatus}</span>
        </div>
        {onAddLeg && hrProp ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddLeg();
            }}
            className="flex items-center gap-1 rounded-lg bg-vouch-emerald px-2.5 py-1 text-[10px] font-black text-black transition hover:bg-vouch-emerald/90 hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(0,255,148,0.2)]"
          >
            <Plus className="w-3 h-3" /> Add to Slip
          </button>
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-vouch-cyan group-hover:translate-x-1 transition-all" />
        )}
      </div>
    </motion.div>
  );
}

/* ============================================================================
   Player Table — sortable table view
   ============================================================================ */
function PlayerTable({ players, onRowClick, sortBy }: { players: MLBPlayer[]; onRowClick: (p: MLBPlayer) => void; sortBy: string }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
            {["Player", "Team", "AVG", "HR", "RBI", "OPS", "Barrel%", "HardHit%", "Score", ""].map((h) => (
              <th key={h} className="text-[9px] font-bold text-white/40 uppercase tracking-wider px-3 py-2.5 text-left font-mono">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => {
            const scoreColor = p.batterScore >= 90 ? "#34d399" : p.batterScore >= 75 ? "#fbbf24" : "#f87171";
            return (
              <tr
                key={p.id}
                onClick={() => onRowClick(p)}
                className="border-b border-white/3 cursor-pointer hover:bg-white/[0.03] transition-colors"
              >
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <img src={p.headshot} alt={p.name} className="w-7 h-7 rounded-lg object-cover" loading="lazy" decoding="async" />
                    <span className="font-bold text-white text-xs">{p.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-xs text-white/45">{p.team.split(" ").pop()}</td>
                <td className="px-3 py-2.5 text-xs font-mono text-white/65">{getOfficialSeasonStat(p, "avg")}</td>
                <td className="px-3 py-2.5 text-xs font-mono text-white/65">{getOfficialSeasonStat(p, "hr")}</td>
                <td className="px-3 py-2.5 text-xs font-mono text-white/65">{getOfficialSeasonStat(p, "rbi")}</td>
                <td className="px-3 py-2.5 text-xs font-mono text-[var(--ve-accent)]">{getOfficialSeasonStat(p, "ops")}</td>
                <td className="px-3 py-2.5 text-xs font-mono text-white/45">{p.advanced.barrelPercent?.toFixed(1)}%</td>
                <td className="px-3 py-2.5 text-xs font-mono text-white/45">{p.advanced.hardHitPercent?.toFixed(1)}%</td>
                <td className="px-3 py-2.5">
                  <span className="text-xs font-bold font-mono" style={{ color: scoreColor }}>{p.batterScore}</span>
                </td>
                <td className="px-3 py-2.5"><ChevronRight className="w-3.5 h-3.5 text-white/35" /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================================
   Compare View — side-by-side
   ============================================================================ */


function getTruthMarketGroup(market: string): string {
  const normalized = market.toLowerCase();

  if (normalized.includes("hit")) return "Hits";

  if (
    normalized.includes("single") ||
    normalized.includes("double") ||
    normalized.includes("triple") ||
    normalized.includes("home run")
  ) {
    return "Base Types";
  }

  if (normalized.includes("rbi")) return "Run Production";
  if (normalized.includes("stolen")) return "Speed";
  if (normalized.includes("total base")) return "Total Bases";

  return "Other";
}

function groupTruthMarkets<T extends { prop: { market: string } }>(items: T[]) {
  const order = ["Hits", "Base Types", "Run Production", "Speed", "Total Bases", "Other"];
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const group = getTruthMarketGroup(item.prop.market);
    const groupItems = groups.get(group);
    if (groupItems) {
      groupItems.push(item);
    } else {
      groups.set(group, [item]);
    }
  }

  return order
    .map((group) => ({ group, items: groups.get(group) ?? [] }))
    .filter((entry) => entry.items.length > 0);
}

function ProTruthLensIntro() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 overflow-hidden rounded-[2rem] border border-cyan-400/15 bg-black/30 shadow-2xl shadow-cyan-950/20"
    >
      <div className="relative p-5 sm:p-6">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
              Player Truth Lens Pro
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-white">
              Research the player before you build the slip.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/45">
              Built for sourced player truth: official IDs, game context, Statcast availability,
              market readiness, and V.A.I fit. If VouchEdge cannot source a stat, it should say
              unavailable — never fake confidence or odds.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25/70 p-3 text-xs text-white/65 lg:min-w-[260px]">
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              Truth standard
            </div>
            <div className="mt-1 font-bold text-white">Verified Analytics · Live Pricing Pending</div>
            <div className="mt-2 text-white/45">Unknown pricing defaults to Odds TBD. No simulated odds.</div>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {PLAYER_RESEARCH_PRO_TABS.map((tab) => (
            <span
              key={tab}
              className="shrink-0 rounded-full border border-white/10 bg-black/25/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white/65"
            >
              {tab}
            </span>
          ))}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/25/50 p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">
              Truth rules
            </div>
            <div className="mt-3 grid gap-2">
              {PLAYER_RESEARCH_TRUTH_RULES.map((rule) => (
                <div key={rule} className="flex gap-2 text-xs text-white/65">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25/50 p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-300">
              Pro research layer
            </div>
            <div className="mt-3 grid gap-2">
              {PLAYER_RESEARCH_PRO_IDEAS.map((feature) => (
                <div key={feature} className="flex gap-2 text-xs text-white/65">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CompareView({ players, compareA, compareB, onSelectA, onSelectB, onAddLeg }: {
  players: MLBPlayer[];
  compareA: MLBPlayer | null;
  compareB: MLBPlayer | null;
  onSelectA: (p: MLBPlayer) => void;
  onSelectB: (p: MLBPlayer) => void;
  onAddLeg: (player: MLBPlayer, prop: { id: string; market: string; odds: number | null; spec: string; truthLabel?: string }) => void;
}) {
  return (
    <div>
      <ProTruthLensIntro />
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Player A */}
        <CompareSlot label="Player A" player={compareA} players={players} onSelect={onSelectA} accent="#22d3ee" />
        {/* Player B */}
        <CompareSlot label="Player B" player={compareB} players={players} onSelect={onSelectB} accent="#f472b6" />
      </div>

      {/* Comparison table */}
      {compareA && compareB && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl overflow-hidden" style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="grid grid-cols-3 border-b border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="p-3 text-[10px] font-bold uppercase tracking-wider text-white/40 font-mono">Stat</div>
            <div className="p-3 text-center text-xs font-bold text-[var(--ve-accent)]">{compareA.name}</div>
            <div className="p-3 text-center text-xs font-bold text-pink-300">{compareB.name}</div>
          </div>
          {[
            { label: "Batter Score", a: compareA.batterScore, b: compareB.batterScore, higher: true },
            { label: "AVG", a: parseOfficialSeasonStat(compareA, "avg"), b: parseOfficialSeasonStat(compareB, "avg"), higher: true },
            { label: "Home Runs", a: parseOfficialSeasonStat(compareA, "hr"), b: parseOfficialSeasonStat(compareB, "hr"), higher: true },
            { label: "RBI", a: parseOfficialSeasonStat(compareA, "rbi"), b: parseOfficialSeasonStat(compareB, "rbi"), higher: true },
            { label: "OPS", a: parseOfficialSeasonStat(compareA, "ops"), b: parseOfficialSeasonStat(compareB, "ops"), higher: true },
            { label: "Barrel %", a: compareA.advanced.barrelPercent, b: compareB.advanced.barrelPercent, higher: true },
            { label: "Hard Hit %", a: compareA.advanced.hardHitPercent, b: compareB.advanced.hardHitPercent, higher: true },
            { label: "Exit Velocity", a: compareA.advanced.exitVelocity, b: compareB.advanced.exitVelocity, higher: true },
            { label: "OPS vs RHP", a: parseFloat(compareA.splits.vRHP.ops), b: parseFloat(compareB.splits.vRHP.ops), higher: true },
            { label: "OPS vs LHP", a: parseFloat(compareA.splits.vLHP.ops), b: parseFloat(compareB.splits.vLHP.ops), higher: true },
            { label: "OPS Last 10", a: parseFloat(compareA.splits.last10.ops), b: parseFloat(compareB.splits.last10.ops), higher: true },
            { label: "Chase %", a: compareA.advanced.chasePercent, b: compareB.advanced.chasePercent, higher: false },
          ].map((row) => {
            const aWins = row.higher ? row.a > row.b : row.a < row.b;
            const bWins = row.higher ? row.b > row.a : row.b < row.a;
            return (
              <div key={row.label} className="grid grid-cols-3 border-b border-white/3">
                <div className="p-2.5 text-[11px] text-white/40 font-mono">{row.label}</div>
                <div className={`p-2.5 text-center text-sm font-bold font-mono ${aWins ? "text-[var(--ve-accent)]" : "text-white/40"}`}>{typeof row.a === "number" ? row.a.toFixed(row.a % 1 !== 0 ? 3 : 0) : row.a}</div>
                <div className={`p-2.5 text-center text-sm font-bold font-mono ${bWins ? "text-pink-300" : "text-white/40"}`}>{typeof row.b === "number" ? row.b.toFixed(row.b % 1 !== 0 ? 3 : 0) : row.b}</div>
              </div>
            );
          })}

          {/* Truth markets */}
          <div className="p-4 border-t border-white/5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Truth Markets</div>
            <div className="grid md:grid-cols-2 gap-3">
              {[compareA, compareB].map((p) => p && (
                <div key={p.id} className="space-y-2">
                  <div className="text-xs font-bold text-white">{p.name}</div>
                  {p.propositions.map((prop) => (
                    <div key={prop.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <span className="text-[11px] text-white/45">{prop.market}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[var(--ve-accent)]">{prop.odds == null ? 'Odds TBD' : prop.odds.toFixed(2)}</span>
                        <button onClick={() => onAddLeg(p, prop)} className="text-[9px] font-bold uppercase px-2 py-1 rounded text-slate-950" style={{ background: "linear-gradient(135deg, #22d3ee, #2563eb)" }}>
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function CompareSlot({ label, player, players, onSelect, accent }: {
  label: string;
  player: MLBPlayer | null;
  players: MLBPlayer[];
  onSelect: (p: MLBPlayer | null) => void;
  accent: string;
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(15,23,42,0.4)", border: `1px solid ${accent}20` }}>
      <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: accent }}>{label}</div>
      {player ? (
        <div className="flex items-center gap-3">
          <img src={player.headshot} alt={player.name} className="w-12 h-12 rounded-xl object-cover" loading="lazy" decoding="async" />
          <div className="flex-1">
            <div className="text-sm font-bold text-white">{player.name}</div>
            <div className="text-[10px] text-white/40">{player.team} · {player.position}</div>
          </div>
          <button type="button" onClick={() => onSelect(null)} aria-label={`Clear ${label}`} className="text-white/35 hover:text-white/45">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <select
          onChange={(e) => { const p = players.find((p) => p.id === e.target.value); if (p) onSelect(p); }}
          className="w-full rounded-lg px-3 py-2 text-xs text-white/65 focus:outline-none"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <option value="">Select a player...</option>
          {players.map((p) => <option key={p.id} value={p.id} style={{ background: "#0b1120" }}>{p.name} ({p.team})</option>)}
        </select>
      )}
    </div>
  );
}

/* ============================================================================
   Build View — prop board
   ============================================================================ */
function BuildView({ players, onAddLeg, activeLegs }: {
  players: MLBPlayer[];
  onAddLeg: (player: MLBPlayer, prop: { id: string; market: string; odds: number | null; spec: string; truthLabel?: string }) => void;
  activeLegs: Leg[];
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const prepare = () => setReady(true);
    if (typeof requestIdleCallback === "function") {
      const idleId = requestIdleCallback(prepare, { timeout: 250 });
      return () => cancelIdleCallback(idleId);
    }
    const timer = window.setTimeout(prepare, 50);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) {
    return (
      <div className={`${Z8_PANEL_PREMIUM} flex min-h-[280px] items-center justify-center rounded-2xl p-6`} role="status" aria-live="polite">
        <div className="text-center">
          <RefreshCw className="mx-auto h-7 w-7 animate-spin text-vouch-cyan" />
          <p className={`${Z8_LABEL} mt-4 text-vouch-cyan`}>Preparing market board</p>
          <p className="mt-2 text-xs text-white/40">Loading the first player markets without blocking navigation.</p>
        </div>
      </div>
    );
  }

  return <BuildMarketBoard players={players} onAddLeg={onAddLeg} activeLegs={activeLegs} />;
}

const INITIAL_MARKETS_PER_GROUP = 12;
const MARKET_PAGE_SIZE = 12;

function BuildMarketBoard({ players, onAddLeg, activeLegs }: {
  players: MLBPlayer[];
  onAddLeg: (player: MLBPlayer, prop: { id: string; market: string; odds: number | null; spec: string; truthLabel?: string }) => void;
  activeLegs: Leg[];
}) {
  const [propFilter, setPropFilter] = useState("ALL");
  const [marketSearch, setMarketSearch] = useState("");
  const [visiblePerGroup, setVisiblePerGroup] = useState(INITIAL_MARKETS_PER_GROUP);
  const allMarkets = useMemo(() => {
    const markets: Array<{ player: MLBPlayer; prop: any }> = [];
    for (const p of players) {
      for (const prop of p.propositions) {
        markets.push({ player: p, prop });
      }
    }
    return markets;
  }, [players]);

  const filtered = useMemo(() => {
    const query = marketSearch.trim().toLowerCase();
    return allMarkets.filter(({ player, prop }) => {
      if (propFilter !== "ALL" && getTruthMarketGroup(prop.market) !== propFilter) return false;
      if (!query) return true;
      return (
        player.name.toLowerCase().includes(query) ||
        player.team.toLowerCase().includes(query) ||
        prop.market.toLowerCase().includes(query)
      );
    });
  }, [allMarkets, marketSearch, propFilter]);

  const groupedMarkets = useMemo(() => groupTruthMarkets(filtered), [filtered]);
  const activeLegIds = useMemo(() => new Set(activeLegs.map((leg) => leg.selection)), [activeLegs]);
  const visibleMarketCount = groupedMarkets.reduce(
    (total, entry) => total + Math.min(entry.items.length, visiblePerGroup),
    0,
  );
  const hasMore = groupedMarkets.some((entry) => entry.items.length > visiblePerGroup);

  useEffect(() => {
    setVisiblePerGroup(INITIAL_MARKETS_PER_GROUP);
  }, [marketSearch, propFilter]);

  return (
    <div>
      <ProTruthLensIntro />
      <div className={`${Z8_PANEL_PREMIUM} mb-5 space-y-3 rounded-2xl p-3`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm text-white/45">
            Showing {visibleMarketCount} of {filtered.length} markets
          </div>
          <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
            <input
              type="search"
              value={marketSearch}
              onChange={(event) => setMarketSearch(event.target.value)}
              placeholder="Find player, team, or market"
              aria-label="Search build markets"
              className={`${Z8_SURFACE} w-full rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/30 focus:border-vouch-cyan/45 focus:outline-none`}
            />
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {["ALL", "Hits", "Base Types", "Run Production", "Speed", "Total Bases"].map((f) => (
            <button
              key={f}
              onClick={() => setPropFilter(f)}
              className={`shrink-0 text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-md transition-all ${propFilter === f ? "text-slate-950" : "text-white/40"}`}
              style={propFilter === f ? { background: "linear-gradient(135deg, #22d3ee, #2563eb)" } : { background: "rgba(255,255,255,0.03)" }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        {groupedMarkets.length === 0 && (
          <div className={`${Z8_PANEL_PREMIUM} rounded-2xl px-5 py-12 text-center`} role="status">
            <Search className="mx-auto h-6 w-6 text-white/25" />
            <p className="mt-3 text-sm font-bold text-white/70">No markets found</p>
            <p className="mt-1 text-xs text-white/40">Try another player, team, market, or category.</p>
          </div>
        )}
        {groupedMarkets.map(({ group, items }) => {
          const visibleItems = items.slice(0, visiblePerGroup);
          return (
          <section
            key={group}
            className="rounded-2xl border border-white/10 bg-obsidian-900/40 p-3 sm:p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
                  {group}
                </div>
                <div className="text-[11px] text-white/40">
                  {items.length} truth markets · odds stay TBD until a real feed is connected
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleItems.map(({ player, prop }) => {
                const isActive = activeLegIds.has(prop.spec);
                return (
                  <div
                    key={prop.id}
                    className="rounded-xl p-3 flex items-center gap-3"
                    style={{ background: "rgba(15,23,42,0.4)", border: `1px solid ${isActive ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.06)"}` }}
                  >
                    <img src={player.headshot} alt={player.name} className="w-10 h-10 rounded-lg object-cover shrink-0" loading="lazy" decoding="async" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white truncate">{player.name}</div>
                      <div className="text-[10px] text-white/45 truncate">{prop.market}</div>
                      {prop.truthLabel && (
                        <div className="mt-0.5 truncate text-[9px] uppercase tracking-wider text-cyan-300/75">
                          {prop.truthLabel}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-[var(--ve-accent)]">{prop.odds == null ? 'Odds TBD' : prop.odds.toFixed(2)}</div>
                      <button
                        onClick={() => onAddLeg(player, prop)}
                        disabled={isActive}
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded transition-all mt-1 ${isActive ? "bg-emerald-500/15 text-emerald-400" : "text-slate-950"}`}
                        style={!isActive ? { background: "linear-gradient(135deg, #22d3ee, #2563eb)" } : {}}
                      >
                        {isActive ? "Added" : "+ Slip"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          );
        })}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setVisiblePerGroup((count) => count + MARKET_PAGE_SIZE)}
          className="mx-auto mt-5 flex min-h-11 items-center justify-center rounded-xl border border-vouch-cyan/30 bg-vouch-cyan/10 px-5 py-2 text-xs font-black uppercase tracking-wider text-vouch-cyan hover:bg-vouch-cyan/15"
        >
          Load more markets
        </button>
      )}
    </div>
  );
}

/* ============================================================================
   Player Detail Modal — 5 tabs
   ============================================================================ */
function PlayerDetailModal({ player, tab, onTabChange, onClose, onAddLeg, onSaveVouch, aiReport, researching, onRunAI }: {
  player: MLBPlayer;
  tab: DetailTab;
  onTabChange: (t: DetailTab) => void;
  onClose: () => void;
  onAddLeg: (player: MLBPlayer, prop: { id: string; market: string; odds: number | null; spec: string; truthLabel?: string }) => void;
  onSaveVouch: (vouch: Vouch) => void;
  aiReport?: string;
  researching: boolean;
  onRunAI: () => void;
}) {
  const openParlayPicker = (initialFamily: "home_runs" | "hits" | "rbi" | "stolen_base" | "pitcher" = "home_runs") => {
    const hrProp = player.propositions.find((prop) => /home run|\bhr\b/i.test(`${prop.market} ${prop.spec}`));
    const isPitcher = resolveParlayPlayerRole({ position: player.position }) === "pitcher";
    openParlayAdd({
      player,
      propHint: hrProp
        ? {
            id: hrProp.id,
            market: hrProp.market,
            odds: hrProp.odds,
            spec: hrProp.spec,
            playerId: player.id,
          }
        : undefined,
      initialFamily,
      isPitcher,
      source: isPitcher ? "pitcher_research" : "player_research",
      dataStatus: "unknown",
    });
  };

  const tabs: { id: DetailTab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "splits", label: "Splits", icon: BarChart3 },
    { id: "gamelog", label: "Game Log", icon: TrendingUp },
    { id: "ai", label: "AI Report", icon: Sparkles },
    { id: "markets", label: "Markets", icon: Crosshair },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-3xl flex flex-col"
        style={{ background: "rgba(8,12,20,0.95)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center gap-4">
          <img src={player.headshot} alt={player.name} className="w-16 h-16 rounded-2xl object-cover" loading="lazy" decoding="async" />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{player.name}</h2>
            <div className="text-xs text-white/40">{player.team} · #{player.number} · {player.position} · B/T: {player.bats}/{player.throws}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: player.batterScore >= 90 ? "rgba(52,211,153,0.12)" : "rgba(251,191,36,0.12)", color: player.batterScore >= 90 ? "#34d399" : "#fbbf24" }}>
                Score: {player.batterScore}
              </span>
              <span className="text-[10px] text-white/40">{player.injuryStatus}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openParlayPicker("home_runs")}
            className="flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-cyan-200 hover:bg-cyan-500/20"
          >
            <Plus className="w-3.5 h-3.5" /> ParlayOS
          </button>
          <button onClick={onClose} className="text-white/35 hover:text-white p-2"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 px-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border-b-2 ${tab === t.id ? "text-[var(--ve-accent)] border-[var(--ve-accent)]" : "text-white/40 border-transparent hover:text-white/65"}`}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "overview" && <OverviewTab player={player} onOpenParlay={() => openParlayPicker("home_runs")} />}
          {tab === "splits" && <SplitsTab player={player} />}
          {tab === "gamelog" && <GameLogTab player={player} />}
          {tab === "ai" && <AITab player={player} report={aiReport} researching={researching} onRun={onRunAI} />}
          {tab === "markets" && <MarketsTab player={player} onAddLeg={onAddLeg} />}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ============ Overview Tab ============ */
function OverviewTab({ player, onOpenParlay }: { player: MLBPlayer; onOpenParlay?: () => void }) {
  const stats = [
    { label: "AVG", value: getOfficialSeasonStat(player, "avg"), color: "#e2e8f0" },
    { label: "HR", value: getOfficialSeasonStat(player, "hr"), color: "#fbbf24" },
    { label: "RBI", value: getOfficialSeasonStat(player, "rbi"), color: "#22d3ee" },
    { label: "OPS", value: getOfficialSeasonStat(player, "ops"), color: "#34d399" },
  ];
  const adv = [
    { label: "Barrel %", value: player.advanced.barrelPercent?.toFixed(1), max: 25 },
    { label: "Hard Hit %", value: player.advanced.hardHitPercent?.toFixed(1), max: 60 },
    { label: "Exit Velo", value: player.advanced.exitVelocity?.toFixed(1), max: 100 },
    { label: "Launch Angle", value: player.advanced.launchAngle?.toFixed(1), max: 30 },
    { label: "Chase %", value: player.advanced.chasePercent?.toFixed(1), max: 40 },
    { label: "xwOBA", value: player.advanced.xwoba?.toFixed(3), max: 0.5 },
  ];

  return (
    <div className="space-y-5">
      {onOpenParlay ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/[0.06] p-3">
          <p className="text-[11px] text-white/55 flex-1 min-w-[12rem]">
            Build out your slips directly from research. Open ParlayOS to lock in props for Home Runs, Hits, RBIs, and more.
          </p>
          <button
            type="button"
            onClick={onOpenParlay}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-cyan-100 hover:bg-cyan-500/25"
          >
            <Plus className="w-3.5 h-3.5" /> Home Runs & props
          </button>
        </div>
      ) : null}
      {/* Season stats */}
      <div className="grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="text-[9px] text-white/35 font-mono uppercase tracking-widest">{s.label}</div>
            <div className="text-2xl font-bold font-mono mt-1" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Advanced metrics with bars */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Advanced Metrics</div>
        <div className="space-y-2">
          {adv.map((m) => (
            <div key={m.label} className="flex items-center gap-3">
              <div className="w-24 text-[11px] text-white/45 font-mono">{m.label}</div>
              <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (parseFloat(String(m.value)) / m.max) * 100)}%`, background: "linear-gradient(90deg, #22d3ee, #2563eb)" }} />
              </div>
              <div className="w-16 text-right text-xs font-mono font-bold text-[var(--ve-accent)]">{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scouting report */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Scouting Report</div>
        <div className="space-y-2 text-xs text-white/45 leading-relaxed">
          <div><span className="text-emerald-400 font-bold">Power:</span> {player.scoutingReport.powerText}</div>
          <div><span className="text-[var(--ve-accent)] font-bold">Contact:</span> {player.scoutingReport.contactText}</div>
          <div><span className="text-vouch-emerald font-bold">Discipline:</span> {player.scoutingReport.disciplineText}</div>
          <div className="pt-2 border-t border-white/5"><span className="text-amber-400 font-bold">Overall:</span> {player.scoutingReport.overallScouting}</div>
        </div>
      </div>

      {/* Hot zones + risk */}
      <div className="flex items-center gap-4">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-white/35 mb-1">Hot Zones</div>
          <div className="flex flex-wrap gap-1">
            {player.scoutingReport.hotZones.map((z) => (
              <span key={z} className="text-[10px] px-2 py-0.5 rounded-md text-emerald-300 font-medium" style={{ background: "rgba(52,211,153,0.08)" }}>{z}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-white/35 mb-1">Risk</div>
          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold" style={{ background: player.scoutingReport.riskFactor === "LOW" ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)", color: player.scoutingReport.riskFactor === "LOW" ? "#34d399" : "#fbbf24" }}>{player.scoutingReport.riskFactor}</span>
        </div>
      </div>
    </div>
  );
}

/* ============ Splits Tab ============ */
function SplitsTab({ player }: { player: MLBPlayer }) {
  const splitData = [
    { label: "vs LHP", data: player.splits.vLHP },
    { label: "vs RHP", data: player.splits.vRHP },
    { label: "Home", data: player.splits.home },
    { label: "Away", data: player.splits.away },
    { label: "Last 10", data: player.splits.last10 },
  ];
  return (
    <div>
      <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {["Split", "AVG", "OBP", "SLG", "OPS"].map((h) => (
                <th key={h} className="text-[9px] font-bold text-white/35 uppercase tracking-wider px-3 py-2 text-left font-mono">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {splitData.map((s) => (
              <tr key={s.label} className="border-b border-white/3">
                <td className="px-3 py-2 text-xs font-bold text-white/65">{s.label}</td>
                <td className="px-3 py-2 text-xs font-mono text-white/45">{s.data.avg}</td>
                <td className="px-3 py-2 text-xs font-mono text-white/45">{s.data.obp}</td>
                <td className="px-3 py-2 text-xs font-mono text-white/45">{s.data.slg}</td>
                <td className="px-3 py-2 text-xs font-mono font-bold text-[var(--ve-accent)]">{s.data.ops}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============ Game Log Tab ============ */
function GameLogTab({ player }: { player: MLBPlayer }) {
  return (
    <div className="space-y-2">
      {player.gameLogs.map((g, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="text-[10px] text-white/35 font-mono w-16">{g.date}</div>
          <div className="text-xs text-white/65 flex-1">vs {g.opponent}</div>
          <div className="text-[10px] text-white/40 font-mono">{g.result}</div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-white/45">{g.ab}AB</span>
            <span className="text-white/65">{g.h}H</span>
            {g.hr > 0 && <span className="text-amber-400 font-bold">{g.hr}HR</span>}
            {g.rbi > 0 && <span className="text-[var(--ve-accent)]">{g.rbi}RBI</span>}
          </div>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: g.batterScore >= 90 ? "rgba(52,211,153,0.1)" : g.batterScore >= 70 ? "rgba(251,191,36,0.1)" : "rgba(248,113,113,0.1)", color: g.batterScore >= 90 ? "#34d399" : g.batterScore >= 70 ? "#fbbf24" : "#f87171" }}>
            {g.batterScore}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============ AI Report Tab ============ */
function AITab({ player, report, researching, onRun }: { player: MLBPlayer; report?: string; researching: boolean; onRun: () => void }) {
  if (report) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--ve-accent)]" />
          <span className="text-xs font-bold text-[var(--ve-accent)] uppercase tracking-wider">AI Research Report</span>
        </div>
        <div className="p-4 rounded-xl text-sm text-white/65 leading-relaxed" style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.15)" }}>
          {report}
        </div>
        <p className="text-[10px] text-white/35">AI-powered predictive analysis for entertainment purposes only. Not financial or betting advice.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Sparkles className="w-10 h-10 text-[var(--ve-accent)]/40 mb-4" />
      <p className="text-sm text-white/45 mb-4">Run AI research on {player.name}</p>
      <button
        onClick={onRun}
        disabled={researching}
        className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-950 disabled:opacity-50 inline-flex items-center gap-2"
        style={{ background: "linear-gradient(135deg, #22d3ee, #2563eb)" }}
      >
        {researching ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Researching...</> : <><Sparkles className="w-3.5 h-3.5" /> Generate Report</>}
      </button>
    </div>
  );
}

/* ============ Markets Tab ============ */
function MarketsTab({ player, onAddLeg }: { player: MLBPlayer; onAddLeg: (player: MLBPlayer, prop: { id: string; market: string; odds: number | null; spec: string; truthLabel?: string }) => void }) {
  return (
    <div className="space-y-2">
      {player.propositions.map((prop) => (
        <div key={prop.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div>
            <div className="text-sm font-bold text-white">{prop.market}</div>
            <div className="text-[10px] text-white/40">{prop.spec} · {prop.truthLabel}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-mono font-bold text-[var(--ve-accent)]">{prop.odds == null ? 'Odds TBD' : prop.odds.toFixed(2)}</span>
            <button
              onClick={() => onAddLeg(player, prop)}
              className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg text-slate-950"
              style={{ background: "linear-gradient(135deg, #22d3ee, #2563eb)" }}
            >
              + Add to Slip
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
