/**
 * TrustPickCard — premium AI pick card.
 * Shows sport, matchup, player, market, confidence, trust, risk, reasoning, actions.
 */
import { motion } from "framer-motion";
import { Sparkles, Bookmark, Layers, Zap, ArrowRight } from "lucide-react";
import { ConfidenceBadge, RiskTierBadge, SportBadge } from "@/components/badges";
import { cn } from "@/lib/utils";

export interface TrustPickData {
  player_id: number;
  player_name: string;
  team_abbr: string;
  opponent_abbr: string;
  game_id: number;
  market: string;
  line: number;
  probability: number;
  confidence: number;
  edge: number;
  risk_tier: string;
  model_version: string;
  reasoning: string;
  headshot_url?: string | null;
  venue?: string | null;
  scheduled_first_pitch?: string;
  pitcher_matchup?: string | null;
  sport?: string;
}

export function TrustPickCard({
  pick,
  onSave,
  onTail,
  onParlay,
  saved,
  className,
}: {
  pick: TrustPickData;
  onSave?: () => void;
  onTail?: () => void;
  onParlay?: () => void;
  saved?: boolean;
  className?: string;
}) {
  const probPct = Math.round(pick.probability * 100);
  const edgePct = (pick.edge * 100).toFixed(1);
  const trustLabel = pick.confidence >= 0.9 ? "Elite Trust" : pick.confidence >= 0.8 ? "Strong Trust" : pick.confidence >= 0.7 ? "Solid" : pick.confidence >= 0.6 ? "Lean" : pick.confidence >= 0.5 ? "Watchlist" : "Volatile";
  const trustColor = pick.confidence >= 0.8 ? "var(--ve-success)" : pick.confidence >= 0.6 ? "var(--ve-accent)" : "var(--ve-warning)";

  return (
    <motion.div whileHover={{ y: -3 }} className={cn("ve-card ve-card-hover p-4", className)}>
      {/* Top row */}
      <div className="flex items-start gap-3">
        {/* Headshot */}
        <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ background: "var(--ve-badge-bg)", border: "1px solid var(--ve-card-border)" }}>
          {pick.headshot_url ? (
            <img src={pick.headshot_url} alt={pick.player_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg font-bold" style={{ color: "var(--ve-accent)" }}>{pick.player_name.charAt(0)}</span>
          )}
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold truncate">{pick.player_name}</h3>
            <span className="text-[10px] font-mono" style={{ color: "var(--ve-text-dim)" }}>{pick.team_abbr}</span>
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: "var(--ve-text-muted)" }}>
            vs {pick.opponent_abbr}
            {pick.pitcher_matchup && <span style={{ color: "var(--ve-text-dim)" }}> · {pick.pitcher_matchup}</span>}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <SportBadge sport={pick.sport || "mlb"} />
            <RiskTierBadge tier={pick.risk_tier} />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <Stat label="PROB" value={`${probPct}%`} accent="var(--ve-accent)" />
        <Stat label="EDGE" value={`+${edgePct}%`} accent="var(--ve-success)" />
        <Stat label="LINE" value={pick.line.toString()} accent="var(--ve-text)" />
      </div>

      {/* Trust bar */}
      <div className="mt-3">
        <div className="flex justify-between text-[10px] mb-1">
          <span style={{ color: "var(--ve-text-dim)" }}>TRUST: {trustLabel}</span>
          <span style={{ color: trustColor }}>{Math.round(pick.confidence * 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--ve-card-border)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pick.confidence * 100}%`, background: trustColor, boxShadow: `0 0 8px ${trustColor}` }} />
        </div>
      </div>

      {/* Reasoning */}
      {pick.reasoning && (
        <div className="mt-3 p-2.5 rounded-lg flex items-start gap-1.5" style={{ background: "rgba(5,11,24,0.5)", border: "1px solid var(--ve-card-border)" }}>
          <Zap className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "var(--ve-accent)" }} />
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--ve-text-muted)" }}>{pick.reasoning}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <button onClick={onSave} disabled={saved}
          className={cn("flex-1 ve-button text-xs", saved && "opacity-50")}
          style={saved ? { background: "var(--ve-badge-bg)", border: "1px solid var(--ve-success)" } : {}}>
          <Bookmark className="w-3.5 h-3.5 inline mr-1" />
          {saved ? "Saved" : "Save"}
        </button>
        {onTail && (
          <button onClick={onTail} className="ve-button-ghost text-xs">
            Tail
          </button>
        )}
        {onParlay && (
          <button onClick={onParlay} className="ve-button-ghost text-xs">
            <Layers className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-lg p-2 text-center" style={{ background: "rgba(5,11,24,0.5)", border: "1px solid var(--ve-card-border)" }}>
      <div className="text-[9px] font-mono" style={{ color: "var(--ve-text-dim)" }}>{label}</div>
      <div className="text-sm font-bold font-mono" style={{ color: accent }}>{value}</div>
    </div>
  );
}
