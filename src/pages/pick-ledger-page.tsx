import { useQuery } from "@tanstack/react-query";
import { picksApi, type Pick } from "@/services/picks";
import { ResultCard } from "@/components/result-card";
import { ResultBadge } from "@/components/result-badge";
import { EmptyState } from "@/components/empty-state";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { ErrorState } from "@/components/error-state";
import { Trophy, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  saved: "SAVED",
  locked: "LOCKED",
  grading: "GRADING",
  final: "FINAL",
};

const STATUS_COLORS: Record<string, string> = {
  saved: "text-electric-300",
  locked: "text-warning",
  grading: "text-warning",
  final: "text-slate-400",
};

export function PickLedgerPage() {
  const picks = useQuery({
    queryKey: ["picks", "my"],
    queryFn: () => picksApi.my({ limit: 100 }),
    staleTime: 15_000,
  });

  const record = useQuery({
    queryKey: ["picks", "results", "my"],
    queryFn: () => picksApi.results(),
    staleTime: 30_000,
  });

  const picksList = picks.data?.data ?? [];
  const recordData = record.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Trophy className="w-5 h-5 text-electric-400" />
          Pick Ledger
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          The core business system. Picks save before game start, lock at first pitch, and grade
          automatically. Results are server-verified — you cannot fake them.
        </p>
      </div>

      {/* Record summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Won", value: recordData?.record.won ?? 0, color: "text-success" },
          { label: "Lost", value: recordData?.record.lost ?? 0, color: "text-danger" },
          { label: "Push", value: recordData?.record.push ?? 0, color: "text-warning" },
          { label: "Void", value: recordData?.record.void ?? 0, color: "text-slate-400" },
          {
            label: "Win Rate",
            value: recordData ? `${(recordData.record.win_rate * 100).toFixed(0)}%` : "—",
            color: "text-electric-300",
          },
        ].map((s) => (
          <div key={s.label} className="glass-card p-3 text-center">
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
              {s.label}
            </div>
            <div className={cn("mt-1 text-2xl font-bold font-mono", s.color)}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Streak + total */}
      {recordData && (
        <div className="glass-card p-3 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-400">
              Total picks: <span className="text-slate-100 font-mono font-bold">{recordData.record.total}</span>
            </span>
            <span className="text-slate-400">
              Current streak: <span className="text-electric-300 font-mono font-bold">{recordData.record.current_streak}W</span>
            </span>
          </div>
        </div>
      )}

      {/* Integrity reminder */}
      <div className="glass-card p-3 border-electric-500/20 flex items-center gap-3">
        <Lock className="w-4 h-4 text-electric-400 shrink-0" />
        <p className="text-xs text-slate-400">
          Picks <span className="text-slate-200">lock at scheduled first pitch</span>. After lock,
          edits and deletes are blocked. Results are computed server-side from MLB box scores.
        </p>
      </div>

      {/* Pick list */}
      {picks.isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <LoadingSkeleton key={i} lines={2} className="glass-card p-3" />
          ))}
        </div>
      ) : picks.isError ? (
        <ErrorState onRetry={() => picks.refetch()} />
      ) : picksList.length > 0 ? (
        <div className="space-y-2">
          {picksList.map((pick: Pick) => (
            <div key={pick.id} className="glass-card p-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-100 font-mono uppercase">
                    {pick.market}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    line {pick.line}
                  </span>
                  <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded bg-navy-900",
                    STATUS_COLORS[pick.status])}>
                    {STATUS_LABELS[pick.status]}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Game #{pick.game_id} · Player #{pick.player_id}
                </div>
              </div>
              {pick.status === "final" ? (
                <ResultBadge result={pick.result} />
              ) : (
                <span className="text-[10px] text-slate-500 font-mono">
                  {pick.status === "locked" ? "🔒 Locked" : "Pending"}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Trophy}
          title="No picks in your ledger yet"
          description="Save your first pick from the AI Picks Hub. It'll show up here with its live status."
        />
      )}
    </div>
  );
}
