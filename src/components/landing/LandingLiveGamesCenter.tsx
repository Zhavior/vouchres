import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useLiveGames } from '../../hooks/queries/useLiveGames';
import { useHrBoardToday } from '../../hooks/queries/useHrBoardToday';
import { buildBoard } from '../../features/hr/utils/normalizeHrWatch';
import type { HrWatchRow } from '../../features/hr/types/hrWatch';
import { logoByTeamName } from '../../lib/teamLogos';
import { Z8_INTERACTIVE, Z8_LABEL, Z8_PANEL_PREMIUM } from './LandingTokens';
import { ChevronLeft, ChevronRight, Radio, ShieldCheck } from './LandingIcons';
import LandingHrSpotlightCard from './LandingHrSpotlightCard';

type LiveGame = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  venue: string | null;
  gameDate: string | null;
  isLive?: boolean;
  isFinal?: boolean;
};

const SLIDE_MS = 5500;

function isLiveStatus(status: string): boolean {
  const value = status.toLowerCase();
  return /progress|live|in play|warmup|delayed/i.test(value) || /\b(top|bottom)\s+\d/i.test(value);
}

function isFinalStatus(status: string): boolean {
  return /final|game over|completed/i.test(status);
}

function formatGameTime(iso: string | null): string {
  if (!iso) return 'TBD';
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(new Date(iso));
  } catch {
    return 'TBD';
  }
}

function teamAbbr(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return parts.map((part) => part[0]).join('').slice(0, 3).toUpperCase();
  }
  return name.slice(0, 3).toUpperCase();
}

function sortGames(games: LiveGame[]): LiveGame[] {
  return [...games].sort((a, b) => {
    const aLive = a.isLive || isLiveStatus(a.status);
    const bLive = b.isLive || isLiveStatus(b.status);
    if (aLive !== bLive) return aLive ? -1 : 1;

    const aFinal = a.isFinal || isFinalStatus(a.status);
    const bFinal = b.isFinal || isFinalStatus(b.status);
    if (aFinal !== bFinal) return aFinal ? 1 : -1;

    const aTime = a.gameDate ? Date.parse(a.gameDate) : Number.MAX_SAFE_INTEGER;
    const bTime = b.gameDate ? Date.parse(b.gameDate) : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });
}

function pickSpotlightPlayers(boardInput: unknown): { rows: HrWatchRow[]; projectedOnly: boolean } {
  const board = buildBoard(boardInput);
  const confirmed = [...board.confirmed].sort((a, b) => b.hrScore - a.hrScore);
  const curated = [...board.curated].sort((a, b) => b.hrScore - a.hrScore);

  if (confirmed.length >= 3) {
    return { rows: confirmed.slice(0, 3), projectedOnly: false };
  }

  const merged = [...confirmed, ...curated.filter((row) => !confirmed.some((c) => c.stableId === row.stableId))];
  return {
    rows: merged.slice(0, 3),
    projectedOnly: confirmed.length === 0 && merged.length > 0,
  };
}

function TeamLogo({ name, size = 52 }: { name: string; size?: number }) {
  const src = logoByTeamName(name);
  const abbr = teamAbbr(name);

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/40 p-2 shadow-[0_0_20px_rgba(0,240,255,0.06)]"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain" />
      ) : (
        <span className="font-mono text-xs font-black text-vouch-cyan">{abbr}</span>
      )}
    </div>
  );
}

function GameStatusPill({ game }: { game: LiveGame }) {
  const live = game.isLive || isLiveStatus(game.status);
  const final = game.isFinal || isFinalStatus(game.status);

  if (live) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-vouch-emerald/35 bg-vouch-emerald/10 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-vouch-emerald">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-vouch-emerald shadow-[0_0_8px_rgba(0,255,148,0.7)]" />
        Live
      </span>
    );
  }

  if (final) {
    return (
      <span className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-white/45">
        Final
      </span>
    );
  }

  return (
    <span className="rounded-full border border-vouch-cyan/30 bg-vouch-cyan/8 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-vouch-cyan/85">
      {formatGameTime(game.gameDate)}
    </span>
  );
}

