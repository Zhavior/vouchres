import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { socialApi, type FeedPost } from "@/services/social";
import { VouchCard } from "@/components/vouch-card";
import { TrendingVouchesPanel } from "@/components/trending-vouches-panel";
import { EmptyStateCard, LoadingCard, ErrorCard } from "@/components/ui-states";
import { Users, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const SORTS = [{ key: "recent", label: "Recent" }, { key: "trending", label: "Trending" }, { key: "top_trust", label: "Top Trust" }];

export function SocialFeedPage() {
  const [sort, setSort] = useState("recent");
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["feed", sort], queryFn: () => socialApi.feed({ sort, limit: 50 }), staleTime: 30_000 });

  const posts = data?.data ?? [];

  return (
    <div className="space-y-5">
      <div className="animate-slide-up">
        <h1 className="text-xl font-extrabold flex items-center gap-2">
          <Users className="w-5 h-5" style={{ color: "var(--ve-accent)" }} /> Vouch Feed
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--ve-text-muted)" }}>
          Community picks, vouches, and verified wins. A vouch is not a like — it's weighted trust.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-5">
        {/* Feed */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 ve-card p-1">
            {SORTS.map(s => (
              <button key={s.key} onClick={() => setSort(s.key)}
                className={cn("flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                  sort === s.key ? "bg-sky-950/60 text-sky-400 border border-sky-800/50" : "text-slate-400 hover:text-slate-200"
                )}>
                {s.label}
              </button>
            ))}
          </div>
          {isLoading ? <div className="space-y-3">{[1,2,3].map(i => <LoadingCard key={i} lines={4} />)}</div>
          : isError ? <ErrorCard onRetry={() => refetch()} />
          : posts.length > 0 ? (
            <div className="space-y-3">
              {posts.map((post: FeedPost) => (
                <VouchCard key={post.id} data={{
                  id: post.id,
                  username: post.username,
                  avatarUrl: null,
                  trustScore: post.author_trust_score,
                  vouchLevel: post.author_vouch_level,
                  type: post.type,
                  body: post.body,
                  market: undefined,
                  pickResult: post.pick_result,
                  postedBeforeGame: post.posted_before_game,
                  timestamp: post.created_at,
                  likesCount: post.likes_count,
                  commentsCount: post.comments_count,
                  vouchesCount: post.vouches_count,
                }} />
              ))}
            </div>
          ) : (
            <EmptyStateCard title="Feed is empty" description="Your VouchEdge feed is ready. Follow users, save picks, or generate Trust Picks AI to start building proof." icon={Users} />
          )}
        </div>

        {/* Right rail */}
        <aside className="hidden lg:block space-y-3">
          <TrendingVouchesPanel />
          <div className="ve-card p-4 border-l-2" style={{ borderLeftColor: "var(--ve-danger)" }}>
            <div className="flex gap-2.5 items-start">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--ve-danger)" }} />
              <div className="text-xs">
                <h4 className="font-bold mb-1" style={{ color: "var(--ve-danger)" }}>Responsible Gaming</h4>
                <p style={{ color: "var(--ve-text-muted)" }}>No guaranteed wins. Parlays increase risk. Track responsibly.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
