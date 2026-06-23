import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Layers, AlertTriangle, Lock } from "lucide-react";
import { ResultBadge } from "./result-badge";
import { RiskBadge } from "./risk-badge";

export interface ParlayCardProps {
  legs: { id: string; label: string; market: string; status: "pending" | "won" | "lost" | "push" | "void" }[];
  combinedConfidence: number;
  riskTier: "safe" | "balanced" | "risky" | "lottery";
  estimatedPayout?: number;
  status: "saved" | "locked" | "grading" | "final";
  result: "pending" | "won" | "lost" | "void";
  onSave?: () => void;
  className?: string;
}

export function ParlayCard({
  legs,
  combinedConfidence,
  riskTier,
  estimatedPayout,
  status,
  result,
  onSave,
  className,
}: ParlayCardProps) {
  const locked = status !== "saved";
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn("glass-card glass-card-hover p-4", className)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-electric-400" />
          <span className="text-xs font-bold text-slate-100">
            {legs.length}-Leg Parlay
          </span>
        </div>
        <div className="flex items-center gap-2">
          <RiskBadge tier={riskTier === "safe" ? "low" : riskTier === "balanced" ? "medium" : riskTier === "risky" ? "high" : "lottery"} />
          {locked && (
            <Lock className="w-3 h-3 text-slate-500" />
          )}
        </div>
      </div>

      {/* Legs */}
      <div className="mt-3 space-y-1.5">
        {legs.map((leg, i) => (
          <div
            key={leg.id}
            className="flex items-center gap-2 text-xs p-2 rounded-lg bg-navy-900/60 border border-navy-700"
          >
            <span className="font-mono text-[10px] text-slate-500 w-4">{i + 1}.</span>
            <span className="flex-1 text-slate-200 truncate">{leg.label}</span>
            <span className="text-[9px] font-mono text-electric-300 uppercase">{leg.market}</span>
            <ResultBadge result={leg.status} />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-navy-700 flex items-center justify-between">
        <div>
          <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">
            Combined Confidence
          </div>
          <div className="text-lg font-bold font-mono text-electric-300">
            {(combinedConfidence * 100).toFixed(1)}%
          </div>
        </div>
        {estimatedPayout !== undefined && (
          <div className="text-right">
            <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">
              Est. Payout
            </div>
            <div className="text-lg font-bold font-mono text-success">
              {estimatedPayout.toFixed(2)}×
            </div>
          </div>
        )}
      </div>

      {/* Warning + action */}
      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-warning">
        <AlertTriangle className="w-3 h-3 shrink-0" />
        <span>Parlay wins only if every leg wins. Void legs recalculate payout.</span>
      </div>

      {!locked && onSave && (
        <button
          onClick={onSave}
          className="mt-3 w-full electric-button text-xs"
        >
          Save Parlay
        </button>
      )}
      {locked && (
        <div className="mt-3 text-center text-[10px] text-slate-500 font-mono uppercase tracking-wider">
          Locked · Awaiting grade
        </div>
      )}
    </motion.div>
  );
}
