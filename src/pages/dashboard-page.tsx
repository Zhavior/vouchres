import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { mlbApi } from "@/services/mlb";
import { picksApi } from "@/services/picks";
import { socialApi } from "@/services/social";
import { trustApi } from "@/services/trust";
import { TrustPickCard } from "@/components/trust-pick-card";
import { EmptyStateCard, LoadingCard, ErrorCard } from "@/components/ui-states";
import { GameCard } from "@/components/game-card";
import { useAuthStore } from "@/stores/auth-store";
import { TrustScoreRing } from "@/components/app-shell";
import { Sparkles, Swords, TrendingUp, Trophy, Shield, Zap, Flame } from "lucide-react";

export function DashboardPage() {
  const me = useAuthStore((s) => s.me);

  const games = useQuery({ queryKey: ["mlb", "games", "today"], queryFn: () => mlbApi.gamesToday(), staleTime: 60_000 });
  const picks = useQuery({ queryKey: ["mlb", "picks", "today", "top4"], queryFn: () => mlbApi.picksToday({ sort: "edge", limit: 4 }), staleTime: 60_000 });
  const record = useQuery({ queryKey: ["picks", "results", "my"], queryFn: () => picksApi.results(), staleTime: 30_000 });
  const trending = useQuery({ queryKey: ["trending", "24h", "3"], queryFn: () => socialApi.trending({ period: "24h", limit: 3 }), staleTime: 60_000 });
  const leaderboard = useQuery({ queryKey: ["leaderboard", "trust", "5"], queryFn: () => trustApi.leaderboard({ sort: "trust_score", limit: 5 }), staleTime: 60_000 });

  const gamesList = games.data?.data ?? [];
  const liveGames = gamesList.filter((g: any) => g.status === "live" || g.status === "delayed");
  const picksList = picks.data?.data ?? [];
  const recordData = record.data;
  const trendingList = trending.data?.data ?? [];
  const lbList = leaderboard.data?.data ?? [];

  const winRate = recordData ? (recordData.record.win_rate * 100).toFixed(0) + "%" : "0%";
  const streak = (recordData?.record.current_streak ?? 0) + " streak";
  const recordStr = recordData ? recordData.record.won + "-" + recordData.record.lost : "0-0";
  const gradedStr = (recordData?.record.decided ?? 0) + " graded";

  return (
    <div className="space-y-6">
      {/* Hero trust banner */}
      <div className="ve-card p-5 border-l-2" style={{ borderLeftColor: "var(--ve-accent)" }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-extrabold flex items-center gap-2">
              <Shield className="w-5 h-5" style={{ color: "var(--ve-accent)" }} />
              Proof over hype.
            </h1>
            <p className="text-xs mt-1" style={{ color: "var(--ve-text-muted)" }}>
              Every pick gets locked. Every pick gets graded. Trust is earned.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <TrustScoreRing score={me?.trust_score ?? 0} size={48} />
            <div>
              <div className="text-xl font-bold font-mono" style={{ color: "var(--ve-accent)" }}>{me?.trust_score ?? 0}</div>
              <div className="text-[10px] uppercase" style={{ color: "var(--ve-text-dim)" }}>{me?.vouch_level ?? "unverified"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox label="Record" value={recordStr} sub={gradedStr} icon={Trophy} />
        <StatBox label="Win Rate" value={winRate} sub={streak} icon={TrendingUp} />
        <StatBox label="Plan" value={(me?.plan ?? "FREE").toUpperCase()} sub={me?.plan === "free" ? "Upgrade for more" : "Active"} icon={Zap} />
        <StatBox label="Trust" value={String(me?.trust_score ?? 0)} sub={me?.vouch_level ?? "unverified"} icon={Shield} />
      </div>

      {/* AI Picks */}
      <Section title="Trust Picks AI" icon={Sparkles} link="/picks" linkLabel="View all">
        {picks.isLoading ? (
          <div className="grid sm:grid-cols-2 gap-3">{[1, 2].map((i) => <LoadingCard key={i} lines={4} />)}</div>
        ) : picks.isError ? (
          <ErrorCard onRetry={() => picks.refetch()} />
        ) : picksList.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">{picksList.slice(0, 4).map((p: any, i: number) => <TrustPickCard key={i} pick={p} />)}</div>
        ) : (
          <EmptyStateCard title="No AI picks yet" description="Model scores will appear once today's games are ingested." icon={Sparkles} />
        )}
      </Section>

      {/* Live Games */}
      <Section title="Live Games" icon={Swords} link="/live" linkLabel="View all">
        {games.isLoading ? (
          <div className="grid sm:grid-cols-2 gap-3">{[1, 2].map((i) => <LoadingCard key={i} lines={3} />)}</div>
        ) : games.isError ? (
          <ErrorCard onRetry={() => games.refetch()} />
        ) : liveGames.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {liveGames.slice(0, 4).map((g: any) => (
              <GameCard key={g.id} id={g.id} awayAbbr={g.away_abbr} homeAbbr={g.home_abbr} awayScore={g.away_score ?? undefined} homeScore={g.home_score ?? undefined} venue={g.venue ?? undefined} scheduledFirstPitch={g.scheduled_first_pitch} status={g.status} weather={g.weather ?? undefined} lineupConfirmed={g.lineup_confirmed} dataFreshAt={g.data_fresh_at} />
            ))}
          </div>
        ) : (
          <EmptyStateCard title="No live games" description="Today's MLB slate will appear here when games go live." icon={Swords} />
        )}
      </Section>

      {/* Trending + Leaderboard */}
      <div className="grid md:grid-cols-2 gap-4">
        <Section title="Trending" icon={Flame}>
          {trendingList.length > 0 ? (
            <div className="space-y-2">
              {trendingList.map((t: any) => (
                <div key={t.post_id} className="ve-card p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">@{t.author_username}</span>
                    {t.posted_before_game && <span className="ve-badge" style={{ color: "var(--ve-success)" }}>PRE-GAME</span>}
                  </div>
                  <div className="text-[10px] font-mono" style={{ color: "var(--ve-text-dim)" }}>{t.market?.toUpperCase()} - score {t.trending_score.toFixed(2)}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyStateCard title="No trending picks" icon={Flame} className="p-4" />
          )}
        </Section>

        <Section title="Top Cappers" icon={Trophy} link="/leaderboard" linkLabel="View all">
          {lbList.length > 0 ? (
            <div className="space-y-2">
              {lbList.slice(0, 5).map((e: any) => (
                <div key={e.user_id} className="ve-card p-3 flex items-center gap-3">
                  <div className="text-sm font-mono font-bold w-6 text-center" style={{ color: e.rank <= 3 ? "var(--ve-accent)" : "var(--ve-text-dim)" }}>#{e.rank}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">@{e.username}</div>
                    <div className="text-[10px] font-mono" style={{ color: "var(--ve-text-muted)" }}>{e.won}W - {e.lost}L - {(e.win_rate * 100).toFixed(0)}%</div>
                  </div>
                  <div className="text-sm font-bold font-mono" style={{ color: "var(--ve-accent)" }}>{e.trust_score}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyStateCard title="No cappers yet" icon={Trophy} className="p-4" />
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, link, linkLabel, children }: { title: string; icon: any; link?: string; linkLabel?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: "var(--ve-accent)" }} />
          {title}
        </h2>
        {link && <Link to={link} className="text-[11px] font-mono hover:underline" style={{ color: "var(--ve-accent)" }}>{linkLabel} -&gt;</Link>}
      </div>
      {children}
    </section>
  );
}

function StatBox({ label, value, sub, icon: Icon }: { label: string; value: string; sub: string; icon: any }) {
  return (
    <div className="ve-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--ve-text-dim)" }}>{label}</span>
        <Icon className="w-3.5 h-3.5" style={{ color: "var(--ve-accent)" }} />
      </div>
      <div className="mt-1 text-xl font-bold font-mono">{value}</div>
      <div className="text-[10px]" style={{ color: "var(--ve-text-dim)" }}>{sub}</div>
    </div>
  );
}
