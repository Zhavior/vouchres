/**
 * AI Pick Card — premium HR pick card for Today's AI Picks page.
 * Uses the existing VouchEdge design system (CSS variables).
 */
import { Zap, Layers, Shield, Share2, ChevronRight, AlertTriangle } from "lucide-react";
import type { AIPickData } from "@/services/mlb";
import { cn } from "@/lib/utils";

export function AIPickCard({ pick, onViewBreakdown, onAddToParlay, onVouchTail, variant }: {
  pick: AIPickData;
  onViewBreakdown: () => void;
  onAddToParlay?: () => void;
  onVouchTail?: () => void;
  variant?: "top" | "undervalued" | "watchlist";
}) {
  const confColor = pick.scores.hrConfidenceScore >= 80 ? "var(--ve-success)" : pick.scores.hrConfidenceScore >= 65 ? "var(--ve-accent)" : "var(--ve-warning)";
  const riskColor = pick.riskTier === "LOW" ? "var(--ve-success)" : pick.riskTier === "MEDIUM" ? "var(--ve-accent)" : pick.riskTier === "HIGH" ? "var(--ve-warning)" : "var(--ve-danger)";

  const handleShareX = () => {
    const caption = `Today's VouchEdge AI HR read:\n\n${pick.playerName} ${pick.confidenceLabel}\nAI Confidence: ${pick.scores.hrConfidenceScore}%\nValue Score: ${pick.scores.valueScore}\nMatchup: ${pick.team} vs ${pick.opponent}\n\nPosted before first pitch. Graded after final.\n\nProbability-based. No guarantees.\n#VouchEdge #MLBPicks #ProofOverHype`;
    navigator.clipboard.writeText(caption);
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`, "_blank");
  };

  return (
    <div className="ve-card ve-card-hover p-4">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: "var(--ve-badge-bg)", border: "1px solid var(--ve-card-border)", color: "var(--ve-accent)" }}>
          {pick.playerName.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold truncate">{pick.playerName}</h3>
          <p className="text-[11px]" style={{ color: "var(--ve-text-muted)" }}>{pick.team} vs {pick.opponent}</p>
          <p className="text-[10px]" style={{ color: "var(--ve-text-dim)" }}>vs {pick.opposingPitcher}</p>
        </div>
        {variant === "undervalued" && pick.valueLabel && (
          <span className="ve-badge whitespace-nowrap" style={{ color: "var(--ve-purple)" }}>{pick.valueLabel}</span>
        )}
        {variant === "watchlist" && (
          <span className="ve-badge whitespace-nowrap" style={{ color: "var(--ve-warning)" }}>WATCH</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        <ScoreStat label="HR CONF" value={pick.scores.hrConfidenceScore} color={confColor} />
        <ScoreStat label="TRUST" value={pick.scores.trustScore} color="var(--ve-accent)" />
        <ScoreStat label="VALUE" value={pick.scores.valueScore} color="var(--ve-purple)" />
      </div>

      <div className="mt-2.5">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="font-mono uppercase" style={{ color: "var(--ve-text-dim)" }}>{pick.confidenceLabel}</span>
          <span className="font-bold font-mono" style={{ color: confColor }}>{pick.scores.hrConfidenceScore}/100</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--ve-card-border)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pick.scores.hrConfidenceScore}%`, background: confColor, boxShadow: `0 0 8px ${confColor}` }} />
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="ve-badge" style={{ color: riskColor, borderColor: riskColor + "40", background: riskColor + "15" }}>{pick.riskTier} RISK</span>
        {pick.estimatedHRProbability && <span className="text-[9px] font-mono" style={{ color: "var(--ve-text-dim)" }}>~{(pick.estimatedHRProbability * 100).toFixed(1)}% HR prob</span>}
      </div>

      {pick.aiReasoning && (
        <div className="mt-2.5 p-2 rounded-lg" style={{ background: "rgba(5,11,24,0.4)", border: "1px solid var(--ve-card-border)" }}>
          <div className="flex items-start gap-1.5">
            <Zap className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "var(--ve-accent)" }} />
            <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: "var(--ve-text-muted)" }}>{pick.aiReasoning}</p>
          </div>
        </div>
      )}

      {pick.redFlags && pick.redFlags.length > 0 && (
        <div className="mt-2 p-2 rounded-lg" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <div className="flex items-center gap-1 mb-1">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" style={{ color: "var(--ve-danger)" }} />
            <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: "var(--ve-danger)" }}>Risk Factors</span>
          </div>
          {pick.redFlags.slice(0, 2).map((flag, i) => (
            <p key={i} className="text-[10px] leading-relaxed" style={{ color: "var(--ve-text-muted)" }}>• {flag}</p>
          ))}
        </div>
      )}

      {variant === "watchlist" && (
        <div className="mt-1.5 text-[10px] italic" style={{ color: "var(--ve-warning)" }}>Watchlist, not safe pick</div>
      )}

      <div className="mt-3 flex gap-1.5">
        <button onClick={onViewBreakdown} className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1" style={{ background: "var(--ve-badge-bg)", color: "var(--ve-accent)", border: "1px solid var(--ve-badge-border)" }}>
          <ChevronRight className="w-3 h-3" /> Breakdown
        </button>
        {onAddToParlay && (
          <button onClick={onAddToParlay} className="px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all" style={{ background: "rgba(5,11,24,0.4)", color: "var(--ve-text-muted)", border: "1px solid var(--ve-card-border)" }}>
            <Layers className="w-3 h-3" />
          </button>
        )}
        {onVouchTail && (
          <button onClick={onVouchTail} className="px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all" style={{ background: "rgba(5,11,24,0.4)", color: "var(--ve-text-muted)", border: "1px solid var(--ve-card-border)" }}>
            <Shield className="w-3 h-3" />
          </button>
        )}
        <button onClick={handleShareX} className="px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all" style={{ background: "rgba(5,11,24,0.4)", color: "var(--ve-text-muted)", border: "1px solid var(--ve-card-border)" }}>
          <Share2 className="w-3 h-3" />
        </button>
      </div>
      <p className="mt-2 text-[9px] text-center" style={{ color: "var(--ve-text-dim)" }}>AI research tool — not financial advice. For entertainment.</p>
    </div>
  );
}

function ScoreStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: "rgba(5,11,24,0.4)", border: "1px solid var(--ve-card-border)" }}>
      <div className="text-[9px] font-mono uppercase" style={{ color: "var(--ve-text-dim)" }}>{label}</div>
      <div className="text-sm font-bold font-mono" style={{ color }}>{value}</div>
    </div>
  );
}
