import { useQuery } from "@tanstack/react-query";
import { mlbApi } from "@/services/mlb";
import { GameCard } from "@/components/game-card";
import { EmptyState } from "@/components/empty-state";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { ErrorState } from "@/components/error-state";
import { Swords } from "lucide-react";

export function LiveGamesPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["mlb", "games", "live"],
    queryFn: () => mlbApi.gamesLive(),
    staleTime: 30_000,
  });

  const games = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Swords className="w-5 h-5 text-success" />
          Live Games
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time MLB game state. Each card shows pitchers, venue, park factor, weather,
          lineup status, and top targets per team.
        </p>
        {data?.meta && (
          <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500 font-mono">
            <span>source: {data.meta.source}</span>
            <span>·</span>
            <span>{data.meta.count} live games</span>
            {data.meta.is_stale && (
              <span className="text-warning">· stale data</span>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <LoadingSkeleton key={i} lines={4} className="glass-card p-4" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : games.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {games.map((g) => (
            <GameCard
              key={g.id}
              id={g.id}
              awayAbbr={g.away_abbr}
              homeAbbr={g.home_abbr}
              awayScore={g.away_score ?? undefined}
              homeScore={g.home_score ?? undefined}
              venue={g.venue ?? undefined}
              scheduledFirstPitch={g.scheduled_first_pitch}
              status={g.status}
              weather={g.weather ?? undefined}
              lineupConfirmed={g.lineup_confirmed}
              dataFreshAt={g.data_fresh_at}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Swords}
          title="No live games right now"
          description="Today's MLB slate will appear here once games go live."
        />
      )}
    </div>
  );
}
