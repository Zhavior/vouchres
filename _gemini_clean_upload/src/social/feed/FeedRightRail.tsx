import React, { useEffect, useState } from 'react';
import { AlertCircle, Calendar } from 'lucide-react';
import TrendingVouchesPanel from './TrendingVouchesPanel';
import ProofBuildersPanel from './ProofBuildersPanel';
import HotMarketsPanel from './HotMarketsPanel';
import { FeedPost, CreatorProofProfile, Vouch } from '../../types';

interface FeedRightRailProps {
  posts: FeedPost[];
  profile: CreatorProofProfile;
  savedVouchIds: string[];
  onSaveVouch: (vouch: Vouch) => void;
}

interface UpcomingGame {
  gamePk: number;
  match: string;
  time: string;
}

function useUpcomingGames(): { games: UpcomingGame[]; loading: boolean } {
  const [games, setGames] = useState<UpcomingGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = tomorrow.toISOString().slice(0, 10);

    fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}&hydrate=team`)
      .then((r) => r.json())
      .then((data) => {
        const raw: any[] = data?.dates?.[0]?.games ?? [];
        setGames(
          raw.slice(0, 5).map((g) => {
            const away = g.teams?.away?.team?.name ?? '?';
            const home = g.teams?.home?.team?.name ?? '?';
            const t = new Date(g.gameDate);
            const time = t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
            return { gamePk: g.gamePk, match: `${away} @ ${home}`, time };
          })
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { games, loading };
}

export default function FeedRightRail({
  posts,
  profile,
  savedVouchIds,
  onSaveVouch,
}: FeedRightRailProps) {
  const { games: upcomingGames, loading: upcomingLoading } = useUpcomingGames();

  return (
    <aside className="hidden lg:flex flex-col gap-6 w-[340px] xl:w-[380px] py-6 overflow-y-auto no-scrollbar max-h-screen sticky top-0 bg-[#0b0f19]/20 backdrop-blur-md px-4 border-l border-slate-900/40" id="feed-right-rail">
      {/* 1. Hot MLB Markets Selection */}
      <HotMarketsPanel onQuickVouch={onSaveVouch} savedVouchIds={savedVouchIds} />

      {/* 2. Trending Vouches Derived from local state */}
      <TrendingVouchesPanel posts={posts} onSaveVouch={onSaveVouch} savedVouchIds={savedVouchIds} />

      {/* 3. Top Proof Builders (Transparent statistics) */}
      <ProofBuildersPanel profile={profile} />

      {/* 4. Risk Reminder Plate */}
      <div className="bg-[#121824]/35 backdrop-blur-xs rounded-xl border border-rose-950/40 p-4 relative overflow-hidden" id="risk-reminder-plate">
        <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full blur-xl"></div>
        <div className="flex gap-2.5 items-start">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-rose-400 mb-1">Responsible Trading Alert</h4>
            <p className="text-slate-300 leading-relaxed font-medium">
              No guaranteed wins. Parlays increase risk and compound volatility. Please track responsibly.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Upcoming Games Schedule */}
      <div className="bg-[#121824]/35 backdrop-blur-xs rounded-xl border border-slate-850/50 p-4" id="upcoming-games-schedule">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-purple-400" />
          <h3 className="font-bold text-slate-100 text-xs tracking-wide uppercase">Tomorrow's Matchups</h3>
        </div>
        <div className="space-y-2.5">
          {upcomingLoading && [0,1,2].map((i) => (
            <div key={i} className="h-8 rounded bg-slate-800/40 animate-pulse" />
          ))}
          {!upcomingLoading && upcomingGames.length === 0 && (
            <p className="text-[11px] text-slate-500 text-center py-2">No games scheduled.</p>
          )}
          {upcomingGames.map((game) => (
            <div key={game.gamePk} className="flex justify-between items-center bg-[#0b0f19]/35 p-2 rounded border border-slate-800/45">
              <span className="text-slate-300 text-[11px] font-medium truncate max-w-[210px]">{game.match}</span>
              <span className="text-[9px] text-purple-400 font-mono flex-shrink-0 bg-purple-950/40 px-1.5 py-0.5 rounded">{game.time}</span>
            </div>
          ))}
        </div>
        {!upcomingLoading && upcomingGames.length > 0 && (
          <p className="text-[9px] text-slate-600 mt-2 text-center">Live from MLB Stats API</p>
        )}
      </div>
    </aside>
  );
}
