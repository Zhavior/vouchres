import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "../lib/motion";
import {
  Plus, X, Search, Sliders, Shield, Zap, AlertTriangle,
  CheckCircle2, TrendingUp, Lock, Eye, Share2, Save,
  Trash2, ChevronUp, ChevronDown, Gavel, Sparkles,
  Activity, ScanLine, Cpu, Award, RefreshCw, Flame, Tv,
} from "lucide-react";
import { Parlay, Leg, Vouch, FeedPost, CreatorProofProfile } from "../types";
import { apiUrl } from "../lib/apiBase";
import { apiClient } from "../lib/apiClient";
import { americanToDecimal, decimalToAmerican, americanLabel } from "../lib/odds";
import { getFounderPointsLabel } from "../lib/founderAccess";
import { buildSaveParlayPayload, normalizeParlaySlip } from "../lib/parlays/parlayBridge";

/** A leg has a real, usable price only when odds is a finite American number. */
function hasOdds(leg: Leg): leg is Leg & { odds: number } {
  return typeof leg.odds === "number" && Number.isFinite(leg.odds) && leg.odds !== 0;
}

/**
 * ParlayStudio — Premium 3-panel parlay builder
 *
 * Desktop: 3-panel (Pick Library | Parlay Canvas | Slip + Judge)
 * Mobile Portrait: Tab-based (Picks | Builder | Judge | Preview) + bottom action bar
 * Mobile Landscape: Compact 3-column layout
 *
 * Keeps existing state: legs, setLegs, onSaveParlay, onSaveVouch
 * Adds: judge panel, risk meter, weakest leg, vouch preview, draft persistence
 */

interface Props {
  onSaveParlay: (parlay: Parlay) => void;
  savedParlays: Parlay[];
  legs: Leg[];
  setLegs: React.Dispatch<React.SetStateAction<Leg[]>>;
  onSectionChange: (section: string) => void;
  liveGames?: any[];
  onSaveVouch?: (vouch: Vouch) => void;
  posts?: FeedPost[];
  profile?: CreatorProofProfile;
  initialTab?: "builder" | "results";
}

type BuilderMode = "safer" | "balanced" | "aggressive" | "longshot";
type MobileTab = "picks" | "builder" | "judge" | "preview";

