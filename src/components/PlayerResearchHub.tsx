"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search, LayoutGrid, Table2, Plus, X,
  ChevronRight, BarChart3, Crosshair,
  CheckCircle2, RefreshCw, Swords,
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
import {
  AuroraMaxControl,
  AuroraMaxEyebrow,
  AuroraMaxFallback,
  AuroraMaxPanel,
  AuroraMaxProductMark,
  AuroraMaxTruthBadge,
} from "./aurora-max/AuroraMaxPrimitives";
import type { StatcastQuality } from "../pages/pro/usePlayerEdgeResearch";
import { assembleAiPlayerData, formatPct, formatRate, formatVelo, listStatcast } from "./player-research/applyEdgeResearch";
import { AuroraMaxPlayerDossier, type DetailTab } from "./player-research/AuroraMaxPlayerDossier";
import { BvpIntelligenceDesk } from "./player-research/bvp/BvpIntelligenceDesk";
import { BVP_TRUTH_LABEL } from "./player-research/bvp/types";
import "../styles/player-research-aurora-max.css";
import {
  AURORA_DISPLAY,
  AURORA_LABEL,
  AURORA_PAGE,
  AURORA_PAGE_GAP,
  AURORA_PAGE_PAD_X,
  AURORA_PAGE_PAD_Y,
  AURORA_PANEL_PREMIUM,
  AURORA_SURFACE,
} from "../theme/auroraTokens";

interface Markets {
  onAddLegToParlay: (player: MLBPlayer, prop: { id: string; market: string; odds: number | null; spec: string; truthLabel?: string }) => void;
  onSaveVouch: (vouch: Vouch) => void;
  savedVouchIds: string[];
  activeLegs: Leg[];
  liveGames?: any[];
}


type Mode = "scout" | "compare" | "build" | "bvp";
type ListStyle = "grid" | "table";
type RosterScope = "playing" | "all";

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

/** Seed data may fill biography fields only when it matches the official MLB id. */
function seedByMlbId(mlbId: string | number | null | undefined): MLBPlayer | undefined {
  const id = String(mlbId ?? "").trim();
  if (!id) return undefined;
  return MLB_PLAYER_RECORDS.find(
    (seed) =>
      seed.id === id
      || seed.id === `mlbapi_${id}`
      || seed.headshot?.includes(`/people/${id}/`),
  );
}

function normalizeHand(value: string | undefined, fallback: "L" | "R" | "S" = "R"): "L" | "R" | "S" {
  return value === "L" || value === "R" || value === "S" ? value : fallback;
}

function normalizeThrow(value: string | undefined): "L" | "R" {
  return value === "L" || value === "R" ? value : "R";
}

function isActiveRosterType(rosterType?: string): boolean {
  return rosterType === "active";
}

function collectActiveRosterIds(rows: BackendRegistryPlayer[]): Set<string> {
  const ids = new Set<string>();
  for (const row of rows) {
    if (!isActiveRosterType(row.rosterType)) continue;
    const id = String(row.playerId || row.id);
    if (id) ids.add(id);
  }
  return ids;
}

function parseCompareNumber(value: string): number | null {
  if (!value || value === "—" || value === "UNKNOWN") return null;
  const numeric = Number.parseFloat(value.replace("%", "").replace(" mph", "").replace(/^\./, "0."));
  return Number.isFinite(numeric) ? numeric : null;
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
  const mlbId = player.playerId || player.id;
  const seed = seedByMlbId(mlbId);
  const shell = fallbackPlayerShell(player);
  return {
    ...shell,
    id: String(mlbId),
    name: name || shell.name,
    team: (player.team && player.team.trim()) || "MLB",
    position: player.position || shell.position,
    headshot: player.headshot || shell.headshot,
    bats: normalizeHand(player.bats, seed?.bats || "R"),
    throws: normalizeThrow(player.throws || seed?.throws),
    number: seed?.number && seed.number !== "—" ? seed.number : shell.number,
    height: seed?.height && seed.height !== "—" ? seed.height : shell.height,
    weight: seed?.weight && seed.weight !== "—" ? seed.weight : shell.weight,
    birthdate: seed?.birthdate && seed.birthdate !== "—" ? seed.birthdate : shell.birthdate,
    seasonStats: { avg: "—", hr: "—", rbi: "—", ops: "—" },
    gameLogs: [],
  };
}

