import { useQuery } from "@tanstack/react-query";
import { picksApi, type Pick } from "@/services/picks";
import { ResultProofCard } from "@/components/result-proof-card";
import { StatusBadge } from "@/components/badges";
import { EmptyStateCard, LoadingCard, ErrorCard } from "@/components/ui-states";
import { Trophy, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function PickLedgerPage() {
  const picks = useQuery({ queryKey: ["picks", "my"], queryFn: () => picksApi.my({ limit: 100 }), staleTime: 15_000 });
  const record = useQuery({ queryKey: ["picks", "results", "my"], queryFn: () => picksApi.results(), staleTime: 30_000 });

  const picksList = picks.data?.data ?? [];
  const r = record.data;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold flex items-center gap-2"><Trophy className="w-5 h-5" style={{ color: "var(--ve-accent)" }} /> Results & Proof</h1>
        <p className="text-xs mt-1" style={{ color: "var(--ve-text-muted)" }}>Verified results. Server-graded. No fake wins.</p>
      </div>

      {/* Record summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: "Won", value: r?.record.won ?? 0, color: "var(--ve-success)" },
          { label: "Lost", value: r?.record.lost ?? 0, color: "var(--ve-danger)" },
          { label: "Push", value: r?.record.push ?? 0, color: "var(--ve-warning)" },
          { label: "Void", value: r?.record.void ?? 0, color: "var(--ve-text-dim)" },
          { label: "Win Rate", value: r ? `${(r.record.win_rate * 100).toFixed(0)}%` : "—", color: "var(--ve-accent)" },
        ].map(s => (
          <div key={s.label} className="ve-card p-3 text-center">
            <div className="text-[10px] font-mono uppercase" style={{ color: "var(--ve-text-dim)" }}>{s.label}</div>
            <div className="text-xl font-bold font-mono mt-1" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Integrity */}
      <div className="ve-card p-3 flex items-center gap-3 border-l-2" style={{ borderLeftColor: "var(--ve-accent)" }}>
        <Lock className="w-4 h-4 flex-shrink-0" style={{ color: "var(--ve-accent)" }} />
        <p className="text-xs" style={{ color: "var(--ve-text-muted)" }}>Picks lock at game start. Results computed server-side from MLB box scores. You cannot fake results.</p>
      </div>

      {/* Pick list */}
      {picks.isLoading ? <div className="space-y-2">{[1,2,3].map(i => <LoadingCard key={i} lines={2} />)}</div>
      : picks.isError ? <ErrorCard onRetry={() => picks.refetch()} />
      : picksList.length > 0 ? <div className="space-y-2">{picksList.map((p: Pick) => (
        <div key={p.id} className="ve-card p-3 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold font-mono uppercase">{p.market}</span>
              <span className="text-[10px] font-mono" style={{ color: "var(--ve-text-dim)" }}>line {p.line}</span>
              <StatusBadge status={p.status} />
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--ve-text-muted)" }}>Game #{p.game_id} · Player #{p.player_id}</div>
          </div>
          {p.status === "final" ? <StatusBadge status={p.result} /> : <span className="text-[10px] font-mono" style={{ color: "var(--ve-text-dim)" }}>{p.status === "locked" ? "🔒 Locked" : "Pending"}</span>}
        </div>
      ))}</div>
      : <EmptyStateCard title="No picks yet" description="Save your first pick from Trust Picks AI to start building proof." icon={Trophy} />}
    </div>
  );
}
