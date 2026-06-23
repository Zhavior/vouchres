import { cn } from "@/lib/utils";
import { ResultBadge } from "./result-badge";
import { timeAgo } from "@/lib/utils";
import type { PickResult } from "@/types";

export interface ResultCardProps {
  market: string;
  playerName: string;
  opponent: string;
  result: PickResult;
  actualValue?: number;
  line?: number;
  gradedAt?: string | null;
  className?: string;
}

export function ResultCard({
  market,
  playerName,
  opponent,
  result,
  actualValue,
  line,
  gradedAt,
  className,
}: ResultCardProps) {
  return (
    <div
      className={cn(
        "glass-card p-3 flex items-center justify-between gap-3",
        result === "won" && "border-success/40",
        result === "lost" && "border-danger/40",
        className
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-100 truncate">{playerName}</span>
          <span className="text-[10px] font-mono text-electric-300 uppercase">{market}</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          vs {opponent}
          {line !== undefined && (
            <span className="font-mono"> · line {line}</span>
          )}
          {actualValue !== undefined && (
            <span className="font-mono"> · actual {actualValue}</span>
          )}
        </div>
        {gradedAt && (
          <div className="text-[9px] text-slate-500 mt-0.5">graded {timeAgo(gradedAt)}</div>
        )}
      </div>
      <ResultBadge result={result} />
    </div>
  );
}
