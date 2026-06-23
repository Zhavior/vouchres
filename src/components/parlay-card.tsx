/**
 * ParlayCard — dynamic parlay with neon leg connectors.
 * Legs connected by zig-zag lines. Status dots glow per leg result.
 */
import { motion } from "framer-motion";
import { Layers, Bookmark, AlertTriangle, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ParlayLegData {
  id: string;
  label: string;
  market: string;
  status: "pending" | "won" | "lost" | "push" | "void";
}

const LEG_COLORS: Record<string, string> = {
  pending: "var(--ve-accent)",
  won: "var(--ve-success)",
  lost: "var(--ve-danger)",
  push: "var(--ve-warning)",
  void: "var(--ve-text-dim)",
};

export function ParlayCard({
  legs,
  combinedConfidence,
  riskTier,
  estimatedPayout,
  status,
  result,
  onSave,
  className,
}: {
  legs: ParlayLegData[];
  combinedConfidence: number;
  riskTier: string;
  estimatedPayout?: number;
  status: string;
  result: string;
  onSave?: () => void;
  className?: string;
}) {
  const hasLost = legs.some(l => l.status === "lost");
  const allWon = legs.every(l => l.status === "won" || l.status === "void");

  return (
    <motion.div whileHover={{ y: -2 }} className={cn("ve-card ve-card-hover p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" style={{ color: "var(--ve-accent)" }} />
          <span className="text-sm font-bold">{legs.length}-Leg Parlay</span>
        </div>
        <span className="ve-badge" style={{ color: "var(--ve-purple)", borderColor: "var(--ve-purple)" }}>
          {riskTier.toUpperCase()}
        </span>
      </div>

      {/* Legs with neon connectors */}
      <div className="space-y-0">
        {legs.map((leg, i) => (
          <div key={leg.id} className="flex items-stretch">
            {/* Connector line + dot */}
            <div className="flex flex-col items-center mr-3 w-6 flex-shrink-0">
              <div className="w-3 h-3 rounded-full mt-3 ve-pulse" style={{ background: LEG_COLORS[leg.status], boxShadow: `0 0 8px ${LEG_COLORS[leg.status]}` }} />
              {i < legs.length - 1 && (
                <div className="w-px flex-1 my-1" style={{ background: `linear-gradient(to bottom, ${LEG_COLORS[leg.status]}, ${LEG_COLORS[legs[i+1].status]})` }} />
              )}
            </div>
            {/* Leg content */}
            <div className="flex-1 py-2 px-3 rounded-lg mb-1" style={{ background: "rgba(5,11,24,0.4)", border: "1px solid var(--ve-card-border)" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium truncate">{leg.label}</span>
                <span className="text-[9px] font-mono uppercase ml-2" style={{ color: LEG_COLORS[leg.status] }}>{leg.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Warning */}
      {hasLost && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px]" style={{ color: "var(--ve-danger)" }}>
          <AlertTriangle className="w-3 h-3" /> Parlay lost — at least one leg failed
        </div>
      )}
      {allWon && status === "final" && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px]" style={{ color: "var(--ve-success)" }}>
          <Shield className="w-3 h-3" /> All legs verified — parlay WON
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: "var(--ve-card-border)" }}>
        <div>
          <div className="text-[9px] font-mono uppercase" style={{ color: "var(--ve-text-dim)" }}>Combined Trust</div>
          <div className="text-lg font-bold font-mono" style={{ color: "var(--ve-accent)" }}>{Math.round(combinedConfidence * 100)}%</div>
        </div>
        {estimatedPayout && (
          <div className="text-right">
            <div className="text-[9px] font-mono uppercase" style={{ color: "var(--ve-text-dim)" }}>Est. Payout</div>
            <div className="text-lg font-bold font-mono" style={{ color: "var(--ve-success)" }}>{estimatedPayout}x</div>
          </div>
        )}
      </div>

      {onSave && status === "saved" && (
        <button onClick={onSave} className="ve-button w-full text-xs mt-3">
          <Bookmark className="w-3.5 h-3.5 inline mr-1" /> Save Parlay
        </button>
      )}
    </motion.div>
  );
}
