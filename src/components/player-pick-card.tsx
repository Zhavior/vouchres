import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatProbability, formatEdge, timeAgo } from "@/lib/utils";
import type { ModelScore, Market } from "@/types";
import { RiskBadge } from "./risk-badge";
import { ConfidenceBar } from "./confidence-bar";
import { Bookmark, Layers, Zap } from "lucide-react";

const MARKET_LABELS: Record<Market, string> = {
  hr: "Home Run",
  hit: "Hit",
  rbi: "RBI",
  run: "Run",
  tb: "Total Bases",
};

const MARKET_SHORT: Record<Market, string> = {
  hr: "HR",
  hit: "HIT",
  rbi: "RBI",
  run: "RUN",
  tb: "TB",
};

export interface PlayerPickCardProps {
  score: ModelScore;
  playerName?: string;
  playerTeam?: string;
  opponent?: string;
  pitcherMatchup?: string;
  headshotUrl?: string;
  onSave?: () => void;
  onAddToParlay?: () => void;
  saved?: boolean;
  className?: string;
}

export function PlayerPickCard({
  score,
  playerName = "Player",
  playerTeam = "—",
  opponent = "—",
  pitcherMatchup,
  headshotUrl,
  onSave,
  onAddToParlay,
  saved,
  className,
}: PlayerPickCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "glass-card glass-card-hover p-4 relative overflow-hidden",
        className
      )}
    >
      {/* Edge glow strip */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-electric-500/60 to-transparent" />

      <div className="flex items-start gap-3">
        {/* Headshot */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-xl bg-navy-700 border border-electric-500/20 overflow-hidden flex items-center justify-center">
            {headshotUrl ? (
              <img src={headshotUrl} alt={playerName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-electric-500/50 text-lg font-bold">
                {playerName.charAt(0)}
              </span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-navy-900 border border-electric-500/30 text-[9px] font-bold text-electric-300 font-mono">
            {MARKEK_SHORT(score.market)}
          </div>
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-100 truncate">{playerName}</h3>
            <span className="text-[10px] text-slate-500 font-mono">{playerTeam}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            vs <span className="text-slate-300">{opponent}</span>
            {pitcherMatchup && (
              <span className="text-slate-500"> · {pitcherMatchup}</span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <RiskBadge tier={score.risk_tier} />
            <span className="text-[9px] text-slate-500 font-mono">
              {score.model_version}
            </span>
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="PROB" value={formatProbability(score.probability)} accent="electric" />
        <Stat label="EDGE" value={formatEdge(score.edge)} accent={score.edge >= 0 ? "success" : "danger"} />
        <Stat label="MARKET" value={MARKEK_SHORT(score.market)} accent="slate" />
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
          <span className="uppercase tracking-wider">Confidence</span>
        </div>
        <ConfidenceBar value={score.confidence} />
      </div>

      {score.reasoning && (
        <div className="mt-3 p-2 rounded-lg bg-navy-900/60 border border-navy-700">
          <div className="flex items-start gap-1.5">
            <Zap className="w-3 h-3 text-electric-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-300 leading-relaxed">{score.reasoning}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={onSave}
          disabled={saved}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
            saved
              ? "bg-success/10 text-success border border-success/40"
              : "bg-electric-500/10 text-electric-300 border border-electric-500/40 hover:bg-electric-500/20 hover:shadow-glow"
          )}
        >
          <Bookmark className="w-3.5 h-3.5" />
          {saved ? "Saved" : "Save Pick"}
        </button>
        <button
          onClick={onAddToParlay}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 border border-navy-600 hover:border-electric-500/40 hover:text-electric-300 transition-all"
        >
          <Layers className="w-3.5 h-3.5" />
          Parlay
        </button>
      </div>
    </motion.div>
  );
}

function MARKEK_SHORT(m: Market): string {
  return MARKET_SHORT[m];
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "electric" | "success" | "danger" | "slate";
}) {
  const colors = {
    electric: "text-electric-300",
    success: "text-success",
    danger: "text-danger",
    slate: "text-slate-300",
  };
  return (
    <div className="rounded-lg bg-navy-900/60 border border-navy-700 px-2 py-1.5">
      <div className="text-[9px] text-slate-500 font-mono tracking-wider">{label}</div>
      <div className={cn("text-sm font-bold font-mono", colors[accent])}>{value}</div>
    </div>
  );
}
