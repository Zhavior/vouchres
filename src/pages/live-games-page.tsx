import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { mlbApi } from "@/services/mlb";
import { GameCard } from "@/components/game-card";
import { EmptyStateCard, LoadingCard, ErrorCard } from "@/components/ui-states";
import { Swords } from "lucide-react";

export function LiveGamesPage() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["mlb", "games", "live"], queryFn: () => mlbApi.gamesLive(), staleTime: 30_000 });
  const games = data?.data ?? [];
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold flex items-center gap-2"><Swords className="w-5 h-5" style={{ color: "var(--ve-success)" }} /> Live Games</h1>
        <p className="text-xs mt-1" style={{ color: "var(--ve-text-muted)" }}>Real-time MLB game state with AI picks and vouch activity.</p>
      </div>
      {isLoading ? <div className="grid sm:grid-cols-2 gap-3">{[1,2,3,4].map(i => <LoadingCard key={i} lines={3} />)}</div>
      : isError ? <ErrorCard onRetry={() => refetch()} />
      : games.length > 0 ? <div className="grid sm:grid-cols-2 gap-3">{games.map((g: any) => <GameCard key={g.id} id={g.id} awayAbbr={g.away_abbr} homeAbbr={g.home_abbr} awayScore={g.away_score ?? undefined} homeScore={g.home_score ?? undefined} venue={g.venue ?? undefined} scheduledFirstPitch={g.scheduled_first_pitch} status={g.status} weather={g.weather ?? undefined} lineupConfirmed={g.lineup_confirmed} dataFreshAt={g.data_fresh_at} />)}</div>
      : <EmptyStateCard title="No live games" description="Today's MLB slate will appear here when games go live." icon={Swords} />}
    </div>
  );
}
