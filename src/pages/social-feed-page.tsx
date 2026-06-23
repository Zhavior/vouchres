import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { socialApi, type FeedPost } from "@/services/social";
import { VouchCard } from "@/components/vouch-card";
import { EmptyStateCard, LoadingCard, ErrorCard } from "@/components/ui-states";
import { Users, AlertCircle, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const SORTS = [{ key: "recent", label: "Recent" }, { key: "trending", label: "Trending" }, { key: "top_trust", label: "Top Trust" }];

export function SocialFeedPage() {
  const [sort, setSort] = useState("recent");
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["feed", sort], queryFn: () => socialApi.feed({ sort, limit: 50 }), staleTime: 30_000 });
  const trending = useQuery({ queryKey: ["trending", "24h", "5"], queryFn: () => socialApi.trending({ period: "24h", limit: 5 }), staleTime: 60_000 });

  const posts = data?.data ?? [];
  const trendingPicks = trending.data?.data ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold flex items-center gap-2"><Users className="w-5 h-5" style={{ color: "var(--ve-accent)" }} /> Vouch Feed</h1>
        <p className="text-xs mt-1" style={{ color: "var(--ve-text-muted)" }}>Community picks, vouches, and verified wins. A vouch is not a like — it's weighted trust.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-5">
        {/* Feed */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {SORTS.map(s => <button key={s.key} onClick={() => setSort(s.key)} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all", sort === s.key ? "ve-badge" : "")} style={sort === s.key ? {} : { color: "var(--ve-text-muted)" }}>{s.label}</button>)}
          </div>
          {isLoading ? <div className="space-y-3">{[1,2,3].map(i => <LoadingCard key={i} lines={4} />)}</div>
          : isError ? <ErrorCard onRetry={() => refetch()} />
          : posts.length > 0 ? <div className="space-y-3">{posts.map((post: FeedPost) => <VouchCard key={post.id} data={{ id: post.id, username: post.username, avatarUrl: null, trustScore: post.author_trust_score, vouchLevel: post.author_vouch_level, type: post.type, body: post.body, market: undefined, pickResult: post.pick_result, postedBeforeGame: post.posted_before_game, timestamp: post.created_at, likesCount: post.likes_count, commentsCount: post.comments_count, vouchesCount: post.vouches_count }} />)}</div>
          : <EmptyStateCard title="Feed is empty" description="Your VouchEdge feed is ready. Follow users, save picks, or generate Trust Picks AI to start building proof." icon={Users} />}
        </div>

        {/* Right rail */}
        <aside className="hidden lg:block space-y-3">
          <div className="ve-card p-4">
            <h3 className="text-xs font-bold flex items-center gap-2 mb-3"><Flame className="w-3.5 h-3.5" style={{ color: "var(--ve-accent)" }} /> Trending</h3>
            {trendingPicks.length > 0 ? <div className="space-y-2">{trendingPicks.map((t: any) => (
              <div key={t.post_id} className="p-2 rounded-lg" style={{ background: "rgba(5,11,24,0.4)", border: "1px solid var(--ve-card-border)" }}>
                <div className="flex items-center gap-2 mb-1"><span className="text-xs font-semibold">@{t.author_username}</span>{t.posted_before_game && <span className="ve-badge" style={{ color: "var(--ve-success)" }}>✓</span>}</div>
                <div className="text-[10px] font-mono" style={{ color: "var(--ve-text-dim)" }}>{t.market?.toUpperCase()} · {t.trending_score.toFixed(2)}</div>
              </div>
            ))}</div> : <p className="text-[11px]" style={{ color: "var(--ve-text-dim)" }}>No trending picks.</p>}
          </div>
          <div className="ve-card p-4 border-l-2" style={{ borderLeftColor: "var(--ve-danger)" }}>
            <div className="flex gap-2.5 items-start"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--ve-danger)" }} />
            <div className="text-xs"><h4 className="font-bold mb-1" style={{ color: "var(--ve-danger)" }}>Responsible Alert</h4><p style={{ color: "var(--ve-text-muted)" }}>No guaranteed wins. Parlays increase risk. Track responsibly.</p></div></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