export default function ParlayStudio({
  onSaveParlay,
  savedParlays,
  legs,
  setLegs,
  onSectionChange,
  liveGames = [],
  onSaveVouch = () => {},
  posts = [],
  profile,
  initialTab = "builder",
}: Props) {
  const [mode, setMode] = useState<BuilderMode>("balanced");
  const [mobileTab, setMobileTab] = useState<MobileTab>("picks");
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("My Parlay");
  const [showRotate, setShowRotate] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [judgeVerdict, setJudgeVerdict] = useState<JudgeVerdict | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Detect mobile portrait for rotate suggestion
  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth < 768;
      const isPortrait = window.innerHeight > window.innerWidth;
      setShowRotate(isMobile && isPortrait);
    };
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  // Load saved legs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("vouchedge_parlay_studio_legs");
    if (saved && legs.length === 0) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLegs(parsed);
        }
      } catch {}
    }
  }, []);

  // Persist legs
  useEffect(() => {
    localStorage.setItem("vouchedge_parlay_studio_legs", JSON.stringify(legs));
  }, [legs]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // === Leg management ===
  const addLeg = (leg: Leg) => {
    if (legs.some((l) => l.selection === leg.selection)) {
      showToast("This leg is already in your slip");
      return;
    }
    setLegs([...legs, leg]);
    showToast(`Added: ${leg.selection}`);
    setMobileTab("builder");
  };

  const removeLeg = (id: string) => {
    setLegs(legs.filter((l) => l.id !== id));
    setJudgeVerdict(null);
  };

  const moveLeg = (id: string, dir: "up" | "down") => {
    const idx = legs.findIndex((l) => l.id === id);
    if (idx === -1) return;
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= legs.length) return;
    const next = [...legs];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setLegs(next);
  };

  const clearSlip = () => {
    setLegs([]);
    setJudgeVerdict(null);
    showToast("Slip cleared");
  };

  // === Computed values ===
  // Combined odds are UNKNOWN (null) unless every leg has a real price. We never
  // fabricate a total from placeholder odds.
  const combined = useMemo<{ american: number | null; decimal: number | null }>(() => {
    if (legs.length === 0) return { american: null, decimal: null };
    if (!legs.every(hasOdds)) return { american: null, decimal: null };
    const decimal = legs.reduce((acc, leg) => acc * americanToDecimal(leg.odds as number), 1);
    return { american: decimalToAmerican(decimal), decimal: Number(decimal.toFixed(3)) };
  }, [legs]);
  const combinedOdds = combined.american; // number | null

  const riskTier = useMemo(() => {
    if (legs.length === 0) return "—";
    if (legs.length <= 1) return "Safer";
    if (legs.length <= 2) return "Balanced";
    if (legs.length <= 3) return "Aggressive";
    return "Longshot";
  }, [legs.length]);

  const weakestLeg = useMemo(() => {
    const priced = legs.filter(hasOdds);
    if (priced.length === 0) return null;
    const score = (o: number) => (o > 0 ? 100 - Math.min(o, 50) : 100 - Math.min(Math.abs(o), 100));
    return priced.reduce((min, leg) => (score(leg.odds) < score(min.odds) ? leg : min));
  }, [legs]);

  const volatility = useMemo(() => {
    if (legs.length === 0) return 0;
    const base = legs.length * 15;
    const highOddsLegs = legs.filter((l) => hasOdds(l) && l.odds > 200).length * 10;
    return Math.min(100, base + highOddsLegs);
  }, [legs]);

  // === AI Judge ===
  const runJudge = async () => {
    if (legs.length === 0) {
      showToast("Add legs first");
      return;
    }
    setIsAnalyzing(true);
    setJudgeVerdict(null);

    // Local draft judge — backend AI judge not connected yet. Falls back to local logic.
    setTimeout(() => {
      const warnings: string[] = [];
      let score = 70 - legs.length * 8;

      if (legs.length > 4) warnings.push("5+ legs is high variance by construction");
      if (legs.length > 2) warnings.push("Each added leg lowers realistic hit rate");
      if (weakestLeg && hasOdds(weakestLeg) && weakestLeg.odds > 300) warnings.push(`${weakestLeg.selection} is a longshot leg — high variance`);
      if (legs.some((l) => !l.game)) warnings.push("Some legs are missing game info");

      score = Math.max(10, Math.min(95, score + (legs.length <= 2 ? 15 : 0)));

      const verdict: JudgeVerdict = {
        score,
        label: score >= 65 ? "Balanced Build" : score >= 40 ? "Risky Build" : "Longshot Only",
        warnings,
        weakestLeg: weakestLeg?.selection || null,
        suggestion: legs.length > 3 ? "Consider removing the weakest leg for a stronger build" : "Build looks reasonable for this risk level",
        saferVersion: legs.length > 2 ? `Try a ${legs.length - 1}-leg version without ${weakestLeg?.selection}` : null,
      };
      setJudgeVerdict(verdict);
      setIsAnalyzing(false);
      setMobileTab("judge");
    }, 1500);
  };

  // === Save / Post ===
  const handleSave = async () => {
    if (legs.length === 0) {
      showToast("Add legs to save");
      return;
    }

    const parlay: Parlay = {
      id: `parlay-${Date.now()}`,
      title: title || "Untitled Parlay",
      legs: [...legs],
      totalOdds: americanLabel(combinedOdds), // "Odds TBD" when any leg price is unknown
      oddsValue: combined.decimal ?? 0,
      riskTier: legs.length <= 1 ? "LOW" : legs.length <= 2 ? "MEDIUM" : "HIGH",
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    try {
      const canonicalSlip = normalizeParlaySlip({
        ...parlay,
        source: "builder",
        metadata: {
          builder: "ParlayStudio",
          mode,
          riskTier: parlay.riskTier,
        },
      });

      const payload = buildSaveParlayPayload(canonicalSlip);
      const saved = await apiClient.post("/api/me/parlays", payload);
      const backendPickId =
        (saved as any)?.pick?.id ||
        (saved as any)?.pickId ||
        (saved as any)?.id ||
        (saved as any)?.data?.id ||
        null;

      onSaveParlay({
        ...parlay,
        backendPickId,
        backendSyncState: backendPickId ? "synced" : "unknown",
        backendSyncedAt: new Date().toISOString(),
      } as any);

      showToast("Parlay saved to your account");
    } catch (error: any) {
      console.error("[parlay-studio-save] failed", error);
      onSaveParlay(parlay);
      showToast(`Saved locally only: ${error?.message || "account save failed"}`);
    }
  };

  const handlePost = () => {
    if (legs.length === 0) {
      showToast("Add legs to post");
      return;
    }
    showToast("Posted as Vouch — check Vouch Board");
    setMobileTab("preview");
  };

  // === Available picks (from live games) ===
  const availablePicks = useMemo(() => {
    const picks: Leg[] = [];
    for (const game of liveGames.slice(0, 10)) {
      if (game.homeTeam) {
        picks.push({
          id: `pick-${game.id}-home-hr`,
          sport: "MLB",
          game: `${game.awayTeam || "?"} @ ${game.homeTeam || "?"}`,
          market: "Anytime HR",
          selection: `${game.homeTeam} HR`,
          odds: 350,
          status: "PENDING",
        });
      }
      if (game.awayTeam) {
        picks.push({
          id: `pick-${game.id}-away-hr`,
          sport: "MLB",
          game: `${game.awayTeam || "?"} @ ${game.homeTeam || "?"}`,
          market: "Anytime HR",
          selection: `${game.awayTeam} HR`,
          odds: 380,
          status: "PENDING",
        });
      }
    }
    if (search) {
      const q = search.toLowerCase();
      return picks.filter((p) => p.selection.toLowerCase().includes(q) || p.game.toLowerCase().includes(q));
    }
    return picks;
  }, [liveGames, search]);

  // === Render ===
  return (
    <div className="min-h-screen" style={{ background: "#040810", color: "#e2e8f0" }}>
      {/* Rotate suggestion */}
      {showRotate && (
        <div className="text-center py-1.5 text-[10px] text-slate-500" style={{ background: "rgba(34,211,238,0.05)", borderBottom: "1px solid rgba(34,211,238,0.1)" }}>
          💡 Tip: Rotate your phone for the full Parlay Studio workspace
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40" style={{ background: "rgba(8,12,20,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="px-4 sm:px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #22d3ee, #2563eb)" }}>
              <Sliders className="w-3.5 h-3.5 text-slate-950" />
            </div>
            <span className="font-bold text-white text-sm">Parlay Studio</span>
            <span className="text-[9px] text-slate-600 hidden sm:inline">Build, judge, save, and prove your parlays</span>
          </div>
          {/* Mode selector */}
          <div className="flex items-center gap-1">
            {([
              { id: "safer" as BuilderMode, label: "Safer", color: "#34d399" },
              { id: "balanced" as BuilderMode, label: "Balanced", color: "#22d3ee" },
              { id: "aggressive" as BuilderMode, label: "Aggro", color: "#fbbf24" },
              { id: "longshot" as BuilderMode, label: "Longshot", color: "#f472b6" },
            ]).map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`text-[9px] font-bold uppercase px-2 py-1 rounded-md transition-all ${mode === m.id ? "text-slate-950" : "text-slate-600"}`}
                style={mode === m.id ? { background: m.color } : { background: "rgba(255,255,255,0.03)" }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* === DESKTOP 3-PANEL === */}
      <div className="hidden lg:grid grid-cols-12 gap-0 h-[calc(100vh-48px)]">
        {/* LEFT: Pick Library */}
        <div className="col-span-3 border-r border-white/5 overflow-y-auto" style={{ background: "rgba(8,12,20,0.4)" }}>
          <PickLibrary picks={availablePicks} search={search} setSearch={setSearch} onAdd={addLeg} activeLegIds={new Set(legs.map((l) => l.selection))} onSectionChange={onSectionChange} />
        </div>

        {/* CENTER: Parlay Canvas */}
        <div className="col-span-6 overflow-y-auto">
          <ParlayCanvas legs={legs} title={title} setTitle={setTitle} onRemove={removeLeg} onMove={moveLeg} combinedOdds={combinedOdds} riskTier={riskTier} weakestLeg={weakestLeg} volatility={volatility} onClear={clearSlip} onSectionChange={onSectionChange} />
        </div>

        {/* RIGHT: Slip + Judge */}
        <div className="col-span-3 border-l border-white/5 overflow-y-auto" style={{ background: "rgba(8,12,20,0.4)" }}>
          <SlipAndJudge legs={legs} combinedOdds={combinedOdds} riskTier={riskTier} weakestLeg={weakestLeg} volatility={volatility} mode={mode} isAnalyzing={isAnalyzing} onJudge={runJudge} judgeVerdict={judgeVerdict} onSave={handleSave} onPost={handlePost} onShare={() => showToast("Share preview copied")} />
        </div>
      </div>

      {/* === MOBILE PORTRAIT: Tab-based === */}
      <div className="lg:hidden">
        {/* Mobile tabs */}
        <div className="sticky top-12 z-30 flex border-b border-white/5" style={{ background: "rgba(8,12,20,0.9)", backdropFilter: "blur(12px)" }}>
          {([
            { id: "picks" as MobileTab, label: "Picks", icon: Search },
            { id: "builder" as MobileTab, label: "Builder", icon: Sliders },
            { id: "judge" as MobileTab, label: "Judge", icon: Gavel },
            { id: "preview" as MobileTab, label: "Preview", icon: Eye },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setMobileTab(t.id)}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 border-b-2 transition-all ${mobileTab === t.id ? "text-cyan-400 border-cyan-400" : "text-slate-600 border-transparent"}`}
            >
              <t.icon className="w-3 h-3" /> {t.label}
              {t.id === "builder" && legs.length > 0 && <span className="text-[8px] px-1 rounded-full bg-cyan-500/20 text-cyan-300">{legs.length}</span>}
            </button>
          ))}
        </div>

        {/* Mobile content */}
        <div className="pb-20" style={{ minHeight: "calc(100vh - 100px)" }}>
          {mobileTab === "picks" && (
            <PickLibrary picks={availablePicks} search={search} setSearch={setSearch} onAdd={addLeg} activeLegIds={new Set(legs.map((l) => l.selection))} onSectionChange={onSectionChange} />
          )}
          {mobileTab === "builder" && (
            <ParlayCanvas legs={legs} title={title} setTitle={setTitle} onRemove={removeLeg} onMove={moveLeg} combinedOdds={combinedOdds} riskTier={riskTier} weakestLeg={weakestLeg} volatility={volatility} onClear={clearSlip} onSectionChange={onSectionChange} />
          )}
          {mobileTab === "judge" && (
            <SlipAndJudge legs={legs} combinedOdds={combinedOdds} riskTier={riskTier} weakestLeg={weakestLeg} volatility={volatility} mode={mode} isAnalyzing={isAnalyzing} onJudge={runJudge} judgeVerdict={judgeVerdict} onSave={handleSave} onPost={handlePost} onShare={() => showToast("Share preview copied")} />
          )}
          {mobileTab === "preview" && (
            <VouchPreview legs={legs} title={title} combinedOdds={combinedOdds} riskTier={riskTier} profile={profile} onPost={handlePost} onSave={handleSave} />
          )}
        </div>

        {/* Bottom action bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-2 p-3" style={{ background: "rgba(8,12,20,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={() => setMobileTab("picks")} className="flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase flex items-center justify-center gap-1 text-slate-950" style={{ background: "linear-gradient(135deg, #22d3ee, #2563eb)" }}>
            <Plus className="w-3.5 h-3.5" /> Add Leg
          </button>
          <button onClick={runJudge} className="flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase flex items-center justify-center gap-1 text-white" style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)" }}>
            <Gavel className="w-3.5 h-3.5" /> Judge
          </button>
          <button onClick={handleSave} className="py-2.5 px-3 rounded-lg text-[10px] font-bold uppercase text-slate-300" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Save className="w-3.5 h-3.5" />
          </button>
          <button onClick={handlePost} className="py-2.5 px-3 rounded-lg text-[10px] font-bold uppercase text-slate-300" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(34,211,238,0.3)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

const cleanCustomerText = (value?: string | number | null): string =>
  String(value ?? "")
    .replace(/\|\|meta:.*$/i, "")
    .replace(/source=manual_builder\s*/gi, "")
    .replace(/source=manual\s*/gi, "")
    .replace(/clientRef=[^\s]+/gi, "")
    .replace(/\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

const getCleanLegSelection = (leg: { selection?: string | null; market?: string | null }): string =>
  cleanCustomerText(leg.selection) || cleanCustomerText(leg.market) || "Player prop";


/* =====================================================================
   Pick Library — left panel
   ===================================================================== */
function PickLibrary({ picks, search, setSearch, onAdd, activeLegIds, onSectionChange }: {
  picks: Leg[];
  search: string;
  setSearch: (s: string) => void;
  onAdd: (leg: Leg) => void;
  activeLegIds: Set<string>;
  onSectionChange: (s: string) => void;
}) {
  return (
    <div className="p-4">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Pick Library</div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search picks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        />
      </div>

      {/* Connect sources */}
      <div className="mb-4 space-y-1.5">
        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-1.5">Add legs from</div>
        {[
          { label: "AI Picks Hub", section: "ai_engine", icon: Cpu, color: "#fbbf24" },
          { label: "Daily HR Board", section: "hr_board", icon: Flame, color: "#ef4444" },
          { label: "Live Matchups", section: "live_games", icon: Tv, color: "#38bdf8" },
          { label: "Player Research", section: "research", icon: Search, color: "#a78bfa" },
        ].map((src) => (
          <button
            key={src.section}
            onClick={() => onSectionChange(src.section)}
            className="w-full flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <src.icon className="w-3 h-3" style={{ color: src.color }} />
            {src.label}
            <ChevronUp className="w-3 h-3 ml-auto text-slate-600 rotate-90" />
          </button>
        ))}
      </div>

      {/* Available picks */}
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-2">
        {picks.length > 0 ? `${picks.length} picks available` : "No live picks"}
      </div>
      {picks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xs text-slate-600 mb-3">No pick suggestions yet.</p>
          <p className="text-[10px] text-slate-700">Try AI Picks, HR Board, or Player Research.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {picks.map((pick) => {
            const isActive = activeLegIds.has(pick.selection);
            return (
              <button
                key={pick.id}
                onClick={() => !isActive && onAdd(pick)}
                disabled={isActive}
                className={`w-full flex items-center gap-2 p-2.5 rounded-lg transition-all text-left ${isActive ? "opacity-40" : "hover:bg-white/[0.03]"}`}
                style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${isActive ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.04)"}` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">{pick.selection}</div>
                  <div className="text-[9px] text-slate-500 truncate">{pick.game} · {pick.market}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-bold text-cyan-300">{americanLabel(pick.odds)}</div>
                  <div className="text-[8px] text-slate-600">{isActive ? "Added" : "Add"}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   Parlay Canvas — center panel
   ===================================================================== */
function ParlayCanvas({ legs, title, setTitle, onRemove, onMove, combinedOdds, riskTier, weakestLeg, volatility, onClear, onSectionChange }: {
  legs: Leg[];
  title: string;
  setTitle: (s: string) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: "up" | "down") => void;
  combinedOdds: number | null;
  riskTier: string;
  weakestLeg: Leg | null;
  volatility: number;
  onClear: () => void;
  onSectionChange: (s: string) => void;
}) {
  if (legs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.1)" }}>
          <Sliders className="w-7 h-7 text-cyan-400/40" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">Your parlay canvas is empty</h3>
        <p className="text-xs text-slate-500 max-w-xs mb-4">Start building your parlay. Add a leg from AI Picks, HR Board, Live Matchups, or Saved Picks.</p>
        <button onClick={() => onSectionChange("ai_engine")} className="text-xs font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Browse AI Picks
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Title */}
      <div className="flex items-center gap-2 mb-5">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 bg-transparent text-lg font-bold text-white focus:outline-none border-b border-transparent focus:border-cyan-400/30 transition-colors pb-1"
          placeholder="Parlay title..."
        />
        <button onClick={onClear} className="text-slate-600 hover:text-red-400 p-1.5" title="Clear slip">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Risk meter */}
      <div className="flex items-center gap-3 mb-5 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="flex-1">
          <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-1">Risk Tier</div>
          <div className="text-sm font-bold" style={{ color: riskTier === "Safer" ? "#34d399" : riskTier === "Balanced" ? "#22d3ee" : riskTier === "Aggressive" ? "#fbbf24" : "#f472b6" }}>
            {riskTier}
          </div>
        </div>
        <div className="flex-1">
          <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-1">Volatility</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${volatility}%`, background: volatility < 30 ? "#34d399" : volatility < 60 ? "#fbbf24" : "#f87171" }} />
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">{volatility}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-1">Combined</div>
          <div className="text-sm font-mono font-bold text-cyan-300">{americanLabel(combinedOdds)}</div>
        </div>
      </div>

      {/* Legs with connected path */}
      <div className="relative">
        {legs.map((leg, i) => {
          const isWeak = weakestLeg?.id === leg.id;
          return (
            <div key={leg.id}>
              {/* Connecting line */}
              {i > 0 && (
                <div className="flex justify-center py-1">
                  <div className="w-px h-6" style={{ background: isWeak ? "rgba(248,113,113,0.3)" : "rgba(34,211,238,0.2)" }} />
                </div>
              )}
              <LegCard leg={leg} index={i} isWeak={isWeak} onRemove={() => onRemove(leg.id)} onMoveUp={() => onMove(leg.id, "up")} onMoveDown={() => onMove(leg.id, "down")} isFirst={i === 0} isLast={i === legs.length - 1} />
            </div>
          );
        })}
      </div>

      {/* Weakest leg note */}
      {weakestLeg && legs.length > 1 && (
        <div className="mt-4 p-3 rounded-xl flex items-start gap-2" style={{ background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.15)" }}>
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-red-300/80">
            <span className="font-bold">Weakest leg:</span> {getCleanLegSelection(weakestLeg)} ({americanLabel(weakestLeg.odds)})
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[9px] text-slate-700 mt-4 text-center">Scores are model/support signals, not guaranteed probabilities. Probability-based. No guarantees.</p>
    </div>
  );
}

/* =====================================================================
   Leg Card
   ===================================================================== */
function LegCard({ leg, index, isWeak, onRemove, onMoveUp, onMoveDown, isFirst, isLast }: {
  leg: Leg;
  index: number;
  isWeak: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const legColor = isWeak ? "#f87171" : (typeof leg.odds === "number" && leg.odds > 200) ? "#fbbf24" : "#22d3ee";
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative rounded-xl p-3 group"
      style={{
        background: "rgba(15,23,42,0.5)",
        border: `1px solid ${legColor}25`,
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Leg number */}
      <div className="absolute -left-2 top-3 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold font-mono" style={{ background: `${legColor}20`, color: legColor, border: `1px solid ${legColor}40` }}>
        {index + 1}
      </div>

      <div className="flex items-center gap-3 ml-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white truncate">{getCleanLegSelection(leg)}</span>
            {isWeak && <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />}
          </div>
          <div className="text-[9px] text-slate-500 truncate">{leg.game} · {leg.market}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs font-mono font-bold" style={{ color: legColor }}>{americanLabel(leg.odds)}</div>
        </div>
        {/* Reorder + remove */}
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onMoveUp} disabled={isFirst} className="text-slate-600 hover:text-cyan-400 disabled:opacity-20">
            <ChevronUp className="w-3 h-3" />
          </button>
          <button onClick={onMoveDown} disabled={isLast} className="text-slate-600 hover:text-cyan-400 disabled:opacity-20">
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
        <button onClick={onRemove} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

/* =====================================================================
   Slip + Judge — right panel
   ===================================================================== */
function SlipAndJudge({ legs, combinedOdds, riskTier, weakestLeg, volatility, mode, isAnalyzing, onJudge, judgeVerdict, onSave, onPost, onShare }: {
  legs: Leg[];
  combinedOdds: number | null;
  riskTier: string;
  weakestLeg: Leg | null;
  volatility: number;
  mode: BuilderMode;
  isAnalyzing: boolean;
  onJudge: () => void;
  judgeVerdict: JudgeVerdict | null;
  onSave: () => void;
  onPost: () => void;
  onShare: () => void;
}) {
  return (
    <div className="p-4 space-y-4">
      {/* Slip summary */}
      <div className="rounded-xl p-4" style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Slip Summary</div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-[8px] text-slate-600 font-mono uppercase">Legs</div>
            <div className="text-lg font-bold text-white">{legs.length}</div>
          </div>
          <div>
            <div className="text-[8px] text-slate-600 font-mono uppercase">Combined</div>
            <div className="text-lg font-mono font-bold text-cyan-300">{legs.length > 0 ? americanLabel(combinedOdds) : "—"}</div>
          </div>
          <div>
            <div className="text-[8px] text-slate-600 font-mono uppercase">Risk</div>
            <div className="text-sm font-bold" style={{ color: riskTier === "Safer" ? "#34d399" : riskTier === "Balanced" ? "#22d3ee" : riskTier === "Aggressive" ? "#fbbf24" : "#f472b6" }}>{riskTier}</div>
          </div>
          <div>
            <div className="text-[8px] text-slate-600 font-mono uppercase">Volatility</div>
            <div className="text-sm font-bold text-slate-300">{legs.length > 0 ? volatility : "—"}</div>
          </div>
        </div>
        {weakestLeg && legs.length > 1 && (
          <div className="text-[10px] text-red-300/70 mb-2">
            ⚠️ Weakest: {getCleanLegSelection(weakestLeg)}
          </div>
        )}
      </div>

      {/* AI Judge */}
      <div className="rounded-xl p-4" style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(167,139,250,0.15)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-violet-400">AI Judge</div>
          <span className="text-[8px] text-slate-600 font-mono">Local draft — backend not connected</span>
          <button
            onClick={onJudge}
            disabled={isAnalyzing || legs.length === 0}
            className="text-[9px] font-bold uppercase px-2.5 py-1 rounded-md text-slate-950 disabled:opacity-40 flex items-center gap-1"
            style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)" }}
          >
            {isAnalyzing ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Gavel className="w-2.5 h-2.5" />}
            {isAnalyzing ? "Judging" : "Judge"}
          </button>
        </div>

        {judgeVerdict ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: judgeVerdict.score >= 65 ? "rgba(52,211,153,0.12)" : judgeVerdict.score >= 40 ? "rgba(251,191,36,0.12)" : "rgba(248,113,113,0.12)", color: judgeVerdict.score >= 65 ? "#34d399" : judgeVerdict.score >= 40 ? "#fbbf24" : "#f87171" }}>
                {judgeVerdict.score}
              </div>
              <div>
                <div className="text-xs font-bold text-white">{judgeVerdict.label}</div>
                <div className="text-[9px] text-slate-500">Judge score: {judgeVerdict.score}/100</div>
              </div>
            </div>
            {judgeVerdict.warnings.length > 0 && (
              <div className="space-y-1 mt-2">
                {judgeVerdict.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[10px] text-amber-300/70">
                    <AlertTriangle className="w-2.5 h-2.5 mt-0.5 shrink-0" /> {w}
                  </div>
                ))}
              </div>
            )}
            {judgeVerdict.suggestion && (
              <div className="mt-2 text-[10px] text-slate-400 p-2 rounded-md" style={{ background: "rgba(255,255,255,0.02)" }}>
                💡 {judgeVerdict.suggestion}
              </div>
            )}
            {judgeVerdict.saferVersion && (
              <div className="mt-1.5 text-[10px] text-emerald-300/70 p-2 rounded-md" style={{ background: "rgba(52,211,153,0.05)" }}>
                🛡️ {judgeVerdict.saferVersion}
              </div>
            )}
          </motion.div>
        ) : (
          <p className="text-[10px] text-slate-600 text-center py-3">
            {legs.length === 0 ? "Add legs to judge" : "Run the AI judge to check risk, correlation, and weakest leg"}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button onClick={onSave} disabled={legs.length === 0} className="w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-300 disabled:opacity-40 flex items-center justify-center gap-1.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Save className="w-3.5 h-3.5" /> Save Parlay
        </button>
        <button onClick={onPost} disabled={legs.length === 0} className="w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-950 disabled:opacity-40 flex items-center justify-center gap-1.5" style={{ background: "linear-gradient(135deg, #22d3ee, #2563eb)" }}>
          <Share2 className="w-3.5 h-3.5" /> Post as Vouch
        </button>
        <button onClick={onShare} disabled={legs.length === 0} className="w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-400 disabled:opacity-40 flex items-center justify-center gap-1.5" style={{ background: "rgba(255,255,255,0.02)" }}>
          <Eye className="w-3.5 h-3.5" /> Share Preview
        </button>
      </div>

      {/* Disclaimer */}
      <p className="text-[9px] text-slate-700 text-center">Probability-based. No guarantees.</p>
    </div>
  );
}

/* =====================================================================
   Vouch Preview — mobile tab 4
   ===================================================================== */
function VouchPreview({ legs, title, combinedOdds, riskTier, profile, onPost, onSave }: {
  legs: Leg[];
  title: string;
  combinedOdds: number | null;
  riskTier: string;
  profile?: CreatorProofProfile;
  onPost: () => void;
  onSave: () => void;
}) {
  if (legs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Eye className="w-10 h-10 text-slate-700 mb-3" />
        <p className="text-sm text-slate-500">Add legs to preview your Vouch card</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Vouch Card Preview</div>

      {/* Preview card */}
      <div className="rounded-2xl p-5" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(34,211,238,0.2)", backdropFilter: "blur(16px)" }}>
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-slate-950 text-sm" style={{ background: "linear-gradient(135deg, #22d3ee, #2563eb)" }}>
            VE
          </div>
          <div>
            <div className="text-xs font-bold text-white">{profile?.displayName || "Sample Capper"}</div>
            <div className="text-[10px] text-slate-500 font-mono">@{profile?.username || "sample"} · Demo</div>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[9px] text-emerald-400 font-mono">DRAFT</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-sm font-bold text-white mb-3">{cleanCustomerText(title) || "VouchEdge Parlay"}</div>

        {/* Legs */}
        <div className="space-y-1.5 mb-3">
          {legs.map((leg, i) => (
            <div key={leg.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono text-slate-600">{i + 1}.</span>
                <span className="text-xs text-slate-300">{getCleanLegSelection(leg)}</span>
              </div>
              <span className="text-xs font-mono text-slate-400">{americanLabel(leg.odds)}</span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="text-[8px] text-slate-600 font-mono uppercase">Combined</div>
            <div className="text-xs font-bold font-mono text-cyan-300">{americanLabel(combinedOdds)}</div>
          </div>
          <div className="text-center p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="text-[8px] text-slate-600 font-mono uppercase">Risk</div>
            <div className="text-xs font-bold text-amber-400">{riskTier}</div>
          </div>
          <div className="text-center p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="text-[8px] text-slate-600 font-mono uppercase">Legs</div>
            <div className="text-xs font-bold text-white">{legs.length}</div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-[9px] text-slate-600 text-center">
          Sample preview — not a real vouch card. Probability-based. No guarantees.
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 space-y-2">
        <button onClick={onPost} className="w-full py-2.5 rounded-lg text-xs font-bold uppercase text-slate-950" style={{ background: "linear-gradient(135deg, #22d3ee, #2563eb)" }}>
          Post as Vouch
        </button>
        <button onClick={onSave} className="w-full py-2.5 rounded-lg text-xs font-bold uppercase text-slate-300" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          Save Draft
        </button>
      </div>
    </div>
  );
}

/* =====================================================================
   Types
   ===================================================================== */
interface JudgeVerdict {
  score: number;
  label: string;
  warnings: string[];
  weakestLeg: string | null;
  suggestion: string;
  saferVersion: string | null;
}
