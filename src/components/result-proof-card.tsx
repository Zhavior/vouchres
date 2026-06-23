/**
 * ResultProofCard — shows what was picked, what happened, why it won/lost.
 */
import { CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function ResultProofCard({
  market, playerName, opponent, line, actualValue, result, gradedAt, sport = "MLB",
  className,
}: {
  market: string;
  playerName: string;
  opponent: string;
  line: number;
  actualValue?: number;
  result: string;
  gradedAt?: string | null;
  sport?: string;
  className?: string;
}) {
  const won = result === "won";
  const lost = result === "lost";
  const pending = result === "pending";
  const Icon = won ? CheckCircle2 : lost ? XCircle : pending ? Clock : AlertTriangle;
  const color = won ? "var(--ve-success)" : lost ? "var(--ve-danger)" : pending ? "var(--ve-accent)" : "var(--ve-warning)";
  const sportIcon = sport === "MLB" ? "⚾" : sport === "NBA" ? "🏀" : "🎮";

  return (
    <div className={cn("ve-card p-3 flex items-center justify-between gap-3", className)}
      style={won ? { borderLeft: `3px solid var(--ve-success)` } : lost ? { borderLeft: `3px solid var(--ve-danger)` } : {}}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px]">{sportIcon}</span>
          <span className="text-sm font-bold truncate">{playerName}</span>
          <span className="ve-badge">{market.toUpperCase()}</span>
        </div>
        <div className="text-[10px] mt-0.5" style={{ color: "var(--ve-text-muted)" }}>
          vs {opponent} · Line {line}
          {actualValue !== undefined && actualValue !== null && (
            <span className="ml-2 font-mono" style={{ color: won ? "var(--ve-success)" : "var(--ve-text)" }}>
              Actual: {actualValue}
            </span>
          )}
        </div>
        {gradedAt && <div className="text-[9px] mt-0.5" style={{ color: "var(--ve-text-dim)" }}>Graded {new Date(gradedAt).toLocaleDateString()}</div>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs font-bold uppercase" style={{ color }}>{result}</span>
      </div>
    </div>
  );
}