async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  return apiClient.get<T>(path, undefined, signal);
}

const isSeedPlayerRecord = (player: MLBPlayer) => {
  return MLB_PLAYER_RECORDS.some((seed) => seed.id === player.id);
};

function sourcedLast10Avg(player: MLBPlayer): string {
  if (isSeedPlayerRecord(player)) return "—";
  const avg = player.splits.last10?.avg;
  return avg && avg !== "—" ? avg : "—";
}

const getOfficialSeasonStat = (player: MLBPlayer, key: keyof MLBPlayer["seasonStats"]) => {
  if (isSeedPlayerRecord(player)) return "—";
  return player.seasonStats[key] || "—";
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
  const [rosterScope, setRosterScope] = useState<RosterScope>("playing");
  const [activeRosterIds, setActiveRosterIds] = useState<Set<string>>(() => new Set());
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [positionFilter, setPositionFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"name" | "hr" | "avg" | "ops" | "barrel">("name");
  const [statcastByPlayer, setStatcastByPlayer] = useState<Record<string, StatcastQuality> | null>(null);
  const [visibleLimit, setVisibleLimit] = useState(48);
  const [selectedPlayer, setSelectedPlayer] = useState<MLBPlayer | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [registryPlayers, setRegistryPlayers] = useState<MLBPlayer[]>(MLB_PLAYER_RECORDS);
  const [allRegistryPlayers, setAllRegistryPlayers] = useState<MLBPlayer[]>([]);
  const [backendCount, setBackendCount] = useState<number | null>(null);
  const [registryStatus, setRegistryStatus] = useState<"loading" | "ready" | "fallback" | "error">("loading");
  const [registryError, setRegistryError] = useState("");
  const [registryMeta, setRegistryMeta] = useState<{
    stale?: boolean;
    warming?: boolean;
    source?: "live_cache" | "snapshot";
    updatedAt?: string;
  }>({});

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

        // Primary fetch: /api/mlb/players/registry
        const registryPayload = await fetchJson<{
          players?: BackendRegistryPlayer[];
          count?: number;
          stale?: boolean;
          warming?: boolean;
          source?: "live_cache" | "snapshot";
          updatedAt?: string;
        }>("/api/mlb/players/registry", controller.signal);

        const mapped = (registryPayload.players || []).map(mapBackendPlayer);
        if (mapped.length > 0) {
          setActiveRosterIds(collectActiveRosterIds(registryPayload.players || []));
          setAllRegistryPlayers(mapped);
          setRegistryPlayers(mapped);
          setBackendCount(registryPayload.count ?? mapped.length);
          setRegistryMeta({
            stale: registryPayload.stale,
            warming: registryPayload.warming,
            source: registryPayload.source,
            updatedAt: registryPayload.updatedAt,
          });
          setRegistryStatus("ready");
          setRegistryError("");
        } else {
          throw new Error("Backend registry returned zero players.");
        }

        // Secondary/opportunistic fetch: /api/mlb/players/count
        fetchJson<{ count: number }>("/api/mlb/players/count", controller.signal)
          .then((countPayload) => {
            if (typeof countPayload?.count === "number" && countPayload.count > 0) {
              setBackendCount(countPayload.count);
            }
          })
          .catch(() => {
            // Keep count from registry payload
          });
      } catch (error) {
        if (controller.signal.aborted) return;
        setAllRegistryPlayers((prev) => {
          if (prev.length > 0) {
            setRegistryPlayers(prev);
            setRegistryStatus("ready");
            setRegistryError("Using cached session registry.");
            return prev;
          }
          setRegistryPlayers(MLB_PLAYER_RECORDS);
          setBackendCount(null);
          setRegistryStatus("fallback");
          setRegistryError(error instanceof Error ? error.message : "Backend player registry unavailable.");
          return prev;
        });
      }
    }
    loadRegistry();
    apiClient
      .get<{ batters?: Record<string, StatcastQuality> }>("/api/mlb/statcast/batters")
      .then((payload) => {
        const batters = payload?.batters;
        if (batters && typeof batters === "object") setStatcastByPlayer(batters);
      })
      .catch(() => undefined);
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
        setActiveRosterIds((prev) => {
          const next = new Set(prev);
          for (const id of collectActiveRosterIds(payload.players || [])) next.add(id);
          return next;
        });
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

  const positions = useMemo(() => {
    const set = new Set(players.map((p) => p.position).filter(Boolean));
    return ["ALL", ...Array.from(set).sort()];
  }, [players]);

  const filtered = useMemo(() => {
    let result = players;
    if (rosterScope === "playing") {
      result = result.filter((p) => activeRosterIds.has(p.id));
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q) || p.position.toLowerCase().includes(q)
      );
    }
    if (teamFilter !== "ALL") {
      result = result.filter((p) => p.team === teamFilter);
    }
    if (positionFilter !== "ALL") {
      result = result.filter((p) => p.position === positionFilter);
    }

    const sorted = [...result];
    sorted.sort((a, b) => {
      const playingDelta = Number(activeRosterIds.has(b.id)) - Number(activeRosterIds.has(a.id));
      if (playingDelta !== 0) return playingDelta;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "hr") return parseOfficialSeasonStat(b, "hr") - parseOfficialSeasonStat(a, "hr");
      if (sortBy === "avg") return parseOfficialSeasonStat(b, "avg") - parseOfficialSeasonStat(a, "avg");
      if (sortBy === "ops") return parseOfficialSeasonStat(b, "ops") - parseOfficialSeasonStat(a, "ops");
      if (sortBy === "barrel") {
        const aBarrel = listStatcast(a.id, statcastByPlayer)?.barrelPct ?? Number.NEGATIVE_INFINITY;
        const bBarrel = listStatcast(b.id, statcastByPlayer)?.barrelPct ?? Number.NEGATIVE_INFINITY;
        return bBarrel - aBarrel;
      }
      return 0;
    });
    return sorted;
  }, [players, search, teamFilter, positionFilter, sortBy, statcastByPlayer, rosterScope, activeRosterIds]);

  useEffect(() => {
    setVisibleLimit(48);
  }, [search, teamFilter, positionFilter, sortBy, listStyle, rosterScope]);

  const visiblePlayers = useMemo(() => filtered.slice(0, visibleLimit), [filtered, visibleLimit]);

  const openDetail = (player: MLBPlayer, tab: DetailTab = "overview") => {
    setSelectedPlayer(player);
    setDetailTab(tab);
  };

  const cacheDossier = useCallback((enriched: MLBPlayer) => {
    setSelectedPlayer((current) => (current?.id === enriched.id ? { ...current, ...enriched } : current));
    setRegistryPlayers((current) =>
      current.map((row) => (row.id === enriched.id ? { ...row, seasonStats: enriched.seasonStats, gameLogs: enriched.gameLogs, splits: enriched.splits } : row)),
    );
    setAllRegistryPlayers((current) =>
      current.map((row) => (row.id === enriched.id ? { ...row, seasonStats: enriched.seasonStats, gameLogs: enriched.gameLogs, splits: enriched.splits } : row)),
    );
  }, []);

  const closeDetail = () => setSelectedPlayer(null);

  const runAIResearch = async (player: MLBPlayer, research: Parameters<typeof assembleAiPlayerData>[1]) => {
    if (aiReports[player.id]) return;
    setResearching(player.id);
    try {
      const data = await apiClient.post<{ report?: string; status?: string; aiScore?: number }>(
        "/api/ai/player-research",
        { playerData: assembleAiPlayerData(player, research) },
      );
      setAiReports((prev) => ({
        ...prev,
        [player.id]: data.report || "AI report returned empty. Official stats above are still the source of truth.",
      }));
    } catch {
      setAiReports((prev) => ({
        ...prev,
        [player.id]: "AI research is unavailable right now. Season, Statcast, and game logs above are still live from the MLB feed.",
      }));
    } finally {
      setResearching(null);
    }
  };

  const registryTruth = registryStatus === "ready"
    ? (registryMeta.warming ? "Refreshing roster" : registryMeta.stale ? "Cached roster" : "Live roster")
    : registryStatus === "loading"
      ? "Loading roster"
      : "Fallback roster";

  return (
    <main className={`player-research-hub ${AURORA_PAGE} min-h-screen`} data-apex-mode="cognitive-safe">
      <header className="pr-max-chrome sticky top-0 z-40 border-b border-[var(--aurora-max-line)]">
        <div className={`mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 py-3 ${AURORA_PAGE_PAD_X}`}>
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <AuroraMaxProductMark />
            <div className="min-w-0">
              <AuroraMaxEyebrow>Player desk</AuroraMaxEyebrow>
              {mode === "bvp" ? (
                <p className={`${AURORA_LABEL} text-[var(--aurora-max-muted)]`}>
                  BvP · official MLB Stats API + Savant
                </p>
              ) : (
                <p className={`${AURORA_LABEL} text-[var(--aurora-max-muted)]`}>
                  {rosterScope === "playing"
                    ? `${filtered.length} on active roster`
                    : `${backendCount ?? players.length} in registry`}
                  {" · "}{registryTruth}
                  {statcastByPlayer ? " · Statcast connected" : ""}
                </p>
              )}
            </div>
            <AuroraMaxTruthBadge state={mode === "bvp" ? "live" : registryStatus === "ready" ? "live" : registryStatus === "loading" ? "projected" : "warning"}>
              {mode === "bvp" ? BVP_TRUTH_LABEL : registryTruth}
            </AuroraMaxTruthBadge>
          </div>
          <div className="flex rounded-md border border-[var(--aurora-max-line)] p-0.5">
            {([
              { id: "scout" as Mode, label: "Scout", icon: Crosshair },
              { id: "compare" as Mode, label: "Compare", icon: BarChart3 },
              { id: "build" as Mode, label: "Build", icon: Plus },
              { id: "bvp" as Mode, label: "BvP", icon: Swords },
            ]).map((t) => (
              <button
                key={t.id}
                onClick={() => setMode(t.id)}
                className={`pr-max-mode-tab flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${
                  mode === t.id ? "is-active" : ""
                }`}
              >
                <t.icon className="w-3 h-3" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className={`mx-auto max-w-7xl ${AURORA_PAGE_PAD_X} ${AURORA_PAGE_PAD_Y} ${AURORA_PAGE_GAP} lg:flex-row lg:items-start lg:gap-6 flex flex-col`}>
        {/* Left Sidebar */}
        {mode !== "bvp" ? (
        <div className="lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:w-[280px] w-full shrink-0 flex flex-col gap-4 mb-4 lg:mb-0">
          <AuroraMaxPanel className="flex flex-col gap-3 p-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--aurora-max-muted)]" />
              <input
                type="search"
                placeholder="Search a player or team"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-max-search rounded-md py-2.5 pl-9 pr-3 text-sm placeholder:text-[var(--aurora-max-muted)]"
              />
            </div>
            
            {mode === "scout" && (
              <>
                <div className="flex w-full rounded-md border border-[var(--aurora-max-line)] p-0.5" role="group" aria-label="Roster list">
                  <AuroraMaxControl
                    tone={rosterScope === "playing" ? "primary" : "neutral"}
                    aria-pressed={rosterScope === "playing"}
                    className="flex-1 justify-center px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                    onClick={() => setRosterScope("playing")}
                  >
                    Playing today
                  </AuroraMaxControl>
                  <AuroraMaxControl
                    tone={rosterScope === "all" ? "primary" : "neutral"}
                    aria-pressed={rosterScope === "all"}
                    className="flex-1 justify-center px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                    onClick={() => setRosterScope("all")}
                  >
                    All players
                  </AuroraMaxControl>
                </div>
                <p className="text-[10px] leading-4 text-[var(--aurora-max-muted)]">
                  Playing today is the current MLB active roster from the registry. All players keeps those first, then the rest.
                </p>
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="pr-max-search rounded-md px-3 py-2 text-xs"
                >
                  {teams.map((t) => <option key={t} value={t}>{t === "ALL" ? "All teams" : t}</option>)}
                </select>
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="pr-max-search rounded-md px-3 py-2 text-xs"
                >
                  {positions.map((p) => <option key={p} value={p}>{p === "ALL" ? "All positions" : p}</option>)}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="pr-max-search rounded-md px-3 py-2 text-xs"
                >
                  <option value="name">Sort: Name</option>
                  <option value="hr">Sort: Home runs (opened)</option>
                  <option value="avg">Sort: AVG (opened)</option>
                  <option value="ops">Sort: OPS (opened)</option>
                  <option value="barrel">Sort: Barrel% (Statcast)</option>
                </select>
                <div className="flex w-full rounded-md border border-[var(--aurora-max-line)] p-0.5">
                  <button type="button" onClick={() => setListStyle("grid")} className={`flex flex-1 justify-center rounded-md p-1.5 ${listStyle === "grid" ? "text-[var(--aurora-max-emerald)]" : "text-[var(--aurora-max-muted)]"}`}>
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => setListStyle("table")} className={`flex flex-1 justify-center rounded-md p-1.5 ${listStyle === "table" ? "text-[var(--aurora-max-emerald)]" : "text-[var(--aurora-max-muted)]"}`}>
                    <Table2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] leading-4 text-[var(--aurora-max-muted)]">
                  Tap a player for live season, Statcast, and game logs. Missing numbers stay blank.
                </p>
              </>
            )}
          </AuroraMaxPanel>

          {activeLegs && activeLegs.length > 0 && (
            <div className={`${AURORA_PANEL_PREMIUM} p-3 flex flex-col gap-2`}>
              <div className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-vouch-cyan" />
                Active Slip ({activeLegs.length})
              </div>
              {activeLegs.map((leg, i) => (
                <div key={leg.id || i} className={`p-2 rounded-lg ${AURORA_SURFACE} flex justify-between items-center`}>
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
        ) : null}

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* ====== SCOUT MODE ====== */}
          {mode === "scout" && (
            <div key="scout" className="pr-max-tab-pane">
              {/* Player list */}
            {registryError ? (
              <p className="mb-3 text-xs text-[var(--aurora-max-muted)]">{registryError}</p>
            ) : null}
            {filtered.length === 0 ? (
              rosterScope === "playing" && activeRosterIds.size === 0 ? (
                <AuroraMaxFallback title="Playing today unavailable" detail="The registry did not mark active-roster players. Open All players for the full list." />
              ) : (
                <AuroraMaxFallback title="No players found" detail="Try another player, team, or position." />
              )
            ) : listStyle === "grid" ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {visiblePlayers.map((p) => {
                    const hrProp = p.propositions?.find((prop) => /home run|\bhr\b/i.test(`${prop.market} ${prop.spec}`));
                    return (
                      <PlayerCard
                        key={p.id}
                        player={p}
                        statcast={listStatcast(p.id, statcastByPlayer)}
                        onClick={() => openDetail(p)}
                        onAddLeg={hrProp ? () => onAddLegToParlay(p, hrProp) : undefined}
                      />
                    );
                  })}
                </div>
                {filtered.length > visiblePlayers.length ? (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleLimit((limit) => limit + 48)}
                      className="aurora-max-control px-4 py-2 text-xs"
                    >
                      Show more players ({filtered.length - visiblePlayers.length} remaining)
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <PlayerTable players={visiblePlayers} statcastByPlayer={statcastByPlayer} onRowClick={(p) => openDetail(p)} />
            )}
            </div>
        )}

        {/* ====== COMPARE MODE ====== */}
        {mode === "compare" && (
          <div key="compare" className="pr-max-tab-pane">
          <CompareView
            players={players}
            compareA={compareA}
            compareB={compareB}
            onSelectA={setCompareA}
            onSelectB={setCompareB}
            onAddLeg={onAddLegToParlay}
            statcastByPlayer={statcastByPlayer}
          />
          </div>
        )}

        {/* ====== BUILD MODE ====== */}
        {mode === "build" && (
          <div key="build" className="pr-max-tab-pane">
          <BuildView players={players} onAddLeg={onAddLegToParlay} activeLegs={activeLegs} />
          </div>
        )}

        {mode === "bvp" && (
          <div key="bvp" className="pr-max-tab-pane">
            <BvpIntelligenceDesk players={players} statcastByPlayer={statcastByPlayer} />
          </div>
        )}
        </div>
      </div>

      {selectedPlayer ? (
        <AuroraMaxPlayerDossier
          player={selectedPlayer}
          tab={detailTab}
          onTabChange={setDetailTab}
          onClose={closeDetail}
          onAddLeg={onAddLegToParlay}
          onSaveVouch={onSaveVouch}
          aiReport={aiReports[selectedPlayer.id]}
          researching={researching === selectedPlayer.id}
          onRunAI={(research) => runAIResearch(selectedPlayer, research)}
          onDossierReady={cacheDossier}
        />
      ) : null}
    </main>
  );
}

/* ============================================================================
   Player Card — glass card with headshot and live stats
   ============================================================================ */
function PlayerCard({ player, statcast, onClick, onAddLeg }: { player: MLBPlayer; statcast: StatcastQuality | null; onClick: () => void; onAddLeg?: () => void }) {
  const hrProp = player.propositions?.find((p) => /home run|\bhr\b/i.test(`${p.market} ${p.spec}`));

  return (
    <button
      type="button"
      onClick={onClick}
      className="pr-max-card group flex cursor-pointer flex-col justify-between rounded-md p-3 text-left"
    >
      <div>
        <div className="mb-3 flex items-start gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-[var(--aurora-max-line)] bg-black/40">
            <img src={player.headshot} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
          </div>
          <div className="min-w-0 flex-1">
            <div className={`${AURORA_DISPLAY} truncate text-sm text-[var(--aurora-max-paper)]`}>{player.name}</div>
            <div className="truncate font-mono text-[10px] text-[var(--aurora-max-muted)]">
              {player.team} · {player.position} · B {player.bats}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {[
            { label: "AVG", value: getOfficialSeasonStat(player, "avg") },
            { label: "HR", value: getOfficialSeasonStat(player, "hr") },
            { label: "Barrel", value: formatPct(statcast?.barrelPct) },
          ].map((s) => (
            <div key={s.label} className="pr-max-stat min-w-0 flex-1 rounded-md py-1.5 text-center">
              <div className="font-mono text-[8px] uppercase tracking-wider text-[var(--aurora-max-muted)]">{s.label}</div>
              <div className="font-mono text-xs font-bold text-[var(--aurora-max-paper)]">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--aurora-max-line)] pt-2">
        <span className="truncate text-[10px] text-[var(--aurora-max-muted)]">{player.injuryStatus}</span>
        {onAddLeg && hrProp ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onAddLeg();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onAddLeg();
              }
            }}
            className="aurora-max-control aurora-max-control--primary px-2 py-1 text-[10px] font-bold"
          >
            <Plus className="h-3 w-3" /> Slip
          </span>
        ) : (
          <ChevronRight className="h-4 w-4 text-[var(--aurora-max-muted)]" />
        )}
      </div>
    </button>
  );
}

/* ============================================================================
   Player Table — sortable table view
   ============================================================================ */
function PlayerTable({ players, statcastByPlayer, onRowClick }: { players: MLBPlayer[]; statcastByPlayer: Record<string, StatcastQuality> | null; onRowClick: (p: MLBPlayer) => void }) {
  return (
    <div className="pr-max-table overflow-x-auto rounded-md">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-[var(--aurora-max-line)]">
            {["Player", "Team", "Pos", "AVG", "HR", "OPS", "Barrel%", "HardHit%", "xwOBA", ""].map((h) => (
              <th key={h} className="px-3 py-2.5 text-left font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--aurora-max-muted)]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((p) => {
            const sc = listStatcast(p.id, statcastByPlayer);
            return (
              <tr
                key={p.id}
                onClick={() => onRowClick(p)}
                className="cursor-pointer border-b border-[var(--aurora-max-line)] hover:bg-[rgba(0,217,160,0.04)]"
              >
                <td className="px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <img src={p.headshot} alt="" className="h-7 w-7 rounded-md object-cover" loading="lazy" decoding="async" />
                    <span className="truncate text-xs font-bold text-[var(--aurora-max-paper)]">{p.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-xs text-[var(--aurora-max-muted)]">{p.team.split(" ").pop()}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-[var(--aurora-max-muted)]">{p.position}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{getOfficialSeasonStat(p, "avg")}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{getOfficialSeasonStat(p, "hr")}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-[var(--aurora-max-emerald)]">{getOfficialSeasonStat(p, "ops")}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{formatPct(sc?.barrelPct)}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{formatPct(sc?.hardHitPct)}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{formatRate(sc?.xwoba)}</td>
                <td className="px-3 py-2.5"><ChevronRight className="h-3.5 w-3.5 text-[var(--aurora-max-muted)]" /></td>
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

function CompareView({ players, compareA, compareB, onSelectA, onSelectB, onAddLeg, statcastByPlayer }: {
  players: MLBPlayer[];
  compareA: MLBPlayer | null;
  compareB: MLBPlayer | null;
  onSelectA: (p: MLBPlayer) => void;
  onSelectB: (p: MLBPlayer) => void;
  onAddLeg: (player: MLBPlayer, prop: { id: string; market: string; odds: number | null; spec: string; truthLabel?: string }) => void;
  statcastByPlayer: Record<string, StatcastQuality> | null;
}) {
  const scA = compareA ? listStatcast(compareA.id, statcastByPlayer) : null;
  const scB = compareB ? listStatcast(compareB.id, statcastByPlayer) : null;
  const last10A = compareA ? sourcedLast10Avg(compareA) : "—";
  const last10B = compareB ? sourcedLast10Avg(compareB) : "—";
  const rows: Array<{ label: string; a: string; b: string; higher: boolean }> = compareA && compareB
    ? [
        { label: "AVG", a: getOfficialSeasonStat(compareA, "avg"), b: getOfficialSeasonStat(compareB, "avg"), higher: true },
        { label: "Home Runs", a: getOfficialSeasonStat(compareA, "hr"), b: getOfficialSeasonStat(compareB, "hr"), higher: true },
        { label: "OPS", a: getOfficialSeasonStat(compareA, "ops"), b: getOfficialSeasonStat(compareB, "ops"), higher: true },
        { label: "Barrel %", a: formatPct(scA?.barrelPct), b: formatPct(scB?.barrelPct), higher: true },
        { label: "Hard Hit %", a: formatPct(scA?.hardHitPct), b: formatPct(scB?.hardHitPct), higher: true },
        { label: "Exit Velocity", a: formatVelo(scA?.avgExitVelo), b: formatVelo(scB?.avgExitVelo), higher: true },
        { label: "xwOBA", a: formatRate(scA?.xwoba), b: formatRate(scB?.xwoba), higher: true },
        ...(last10A !== "—" || last10B !== "—"
          ? [{ label: "Last 10 AVG", a: last10A, b: last10B, higher: true }]
          : []),
      ]
    : [];

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Player A */}
        <CompareSlot label="Player A" player={compareA} players={players} onSelect={onSelectA} accent="#00d9a0" />
        {/* Player B */}
        <CompareSlot label="Player B" player={compareB} players={players} onSelect={onSelectB} accent="#f472b6" />
      </div>

      {/* Comparison table */}
      {compareA && compareB && (
        <div className="pr-max-table overflow-hidden rounded-md">
          <div className="grid grid-cols-3 border-b border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="p-3 text-[10px] font-bold uppercase tracking-wider text-white/40 font-mono">Stat</div>
            <div className="p-3 text-center text-xs font-bold text-[var(--ve-accent)]">{compareA.name}</div>
            <div className="p-3 text-center text-xs font-bold text-pink-300">{compareB.name}</div>
          </div>
          {rows.map((row) => {
            const aNum = parseCompareNumber(row.a);
            const bNum = parseCompareNumber(row.b);
            const comparable = aNum != null && bNum != null;
            const aWins = comparable && (row.higher ? aNum > bNum : aNum < bNum);
            const bWins = comparable && (row.higher ? bNum > aNum : bNum < aNum);
            return (
              <div key={row.label} className="grid grid-cols-3 border-b border-white/3">
                <div className="p-2.5 text-[11px] text-white/40 font-mono">{row.label}</div>
                <div className={`p-2.5 text-center text-sm font-bold font-mono ${aWins ? "text-[var(--ve-accent)]" : "text-white/40"}`}>{row.a}</div>
                <div className={`p-2.5 text-center text-sm font-bold font-mono ${bWins ? "text-pink-300" : "text-white/40"}`}>{row.b}</div>
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
                        <button onClick={() => onAddLeg(p, prop)} className="text-[9px] font-bold uppercase px-2 py-1 rounded text-slate-950" style={{ background: "linear-gradient(135deg, #00d9a0, #059669)" }}>
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
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
      <div className={`${AURORA_PANEL_PREMIUM} flex min-h-[280px] items-center justify-center rounded-2xl p-6`} role="status" aria-live="polite">
        <div className="text-center">
          <RefreshCw className="mx-auto h-7 w-7 animate-spin text-vouch-cyan" />
          <p className={`${AURORA_LABEL} mt-4 text-vouch-cyan`}>Preparing market board</p>
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
      <div className={`${AURORA_PANEL_PREMIUM} mb-5 space-y-3 rounded-2xl p-3`}>
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
              className={`${AURORA_SURFACE} w-full rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/30 focus:border-vouch-cyan/45 focus:outline-none`}
            />
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {["ALL", "Hits", "Base Types", "Run Production", "Speed", "Total Bases"].map((f) => (
            <button
              key={f}
              onClick={() => setPropFilter(f)}
              className={`shrink-0 px-2.5 py-1.5 text-[10px] font-bold uppercase rounded-md ${propFilter === f ? "text-slate-950" : "text-white/40"}`}
              style={propFilter === f ? { background: "linear-gradient(135deg, #00d9a0, #059669)" } : { background: "rgba(255,255,255,0.03)" }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        {groupedMarkets.length === 0 && (
          <div className={`${AURORA_PANEL_PREMIUM} rounded-2xl px-5 py-12 text-center`} role="status">
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
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">
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
                        <div className="mt-0.5 truncate text-[9px] uppercase tracking-wider text-emerald-300/75">
                          {prop.truthLabel}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-[var(--ve-accent)]">{prop.odds == null ? 'Odds TBD' : prop.odds.toFixed(2)}</div>
                      <button
                        onClick={() => onAddLeg(player, prop)}
                        disabled={isActive}
                        className={`mt-1 rounded px-2 py-0.5 text-[9px] font-bold uppercase ${isActive ? "bg-emerald-500/15 text-emerald-400" : "text-slate-950"}`}
                        style={!isActive ? { background: "linear-gradient(135deg, #00d9a0, #059669)" } : {}}
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
