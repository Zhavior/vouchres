import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Radio } from 'lucide-react';
import { logoByTeamName } from '../../lib/teamLogos';
import { Z8_LABEL, Z8_PANEL } from '../../theme/z8Tokens';

export type SlateGame = {
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

export function isLiveStatus(status: string): boolean {
  const value = status.toLowerCase();
  return /progress|live|in play|warmup|delayed/i.test(value) || /\b(top|bottom)\s+\d/i.test(value);
}

export function isFinalStatus(status: string): boolean {
  return /final|game over|completed/i.test(status.toLowerCase());
}

export function formatGameTime(iso: string | null): string {
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

export function teamAbbr(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return parts.map((part) => part[0]).join('').slice(0, 3).toUpperCase();
  }
  return name.slice(0, 3).toUpperCase();
}

export function sortSlateGames(games: SlateGame[]): SlateGame[] {
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

function GameStatusPill({ game }: { game: SlateGame }) {
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

type SlateGamesSlideshowProps = {
  games: SlateGame[];
  loading?: boolean;
  eyebrow?: string;
  title?: string;
  maxShortcuts?: number;
  className?: string;
};

export default function SlateGamesSlideshow({
  games,
  loading = false,
  eyebrow = "Today's Slate",
  title = 'Team vs team matchups',
  maxShortcuts = 12,
  className = '',
}: SlateGamesSlideshowProps) {
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

  if (loading && count === 0) {
    return (
      <section className={`${Z8_PANEL} animate-pulse rounded-2xl p-5 ${className}`} aria-label="Loading today's slate">
        <div className="h-4 w-32 rounded bg-white/10" />
        <div className="mt-4 h-40 rounded-xl bg-white/5" />
      </section>
    );
  }

  if (count === 0) {
    return (
      <section className={`${Z8_PANEL} rounded-2xl px-5 py-10 text-center ${className}`}>
        <p className={`${Z8_LABEL} text-vouch-cyan/70`}>{eyebrow}</p>
        <p className="mt-2 text-sm text-white/45">No games on today&apos;s official MLB slate yet.</p>
      </section>
    );
  }

  const game = games[index];
  const showScore = game.isLive || game.isFinal || isLiveStatus(game.status) || isFinalStatus(game.status);
  const awayScore = game.awayScore ?? 0;
  const homeScore = game.homeScore ?? 0;
  const liveCount = games.filter((item) => item.isLive || isLiveStatus(item.status)).length;

  return (
    <section
      className={`${Z8_PANEL} overflow-hidden rounded-2xl ${className}`}
      aria-label={`${eyebrow} slideshow`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-vouch-cyan" />
            <p className={`${Z8_LABEL} text-vouch-cyan`}>{eyebrow}</p>
          </div>
          <h2 className="mt-1 text-lg font-black text-white sm:text-xl">{title}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GameStatusPill game={game} />
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

      <div className="px-4 py-6 sm:px-8 sm:py-8" key={game.id}>
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
              className="z8-interactive flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/35 text-white/50 hover:border-vouch-cyan/35 hover:text-vouch-cyan"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex flex-wrap items-center justify-center gap-1.5 px-2">
              {games.slice(0, maxShortcuts).map((item, dotIndex) => (
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
              className="z8-interactive flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/35 text-white/50 hover:border-vouch-cyan/35 hover:text-vouch-cyan"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto border-t border-white/5 px-3 py-2.5 touch-pan-x">
            {games.slice(0, maxShortcuts).map((item, shortcutIndex) => {
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
                  className={`z8-interactive flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1.5 font-mono text-[9px] uppercase tracking-wide ${
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
    </section>
  );
}
