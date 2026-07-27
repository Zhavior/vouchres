import React, { useEffect, useState } from 'react';
import { Sparkles, Clock, AlertCircle } from 'lucide-react';
import { Vouch } from '../../types';

interface LiveGame {
  gamePk: number;
  game: string;
  awayAbbr: string;
  homeAbbr: string;
  startTime: string;
  status: string;
  awayPitcher: string | null;
  homePitcher: string | null;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  } catch { return 'TBD'; }
}

async function fetchTodayGames(): Promise<LiveGame[]> {
  const today = new Date().toISOString().slice(0, 10);
  const res = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=team,probablePitcher,linescore`);
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  const games: any[] = data?.dates?.[0]?.games ?? [];
  return games.slice(0, 5).map((g) => {
    const away = g.teams?.away?.team;
    const home = g.teams?.home?.team;
    const ap = g.teams?.away?.probablePitcher;
    const hp = g.teams?.home?.probablePitcher;
    return {
      gamePk: g.gamePk,
      game: `${away?.name ?? '?'} @ ${home?.name ?? '?'}`,
      awayAbbr: away?.abbreviation ?? '?',
      homeAbbr: home?.abbreviation ?? '?',
      startTime: formatTime(g.gameDate),
      status: g.status?.detailedState ?? g.status?.abstractGameState ?? 'Scheduled',
      awayPitcher: ap?.fullName ?? null,
      homePitcher: hp?.fullName ?? null,
    };
  });
}

interface HotMarketsPanelProps {
  onQuickVouch: (vouch: Vouch) => void;
  savedVouchIds: string[];
}

export default function HotMarketsPanel({ onQuickVouch, savedVouchIds }: HotMarketsPanelProps) {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchTodayGames()
      .then(setGames)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="glass-panel glass-border font-z8 rounded-2xl p-4" id="hot-markets-card">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-vouch-cyan" />
        <h3 className="terminal-text text-white/70">Today's MLB Games</h3>
      </div>

      {loading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-lg bg-white/[0.03] animate-pulse" />)}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-white/40 p-3 bg-white/[0.02] rounded-lg">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          Schedule unavailable — check back soon.
        </div>
      )}

      {!loading && !error && games.length === 0 && (
        <p className="text-xs text-white/30 text-center py-4">No games scheduled today.</p>
      )}

      <div className="space-y-2">
        {games.map((m) => {
          const isLive  = /progress|live|warmup/i.test(m.status);
          const isFinal = /final/i.test(m.status);
          const vouchId = `vouch-game-${m.gamePk}`;
          const isSaved = savedVouchIds.includes(vouchId);

          const handleVouch = () => {
            const v: Vouch = {
              id: vouchId,
              vouchSource: 'VouchEdge',
              userNote: `Research lean on ${m.game}.`,
              market: 'Game',
              sport: 'MLB',
              playerOrTeam: m.game,
              gameName: m.game,
              odds: 'N/A',
              status: 'PENDING',
              savedCount: 0,
              vouchedCount: 1,
              createdAt: new Date().toISOString(),
              isSavedByUser: true,
              isVouchedByUser: true,
            };
            onQuickVouch(v);
          };

          return (
            <div key={m.gamePk} className="p-3 bg-white/[0.02] rounded-lg border border-white/10 text-xs space-y-1.5" id={`hot-market-${m.gamePk}`}>
              <div className="flex items-center justify-between gap-1">
                <span className={[
                  'terminal-text px-1.5 py-0.5 rounded',
                  isLive ? 'bg-rose-400/10 text-rose-400' : isFinal ? 'bg-white/[0.04] text-white/40' : 'bg-vouch-emerald/10 text-vouch-emerald',
                ].join(' ')}>
                  {isLive ? 'Live' : isFinal ? 'Final' : 'MLB'}
                </span>
                <span className="text-white/30 text-[10px] flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />{m.startTime}
                </span>
              </div>

              <p className="font-semibold text-white truncate">{m.game}</p>

              {(m.awayPitcher || m.homePitcher) ? (
                <div className="text-[10px] text-white/40 space-y-0.5">
                  {m.awayPitcher && <div><span className="text-white/25">{m.awayAbbr}:</span> {m.awayPitcher}</div>}
                  {m.homePitcher && <div><span className="text-white/25">{m.homeAbbr}:</span> {m.homePitcher}</div>}
                </div>
              ) : (
                <p className="text-[10px] text-white/25 italic">Probables not yet posted</p>
              )}

              <button
                onClick={handleVouch}
                className={[
                  'w-full mt-1 py-1 rounded text-[10px] font-bold transition-all',
                  isSaved ? 'bg-vouch-emerald/10 text-vouch-emerald' : 'bg-white/[0.03] text-white/40 hover:text-vouch-cyan',
                ].join(' ')}
              >
                {isSaved ? 'Added to Research' : '+ Add to Research'}
              </button>
            </div>
          );
        })}
      </div>

      {!loading && !error && games.length > 0 && (
        <p className="text-[9px] text-white/25 mt-2 text-center">Live from MLB Stats API · Odds unavailable</p>
      )}
    </div>
  );
}
