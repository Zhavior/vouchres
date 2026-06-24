/**
 * TrendingVouchesPanel — right rail trending picks from the community feed.
 * Uses socialApi.trending() to pull live trending picks.
 */
import { Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { socialApi } from "@/services/social";

export function TrendingVouchesPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["trending-picks"],
    queryFn: () => socialApi.trending({ limit: 3 }),
    staleTime: 60_000,
  });

  const picks = data?.data ?? [];

  return (
    <div className="ve-card p-4" id="trending-vouches-card">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-amber-500" />
        <h3 className="font-bold text-slate-100 text-xs tracking-widest uppercase">Trending Vouches</h3>
      </div>

      {isLoading ? (
        <div className="py-4 flex justify-center">
          <div className="ve-spinner" />
        </div>
      ) : picks.length === 0 ? (
        <p className="text-xs text-slate-400 py-4 text-center">Trending builds as posts are created.</p>
      ) : (
        <div className="space-y-3">
          {picks.map((v) => (
            <div
              key={v.pick_id}
              className="p-3 rounded-lg border border-slate-800 text-xs"
              style={{ background: "rgba(11,15,25,0.6)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] bg-sky-950 text-sky-400 font-bold px-1.5 py-0.5 rounded uppercase">
                  MLB
                </span>
                <span className="text-slate-400 font-mono text-[10px]">{v.market}</span>
              </div>
              <p className="font-semibold text-slate-200 truncate">{v.post_body}</p>
              <div className="mt-1 flex items-center gap-1.5 text-slate-400 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{v.vouches_count} vouches</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
