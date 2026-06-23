import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { socialApi, type FeedPost } from "@/services/social";
import { FeedPostCard } from "@/components/feed-post-card";
import { EmptyState } from "@/components/empty-state";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { ErrorState } from "@/components/error-state";
import { Users, AlertCircle, Flame, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const SORTS = [
  { key: "recent", label: "Recent" },
  { key: "trending", label: "Trending" },
  { key: "top_trust", label: "Top Trust" },
];

export function SocialFeedPage() {
  const [sort, setSort] = useState("recent");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["feed", sort],
    queryFn: () => socialApi.feed({ sort, limit: 50 }),
    staleTime: 30_000,
  });

  const trending = useQuery({
    queryKey: ["trending", "24h", "5"],
    queryFn: () => socialApi.trending({ period: "24h", limit: 5 }),
    staleTime: 60_000,
  });

  const posts = data?.data ?? [];
  const trendingPicks = trending.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Users className="w-5 h-5 text-electric-400" />
          Social Feed
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Picks, parlays, reasoning, and verified wins from the community. A vouch is not a like —
          it's a weighted endorsement that affects the receiver's trust score.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Main feed column */}
        <div className="space-y-4">
          {/* Sort bar */}
          <div className="flex items-center gap-2">
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  sort === s.key
                    ? "bg-electric-500/15 text-electric-300 border border-electric-500/40"
                    : "text-slate-400 hover:text-electric-300 border border-transparent"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Feed */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <LoadingSkeleton key={i} lines={4} className="glass-card p-4" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : posts.length > 0 ? (
            <div className="space-y-3">
              {posts.map((post: FeedPost) => (
                <FeedPostCard
                  key={post.id}
                  username={post.username}
                  vouchLevel={post.author_vouch_level as any}
                  trustScore={post.author_trust_score}
                  type={post.type as any}
                  body={post.body}
                  pickResult={post.pick_result as any}
                  postedBeforeGame={post.posted_before_game}
                  timestamp={post.created_at}
                  likes={post.likes_count}
                  comments={post.comments_count}
                  vouches={post.vouches_count}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="Feed is empty"
              description="Post your first pick or reasoning to start the conversation."
            />
          )}
        </div>

        {/* Right rail */}
        <aside className="hidden lg:block space-y-4">
          {/* Trending picks */}
          <div className="glass-card p-4">
            <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2 mb-3">
              <Flame className="w-3.5 h-3.5 text-electric-400" />
              Trending Picks
            </h3>
            {trendingPicks.length > 0 ? (
              <div className="space-y-2">
                {trendingPicks.map((t: any) => (
                  <div key={t.post_id} className="p-2 rounded-lg bg-navy-900/40 border border-electric-500/10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-100">
                        @{t.author_username}
                      </span>
                      {t.posted_before_game && (
                        <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-success/10 text-success">
                          ✓ PRE-GAME
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {t.market?.toUpperCase()} · score {t.trending_score.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">No trending picks yet.</p>
            )}
          </div>

          {/* Top cappers */}
          <div className="glass-card p-4">
            <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2 mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-electric-400" />
              Top Cappers
            </h3>
            <p className="text-[11px] text-slate-500">
              <a href="/leaderboard" className="text-electric-300 hover:underline">
                View leaderboard →
              </a>
            </p>
          </div>

          {/* Risk reminder */}
          <div className="glass-card p-4 border-danger/20 bg-danger/5">
            <div className="flex gap-2.5 items-start">
              <AlertCircle className="w-4 h-4 text-danger/80 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <h4 className="font-bold text-danger/90 mb-1">Responsible Alert</h4>
                <p className="text-slate-300 leading-relaxed">
                  No guaranteed wins. Parlays increase risk. Please track responsibly.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
