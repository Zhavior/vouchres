"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
   Detail: modal overlay with 5 tabs (Overview / Splits / Game Log / AI / Props)
   Style: Bloomberg terminal — dark glass, large numbers, data-confidence badges

   Drop-in replacement for: src/components/PlayerResearchConsole.tsx
   Uses the same props + MLB_PLAYER_RECORDS data — no backend changes.
   ============================================================================ */

import { MLBPlayer, Leg, Vouch } from "../types";
import { MLB_PLAYER_RECORDS } from "../data/playerData";

interface Props {
  onAddLegToParlay: (player: MLBPlayer, prop: { id: string; market: string; odds: number; spec: string }) => void;
  onSaveVouch: (vouch: Vouch) => void;
  savedVouchIds: string[];
  activeLegs: Leg[];
  liveGames?: any[];
}

type Mode = "scout" | "compare" | "build";
type ListStyle = "grid" | "table";
type DetailTab = "overview" | "splits" | "gamelog" | "ai" | "props";

export default function PlayerResearchHub({
  onAddLegToParlay,
  onSaveVouch,
  savedVouchIds,
  activeLegs,
  liveGames,
}: Props) {
  const [mode, setMode] = useState<Mode>("scout");
  const [listStyle, setListStyle] = useState<ListStyle>("grid");
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"batterScore" | "hr" | "avg" | "ops" | "name">("batterScore");
  const [selectedPlayer, setSelectedPlayer] = useState<MLBPlayer | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");

  // Compare mode
  const [compareA, setCompareA] = useState<MLBPlayer | null>(null);
  const [compareB, setCompareB] = useState<MLBPlayer | null>(null);

  // AI research state
  const [aiReports, setAiReports] = useState<Record<string, string>>({});
  const [researching, setResearching] = useState<string | null>(null);

  const teams = useMemo(() => {
    const set = new Set(MLB_PLAYER_RECORDS.map((p) => p.team));
    return ["ALL", ...Array.from(set).sort()];
  }, []);

  const filtered = useMemo(() => {
    let result = MLB_PLAYER_RECORDS;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q) || p.position.toLowerCase().includes(q)
      );
    }
    if (teamFilter !== "ALL") {
      result = result.filter((p) => p.team === teamFilter);
    }
    const sorted = [...result];
    sorted.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "batterScore") return b.batterScore - a.batterScore;
      if (sortBy === "hr") return parseInt(b.seasonStats.hr) - parseInt(a.seasonStats.hr);
      if (sortBy === "avg") return parseFloat(b.seasonStats.avg) - parseFloat(a.seasonStats.avg);
      if (sortBy === "ops") return parseFloat(b.seasonStats.ops) - parseFloat(a.seasonStats.ops);
      return 0;
    });
    return sorted;
  }, [search, teamFilter, sortBy]);

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
        [player.id]: `${player.name} shows ${player.advanced.barrelPercent > 15 ? "elite" : "above-average"} barrel rate (${player.advanced.barrelPercent}%) with ${player.advanced.hardHitPercent}% hard-hit contact. His ${player.splits.vRHP.ops} OPS vs RHP suggests a strong platoon advantage against right-handed pitching. Recent form (${player.splits.last10.ops} OPS over last 10) indicates ${parseFloat(player.splits.last10.ops) > parseFloat(player.seasonStats.ops) ? "heating up" : "cooling off"}. Key risk: ${player.scoutingReport.riskFactor} risk factor. Hot zones: ${player.scoutingReport.hotZones.join(", ")}.`,
      }));
      setResearching(null);
    }, 1500);
  };

  return (
    <div className="min-h-screen" style={{ background: "#040810", color: "#e2e8f0" }}>
      {/* ====== Header ====== */}
      <header className="sticky top-0 z-40" style={{ background: "rgba(8,12,20,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #22d3ee, #2563eb)" }}>
              <Search className="w-4 h-4 text-slate-950" />
            </div>
            <span className="font-bold text-white text-sm">Player Research</span>
            <span className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">{MLB_PLAYER_RECORDS.length} players</span>
          </div>
          {/* Mode tabs */}
          <div className="flex p-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {([
              { id: "scout" as Mode, label: "Scout", icon: Crosshair },
              { id: "compare" as Mode, label: "Compare", icon: BarChart3 },
              { id: "build" as Mode, label: "Build", icon: Plus },
            ]).map((t) => (
              <button
                key={t.id}
                onClick={() => setMode(t.id)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  mode === t.id ? "text-slate-950" : "text-slate-500 hover:text-slate-300"
                }`}
                style={mode === t.id ? { background: "linear-gradient(135deg, #22d3ee, #2563eb)" } : {}}
              >
                <t.icon className="w-3 h-3" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* ====== SCOUT MODE ====== */}
        {mode === "scout" && (
          <>
            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search players, teams, positions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {teams.map((t) => <option key={t} value={t} style={{ background: "#0b1120" }}>{t === "ALL" ? "All Teams" : t}</option>)}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <option value="batterScore" style={{ background: "#0b1120" }}>Sort: Batter Score</option>
                <option value="hr" style={{ background: "#0b1120" }}>Sort: Home Runs</option>
                <option value="avg" style={{ background: "#0b1120" }}>Sort: AVG</option>
                <option value="ops" style={{ background: "#0b1120" }}>Sort: OPS</option>
                <option value="name" style={{ background: "#0b1120" }}>Sort: Name</option>
              </select>
              <div className="flex p-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <button onClick={() => setListStyle("grid")} className={`p-1.5 rounded-md transition-all ${listStyle === "grid" ? "text-cyan-400" : "text-slate-600"}`}>
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setListStyle("table")} className={`p-1.5 rounded-md transition-all ${listStyle === "table" ? "text-cyan-400" : "text-slate-600"}`}>
                  <Table2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Player list */}
            {listStyle === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filtered.map((p, i) => (
                  <PlayerCard key={p.id} player={p} index={i} onClick={() => openDetail(p)} />
                ))}
              </div>
            ) : (
              <PlayerTable players={filtered} onRowClick={(p) => openDetail(p)} sortBy={sortBy} />
            )}
          </>
        )}

        {/* ====== COMPARE MODE ====== */}
        {mode === "compare" && (
          <CompareView
            players={MLB_PLAYER_RECORDS}
            compareA={compareA}
            compareB={compareB}
            onSelectA={setCompareA}
            onSelectB={setCompareB}
            onAddLeg={onAddLegToParlay}
          />
        )}

        {/* ====== BUILD MODE ====== */}
        {mode === "build" && (
          <BuildView players={MLB_PLAYER_RECORDS} onAddLeg={onAddLegToParlay} activeLegs={activeLegs} />
        )}
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
    </div>
  );
}

/* ============================================================================
   Player Card — glass card with headshot, team color, batter score
   ============================================================================ */
function PlayerCard({ player, index, onClick }: { player: MLBPlayer; index: number; onClick: () => void }) {
  const scoreColor = player.batterScore >= 90 ? "#34d399" : player.batterScore >= 75 ? "#fbbf24" : "#f87171";
  const injuryColor =
    player.injurySeverity === "NONE" ? "#34d399" :
    player.injurySeverity === "DAY_TO_DAY" ? "#fbbf24" : "#f87171";

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="relative rounded-2xl p-4 text-left overflow-hidden transition-all group"
      style={{
        background: "rgba(15,23,42,0.5)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Score badge */}
      <div className="absolute top-3 right-3 z-10 w-10 h-10 rounded-xl flex flex-col items-center justify-center" style={{ background: `${scoreColor}15`, border: `1px solid ${scoreColor}30` }}>
        <span className="text-[7px] text-slate-500 font-mono uppercase">SCORE</span>
        <span className="text-sm font-bold" style={{ color: scoreColor }}>{player.batterScore}</span>
      </div>

      {/* Headshot */}
      <div className="w-16 h-16 rounded-2xl overflow-hidden mb-3 bg-slate-800 border border-white/5">
        <img src={player.headshot} alt={player.name} className="w-full h-full object-cover" />
      </div>

      {/* Name + team */}
      <div className="text-sm font-bold text-white truncate">{player.name}</div>
      <div className="text-[10px] text-slate-500 truncate">{player.team} · #{player.number}</div>

      {/* Stats row */}
      <div className="flex items-center gap-2 mt-3">
        {[
          { label: "AVG", value: player.seasonStats.avg },
          { label: "HR", value: player.seasonStats.hr },
          { label: "OPS", value: player.seasonStats.ops },
        ].map((s) => (
          <div key={s.label} className="flex-1 text-center py-1 rounded-md" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="text-[7px] text-slate-600 font-mono uppercase">{s.label}</div>
            <div className="text-xs font-bold text-slate-300">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Injury badge */}
      <div className="mt-2 flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: injuryColor }} />
        <span className="text-[9px] text-slate-500">{player.injuryStatus}</span>
      </div>

      {/* Hover arrow */}
      <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-slate-700 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
    </motion.button>
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
              <th key={h} className="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-3 py-2.5 text-left font-mono">{h}</th>
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
                    <img src={p.headshot} alt={p.name} className="w-7 h-7 rounded-lg object-cover" />
                    <span className="font-bold text-white text-xs">{p.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-400">{p.team.split(" ").pop()}</td>
                <td className="px-3 py-2.5 text-xs font-mono text-slate-300">{p.seasonStats.avg}</td>
                <td className="px-3 py-2.5 text-xs font-mono text-slate-300">{p.seasonStats.hr}</td>
                <td className="px-3 py-2.5 text-xs font-mono text-slate-300">{p.seasonStats.rbi}</td>
                <td className="px-3 py-2.5 text-xs font-mono text-cyan-300">{p.seasonStats.ops}</td>
                <td className="px-3 py-2.5 text-xs font-mono text-slate-400">{p.advanced.barrelPercent?.toFixed(1)}%</td>
                <td className="px-3 py-2.5 text-xs font-mono text-slate-400">{p.advanced.hardHitPercent?.toFixed(1)}%</td>
                <td className="px-3 py-2.5">
                  <span className="text-xs font-bold font-mono" style={{ color: scoreColor }}>{p.batterScore}</span>
                </td>
                <td className="px-3 py-2.5"><ChevronRight className="w-3.5 h-3.5 text-slate-600" /></td>
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
function CompareView({ players, compareA, compareB, onSelectA, onSelectB, onAddLeg }: {
  players: MLBPlayer[];
  compareA: MLBPlayer | null;
  compareB: MLBPlayer | null;
  onSelectA: (p: MLBPlayer) => void;
  onSelectB: (p: MLBPlayer) => void;
  onAddLeg: (player: MLBPlayer, prop: { id: string; market: string; odds: number; spec: string }) => void;
}) {
  return (
    <div>
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
            <div className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Stat</div>
            <div className="p-3 text-center text-xs font-bold text-cyan-300">{compareA.name}</div>
            <div className="p-3 text-center text-xs font-bold text-pink-300">{compareB.name}</div>
          </div>
          {[
            { label: "Batter Score", a: compareA.batterScore, b: compareB.batterScore, higher: true },
            { label: "AVG", a: parseFloat(compareA.seasonStats.avg), b: parseFloat(compareB.seasonStats.avg), higher: true },
            { label: "Home Runs", a: parseInt(compareA.seasonStats.hr), b: parseInt(compareB.seasonStats.hr), higher: true },
            { label: "RBI", a: parseInt(compareA.seasonStats.rbi), b: parseInt(compareB.seasonStats.rbi), higher: true },
            { label: "OPS", a: parseFloat(compareA.seasonStats.ops), b: parseFloat(compareB.seasonStats.ops), higher: true },
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
                <div className="p-2.5 text-[11px] text-slate-500 font-mono">{row.label}</div>
                <div className={`p-2.5 text-center text-sm font-bold font-mono ${aWins ? "text-cyan-300" : "text-slate-500"}`}>{typeof row.a === "number" ? row.a.toFixed(row.a % 1 !== 0 ? 3 : 0) : row.a}</div>
                <div className={`p-2.5 text-center text-sm font-bold font-mono ${bWins ? "text-pink-300" : "text-slate-500"}`}>{typeof row.b === "number" ? row.b.toFixed(row.b % 1 !== 0 ? 3 : 0) : row.b}</div>
              </div>
            );
          })}

          {/* Edge propositions */}
          <div className="p-4 border-t border-white/5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Edge Propositions</div>
            <div className="grid md:grid-cols-2 gap-3">
              {[compareA, compareB].map((p) => p && (
                <div key={p.id} className="space-y-2">
                  <div className="text-xs font-bold text-white">{p.name}</div>
                  {p.propositions.map((prop) => (
                    <div key={prop.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <span className="text-[11px] text-slate-400">{prop.market}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-300">{prop.odds.toFixed(2)}</span>
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
  onSelect: (p: MLBPlayer) => void;
  accent: string;
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(15,23,42,0.4)", border: `1px solid ${accent}20` }}>
      <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: accent }}>{label}</div>
      {player ? (
        <div className="flex items-center gap-3">
          <img src={player.headshot} alt={player.name} className="w-12 h-12 rounded-xl object-cover" />
          <div className="flex-1">
            <div className="text-sm font-bold text-white">{player.name}</div>
            <div className="text-[10px] text-slate-500">{player.team} · {player.position}</div>
          </div>
          <button onClick={() => onSelect(null as any)} className="text-slate-600 hover:text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <select
          onChange={(e) => { const p = players.find((p) => p.id === e.target.value); if (p) onSelect(p); }}
          className="w-full rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
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
  onAddLeg: (player: MLBPlayer, prop: { id: string; market: string; odds: number; spec: string }) => void;
  activeLegs: Leg[];
}) {
  const [propFilter, setPropFilter] = useState("ALL");
  const allProps = useMemo(() => {
    const props: Array<{ player: MLBPlayer; prop: any }> = [];
    for (const p of players) {
      for (const prop of p.propositions) {
        props.push({ player: p, prop });
      }
    }
    return props;
  }, [players]);

  const filtered = propFilter === "ALL" ? allProps : allProps.filter(({ prop }) => prop.market.toLowerCase().includes(propFilter.toLowerCase()));
  const activeLegIds = new Set(activeLegs.map((l) => l.selection));

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="text-sm text-slate-400">{filtered.length} props available</div>
        <div className="flex gap-1.5">
          {["ALL", "Hits", "Home", "Bases"].map((f) => (
            <button
              key={f}
              onClick={() => setPropFilter(f)}
              className={`text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-md transition-all ${propFilter === f ? "text-slate-950" : "text-slate-500"}`}
              style={propFilter === f ? { background: "linear-gradient(135deg, #22d3ee, #2563eb)" } : { background: "rgba(255,255,255,0.03)" }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(({ player, prop }, i) => {
          const isActive = activeLegIds.has(prop.spec);
          return (
            <motion.div
              key={prop.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="rounded-xl p-3 flex items-center gap-3"
              style={{ background: "rgba(15,23,42,0.4)", border: `1px solid ${isActive ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.06)"}` }}
            >
              <img src={player.headshot} alt={player.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{player.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{prop.market}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-mono font-bold text-cyan-300">{prop.odds.toFixed(2)}</div>
                <button
                  onClick={() => onAddLeg(player, prop)}
                  disabled={isActive}
                  className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded transition-all mt-1 ${isActive ? "bg-emerald-500/15 text-emerald-400" : "text-slate-950"}`}
                  style={!isActive ? { background: "linear-gradient(135deg, #22d3ee, #2563eb)" } : {}}
                >
                  {isActive ? "Added" : "+ Slip"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
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
  onAddLeg: (player: MLBPlayer, prop: { id: string; market: string; odds: number; spec: string }) => void;
  onSaveVouch: (vouch: Vouch) => void;
  aiReport?: string;
  researching: boolean;
  onRunAI: () => void;
}) {
  const tabs: { id: DetailTab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "splits", label: "Splits", icon: BarChart3 },
    { id: "gamelog", label: "Game Log", icon: TrendingUp },
    { id: "ai", label: "AI Report", icon: Sparkles },
    { id: "props", label: "Props", icon: Crosshair },
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
          <img src={player.headshot} alt={player.name} className="w-16 h-16 rounded-2xl object-cover" />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{player.name}</h2>
            <div className="text-xs text-slate-500">{player.team} · #{player.number} · {player.position} · B/T: {player.bats}/{player.throws}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: player.batterScore >= 90 ? "rgba(52,211,153,0.12)" : "rgba(251,191,36,0.12)", color: player.batterScore >= 90 ? "#34d399" : "#fbbf24" }}>
                Score: {player.batterScore}
              </span>
              <span className="text-[10px] text-slate-500">{player.injuryStatus}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white p-2"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 px-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border-b-2 ${tab === t.id ? "text-cyan-400 border-cyan-400" : "text-slate-500 border-transparent hover:text-slate-300"}`}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "overview" && <OverviewTab player={player} />}
          {tab === "splits" && <SplitsTab player={player} />}
          {tab === "gamelog" && <GameLogTab player={player} />}
          {tab === "ai" && <AITab player={player} report={aiReport} researching={researching} onRun={onRunAI} />}
          {tab === "props" && <PropsTab player={player} onAddLeg={onAddLeg} />}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ============ Overview Tab ============ */
function OverviewTab({ player }: { player: MLBPlayer }) {
  const stats = [
    { label: "AVG", value: player.seasonStats.avg, color: "#e2e8f0" },
    { label: "HR", value: player.seasonStats.hr, color: "#fbbf24" },
    { label: "RBI", value: player.seasonStats.rbi, color: "#22d3ee" },
    { label: "OPS", value: player.seasonStats.ops, color: "#34d399" },
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
      {/* Season stats */}
      <div className="grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="text-[9px] text-slate-600 font-mono uppercase tracking-widest">{s.label}</div>
            <div className="text-2xl font-bold font-mono mt-1" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Advanced metrics with bars */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Advanced Metrics</div>
        <div className="space-y-2">
          {adv.map((m) => (
            <div key={m.label} className="flex items-center gap-3">
              <div className="w-24 text-[11px] text-slate-400 font-mono">{m.label}</div>
              <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (parseFloat(String(m.value)) / m.max) * 100)}%`, background: "linear-gradient(90deg, #22d3ee, #2563eb)" }} />
              </div>
              <div className="w-16 text-right text-xs font-mono font-bold text-cyan-300">{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scouting report */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Scouting Report</div>
        <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
          <div><span className="text-emerald-400 font-bold">Power:</span> {player.scoutingReport.powerText}</div>
          <div><span className="text-cyan-400 font-bold">Contact:</span> {player.scoutingReport.contactText}</div>
          <div><span className="text-violet-400 font-bold">Discipline:</span> {player.scoutingReport.disciplineText}</div>
          <div className="pt-2 border-t border-white/5"><span className="text-amber-400 font-bold">Overall:</span> {player.scoutingReport.overallScouting}</div>
        </div>
      </div>

      {/* Hot zones + risk */}
      <div className="flex items-center gap-4">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-1">Hot Zones</div>
          <div className="flex flex-wrap gap-1">
            {player.scoutingReport.hotZones.map((z) => (
              <span key={z} className="text-[10px] px-2 py-0.5 rounded-md text-emerald-300" style={{ background: "rgba(52,211,153,0.08)" }}>{z}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-1">Risk</div>
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
                <th key={h} className="text-[9px] font-bold text-slate-600 uppercase tracking-wider px-3 py-2 text-left font-mono">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {splitData.map((s) => (
              <tr key={s.label} className="border-b border-white/3">
                <td className="px-3 py-2 text-xs font-bold text-slate-300">{s.label}</td>
                <td className="px-3 py-2 text-xs font-mono text-slate-400">{s.data.avg}</td>
                <td className="px-3 py-2 text-xs font-mono text-slate-400">{s.data.obp}</td>
                <td className="px-3 py-2 text-xs font-mono text-slate-400">{s.data.slg}</td>
                <td className="px-3 py-2 text-xs font-mono font-bold text-cyan-300">{s.data.ops}</td>
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
          <div className="text-[10px] text-slate-600 font-mono w-16">{g.date}</div>
          <div className="text-xs text-slate-300 flex-1">vs {g.opponent}</div>
          <div className="text-[10px] text-slate-500 font-mono">{g.result}</div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">{g.ab}AB</span>
            <span className="text-slate-300">{g.h}H</span>
            {g.hr > 0 && <span className="text-amber-400 font-bold">{g.hr}HR</span>}
            {g.rbi > 0 && <span className="text-cyan-400">{g.rbi}RBI</span>}
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
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">AI Research Report</span>
        </div>
        <div className="p-4 rounded-xl text-sm text-slate-300 leading-relaxed" style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.15)" }}>
          {report}
        </div>
        <p className="text-[10px] text-slate-600">Probability-based research for entertainment — not betting advice.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Sparkles className="w-10 h-10 text-cyan-400/40 mb-4" />
      <p className="text-sm text-slate-400 mb-4">Run AI research on {player.name}</p>
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

/* ============ Props Tab ============ */
function PropsTab({ player, onAddLeg }: { player: MLBPlayer; onAddLeg: (player: MLBPlayer, prop: { id: string; market: string; odds: number; spec: string }) => void }) {
  return (
    <div className="space-y-2">
      {player.propositions.map((prop) => (
        <div key={prop.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div>
            <div className="text-sm font-bold text-white">{prop.market}</div>
            <div className="text-[10px] text-slate-500">{prop.spec}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-mono font-bold text-cyan-300">{prop.odds.toFixed(2)}</span>
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
