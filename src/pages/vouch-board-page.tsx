/**
 * VouchBoardPage — Community vouches and trending picks board.
 * Uses socialApi for vouches/trending. TODO: Add dedicated /v1/vouches endpoint for user-saved vouches.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Flame, Plus, Check, TrendingUp, Activity } from "lucide-react";
import { socialApi, type TrendingPick } from "@/services/social";

type FilterTab = "trending" | "saved";

export function VouchBoardPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<FilterTab>("trending");
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("ve_saved_vouches") ?? "[]"));
    } catch {
      return new Set();
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ["trending-full"],
    queryFn: () => socialApi.trending({ limit: 20 }),
  });

  const picks: TrendingPick[] = data?.data ?? [];

  const toggleSave = (pickId: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(pickId)) {
        next.delete(pickId);
      } else {
        next.add(pickId);
      }
      localStorage.setItem("ve_saved_vouches", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const displayed = tab === "saved" ? picks.filter((p) => savedIds.has(p.pick_id)) : picks;

  const resultColors: Record<string, string> = {
    WIN: "text-emerald-400",
    LOSS: "text-rose-400",
    PUSH: "text-slate-400",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ClipboardCheck className="w-5 h-5 text-sky-400" />
        <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider">Vouch Board</h2>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 animate-slide-up">
        <div className="ve-card p-4 text-center">
          <div className="text-2xl font-black font-mono text-sky-400">{picks.length}</div>
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Active Vouches</div>
        </div>
        <div className="ve-card p-4 text-center">
          <div className="text-2xl font-black font-mono text-emerald-400">{savedIds.size}</div>
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Saved</div>
        </div>
        <div className="ve-card p-4 text-center">
          <div className="text-2xl font-black font-mono text-amber-400">
            {picks.filter((p) => p.pick_result === "WIN").length}
          </div>
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Wins</div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="ve-card p-1 flex gap-1">
        {(["trending", "saved"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all capitalize ${
              tab === t
                ? "bg-sky-950/60 text-sky-400 border border-sky-800/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t === "trending" ? <Flame className="w-3.5 h-3.5" /> : <ClipboardCheck className="w-3.5 h-3.5" />}
            {t}
          </button>
        ))}
      </div>

      {/* Vouch list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="ve-spinner" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="ve-card p-8 text-center text-slate-500">
          {tab === "saved" ? "No saved vouches yet. Save picks from Trending." : "No trending vouches right now."}
        </div>
      ) : (
        <div className="space-y-3 animate-slide-up">
          {displayed.map((pick) => {
            const isSaved = savedIds.has(pick.pick_id);
            return (
              <div key={pick.pick_id} className="ve-card ve-card-hover p-4 glow-hover">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-[10px] bg-sky-950 text-sky-400 font-bold px-2 py-0.5 rounded uppercase">
                        MLB
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono border border-slate-700 px-1.5 py-0.5 rounded">
                        {pick.market} @ {pick.line}
                      </span>
                      {pick.pick_result && (
                        <span className={`text-[10px] font-bold ${resultColors[pick.pick_result] ?? "text-slate-400"}`}>
                          {pick.pick_result}
                        </span>
                      )}
                    </div>

                    {/* Post body */}
                    <p className="text-sm text-slate-200 font-medium leading-snug line-clamp-2 mb-2">
                      {pick.post_body}
                    </p>

                    {/* Author + stats */}
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                          style={{ background: "var(--ve-badge-bg)", color: "var(--ve-accent)" }}>
                          {pick.author_username.charAt(0).toUpperCase()}
                        </div>
                        <span>@{pick.author_username}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        <span>{pick.vouches_count} vouches</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>Score: {pick.trending_score}</span>
                      </div>
                    </div>
                  </div>

                  {/* Save button */}
                  <button
                    onClick={() => toggleSave(pick.pick_id)}
                    className={`p-2 rounded-xl border flex-shrink-0 transition-all ${
                      isSaved
                        ? "bg-emerald-950/40 border-emerald-800 text-emerald-400"
                        : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                    }`}
                    title={isSaved ? "Remove from board" : "Add to vouch board"}
                  >
                    {isSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
