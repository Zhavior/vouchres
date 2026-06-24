/**
 * ProofBuildersPanel — right rail showing the current user's verified proof stats.
 * TODO: Add endpoint /v1/leaderboard/top-cappers when available to show community leaders.
 */
import { Award } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

export function ProofBuildersPanel() {
  const me = useAuthStore((s) => s.me);

  const trustScore = me?.trust_score ?? 0;
  const vouchLevel = me?.vouch_level ?? "unverified";

  return (
    <div className="ve-card p-4" id="proof-builders-panel">
      <div className="flex items-center gap-2 mb-3">
        <Award className="w-4 h-4 text-sky-400" />
        <h3 className="font-bold text-slate-100 text-xs tracking-widest uppercase">Your Proof</h3>
      </div>

      <div className="p-3 rounded-lg border border-slate-800 space-y-2" style={{ background: "rgba(11,15,25,0.6)" }}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full border border-sky-500/30 flex items-center justify-center font-bold text-sky-400 text-sm flex-shrink-0"
            style={{ background: "var(--ve-badge-bg)" }}>
            {me?.user?.username?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-200 text-xs truncate">
              {me?.user?.username ? `@${me.user.username}` : "Guest"}
            </div>
            <div className="text-slate-400 text-[10px] capitalize">{vouchLevel}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center text-xs mt-2">
          <div className="p-1.5 rounded" style={{ background: "var(--ve-badge-bg)" }}>
            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Trust Score</p>
            <p className="font-mono font-bold text-sky-400">{trustScore}</p>
          </div>
          <div className="p-1.5 rounded" style={{ background: "var(--ve-badge-bg)" }}>
            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Level</p>
            <p className="font-semibold text-amber-500 font-mono capitalize text-xs">{vouchLevel}</p>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-slate-500 mt-2 leading-relaxed px-1">
        ★ Proof builds automatically from verified pick results.
      </p>
    </div>
  );
}