function GamesSlideshow({ games }: { games: LiveGame[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = games.length;

  useEffect(() => {
    if (count <= 1 || paused) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  if (count === 0) {
    return (
      <div className="ve-landing-games-empty rounded-xl border border-white/10 bg-black/30 px-5 py-10 text-center">
        <p className={`${Z8_LABEL} text-vouch-cyan/70`}>MLB Schedule</p>
        <p className="mt-2 text-sm text-white/45">No games on today&apos;s official slate yet.</p>
      </div>
    );
  }

  const game = games[index];
  const showScore = game.isLive || game.isFinal || isLiveStatus(game.status) || isFinalStatus(game.status);
  const awayScore = game.awayScore ?? 0;
  const homeScore = game.homeScore ?? 0;

  return (
    <div
      className="ve-landing-games-slideshow relative overflow-hidden rounded-xl border border-white/10 bg-black/30"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-vouch-cyan" />
          <p className={`${Z8_LABEL} text-vouch-cyan`}>Live Games Center</p>
        </div>
        <GameStatusPill game={game} />
      </div>

      <div className="ve-landing-game-slide px-4 py-6 sm:px-8 sm:py-8" key={game.id}>
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
            <TeamLogo name={game.awayTeam} size={56} />
            <p className="truncate text-sm font-bold text-white sm:text-base">{game.awayTeam}</p>
            {showScore && (
              <p className="font-mono text-3xl font-black tabular-nums text-white sm:text-4xl">{awayScore}</p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-center gap-2">
            <span className="rounded-full border border-vouch-cyan/25 bg-vouch-cyan/8 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-vouch-cyan">
              vs
            </span>
            <p className="max-w-[8rem] text-center font-mono text-[9px] uppercase tracking-widest text-white/35">
              {game.venue || 'Venue TBD'}
            </p>
          </div>

          <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
            <TeamLogo name={game.homeTeam} size={56} />
            <p className="truncate text-sm font-bold text-white sm:text-base">{game.homeTeam}</p>
            {showScore && (
              <p className="font-mono text-3xl font-black tabular-nums text-white sm:text-4xl">{homeScore}</p>
            )}
          </div>
        </div>

        <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-widest text-white/35">
          {game.status}
          <span className="mx-2 text-white/15">·</span>
          Official MLB schedule
        </p>
      </div>

      {count > 1 && (
        <>
          <div className="flex items-center justify-between border-t border-white/10 px-3 py-2">
            <button
              type="button"
              aria-label="Previous game"
              onClick={() => setIndex((current) => (current - 1 + count) % count)}
              className={`${Z8_INTERACTIVE} flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/35 text-white/50 hover:border-vouch-cyan/35 hover:text-vouch-cyan`}
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex flex-wrap items-center justify-center gap-1.5 px-2">
              {games.slice(0, 12).map((item, dotIndex) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Show game ${dotIndex + 1}`}
                  aria-current={dotIndex === index}
                  onClick={() => setIndex(dotIndex)}
                  className={`h-1.5 rounded-full transition-all ${
                    dotIndex === index
                      ? 'w-5 bg-vouch-cyan shadow-[0_0_10px_rgba(0,240,255,0.45)]'
                      : 'w-1.5 bg-white/20 hover:bg-vouch-cyan/40'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              aria-label="Next game"
              onClick={() => setIndex((current) => (current + 1) % count)}
              className={`${Z8_INTERACTIVE} flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/35 text-white/50 hover:border-vouch-cyan/35 hover:text-vouch-cyan`}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="ve-landing-games-shortcuts flex gap-2 overflow-x-auto border-t border-white/5 px-3 py-2.5">
            {games.slice(0, 12).map((item, shortcutIndex) => {
              const awayLogo = logoByTeamName(item.awayTeam);
              const homeLogo = logoByTeamName(item.homeTeam);
              const active = shortcutIndex === index;

              return (
                <button
                  key={`shortcut-${item.id}`}
                  type="button"
                  aria-label={`${item.awayTeam} at ${item.homeTeam}`}
                  aria-current={active}
                  onClick={() => setIndex(shortcutIndex)}
                  className={`${Z8_INTERACTIVE} flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1.5 font-mono text-[9px] uppercase tracking-wide ${
                    active
                      ? 'border-vouch-cyan/40 bg-vouch-cyan/10 text-vouch-cyan'
                      : 'border-white/10 bg-black/25 text-white/40 hover:border-vouch-cyan/25 hover:text-white/65'
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center">
                    {awayLogo ? <img src={awayLogo} alt="" className="h-4 w-4 object-contain" /> : teamAbbr(item.awayTeam)}
                  </span>
                  <span className="text-white/25">@</span>
                  <span className="flex h-5 w-5 items-center justify-center">
                    {homeLogo ? <img src={homeLogo} alt="" className="h-4 w-4 object-contain" /> : teamAbbr(item.homeTeam)}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function HrCardsPlaceholder() {
  return (
    <div className="ve-landing-hr-cards grid grid-cols-1 gap-3 md:grid-cols-3">
      {[1, 2, 3].map((slot) => (
        <div
          key={slot}
          className="ve-landing-hr-card h-44 animate-pulse rounded-2xl border border-white/10 bg-black/30"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function HrSpotlightRow({ projectedOnly, rows }: { projectedOnly: boolean; rows: HrWatchRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 px-5 py-8 text-center">
        <p className={`${Z8_LABEL} text-vouch-cyan/70`}>HR Board Preview</p>
        <p className="mt-2 text-sm text-white/45">Today&apos;s HR intelligence loads when the slate is ready.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {projectedOnly && (
        <div className="flex items-start gap-2 rounded-xl border border-vouch-amber/30 bg-vouch-amber/8 px-4 py-3">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-vouch-amber" />
          <p className="font-mono text-[10px] uppercase leading-relaxed tracking-wide text-vouch-amber/90">
            Official lineup not posted yet — preview rows only. Sign in for the full verified HR board.
          </p>
        </div>
      )}

      <div className="ve-landing-hr-cards grid grid-cols-1 gap-3 md:grid-cols-3">
        {rows.map((player) => (
          <LandingHrSpotlightCard key={player.stableId} player={player} />
        ))}
      </div>
    </div>
  );
}

function LiveGamesCenterBody() {
  const liveQuery = useLiveGames({ refetchInterval: 45_000 });
  const hrQuery = useHrBoardToday(12);

  const games = useMemo(() => {
    const raw = liveQuery.data?.games ?? [];
    return sortGames(raw.slice(0, 18));
  }, [liveQuery.data?.games]);

  const spotlight = useMemo(() => pickSpotlightPlayers(hrQuery.data), [hrQuery.data]);

  const liveCount = games.filter((game) => game.isLive || isLiveStatus(game.status)).length;

  return (
    <div className={`overflow-hidden rounded-2xl ${Z8_PANEL_PREMIUM}`}>
      <div className="ve-landing-games-panel-header flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`${Z8_LABEL} text-vouch-cyan`}>Today&apos;s Slate</p>
          <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">Live games + HR spotlight</h2>
          <p className="mt-1 hidden text-sm text-white/45 sm:block">
            Official MLB schedule with trust-first HR board previews — the same cards you get inside the terminal.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-vouch-cyan/25 bg-vouch-cyan/8 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-vouch-cyan">
            {games.length} games
          </span>
          {liveCount > 0 && (
            <span className="rounded-full border border-vouch-emerald/30 bg-vouch-emerald/8 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-vouch-emerald">
              {liveCount} live
            </span>
          )}
        </div>
      </div>

      <div className="ve-landing-games-panel-body flex flex-col gap-5 p-5">
        <GamesSlideshow games={games} />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className={`${Z8_LABEL} text-vouch-cyan`}>HR Board Spotlight</p>
            <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">Top 3 today</span>
          </div>
          {hrQuery.isLoading ? <HrCardsPlaceholder /> : <HrSpotlightRow {...spotlight} />}
        </div>
      </div>

      <div className="border-t border-white/10 bg-vouch-cyan/5 px-5 py-3 text-center">
        <p className="font-mono text-[9px] uppercase tracking-widest text-white/35">
          Real MLB API · No fake lineups · Team mismatch rows blocked before they reach confirmed candidates
        </p>
      </div>
    </div>
  );
}

function LiveGamesCenterPlaceholder() {
  return (
    <div className={`overflow-hidden rounded-2xl ${Z8_PANEL_PREMIUM}`}>
      <div className="border-b border-white/10 px-5 py-4">
        <p className={`${Z8_LABEL} text-vouch-cyan/70`}>Today&apos;s Slate</p>
        <h2 className="mt-1 text-xl font-black text-white">Live games + HR spotlight</h2>
      </div>
      <div className="flex flex-col gap-5 p-5">
        <div className="h-52 animate-pulse rounded-xl border border-white/10 bg-black/30" />
        <HrCardsPlaceholder />
      </div>
    </div>
  );
}

export default function LandingLiveGamesCenter() {
  const [ready, setReady] = useState(false);
  const markerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || !('IntersectionObserver' in window)) {
      setReady(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: '280px 0px' },
    );

    observer.observe(marker);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={markerRef} aria-labelledby="live-games-heading" className="ve-landing-live-section space-y-4">
      <div className="ve-landing-section-intro text-center">
        <p className={`${Z8_LABEL} text-vouch-cyan`}>What you unlock</p>
        <h2 id="live-games-heading" className="mt-2 text-2xl font-black text-white sm:text-3xl">
          Live terminal preview
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/45">
          Official MLB matchups with team logos, live status, and the same HR player cards powering the daily board.
        </p>
      </div>

      {ready ? (
        <Suspense fallback={<LiveGamesCenterPlaceholder />}>
          <LiveGamesCenterBody />
        </Suspense>
      ) : (
        <LiveGamesCenterPlaceholder />
      )}
    </section>
  );
}
