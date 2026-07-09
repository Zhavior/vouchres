import { useEffect, useMemo, useState } from 'react';
import { Calendar, RefreshCw, Users } from 'lucide-react';
import { HrBrandIcon } from '../features/hr/components/HrBrandIcon';
import { bootDataStore } from '../lib/boot/bootDataStore';
import { MLB_HEADSHOT_IMG_CLASS } from '../lib/mlbHeadshot';
import { logoByTeamId, logoByTeamName, teamIdByName } from '../lib/teamLogos';
import { Z8_ACTIVE, Z8_IDLE, Z8_LABEL, Z8_PAGE, Z8_PANEL_PREMIUM, Z8_SURFACE } from '../theme/z8Tokens';

type Pitcher = {
  id?: number | string;
  name?: string;
  fullName?: string;
  throws?: string;
  hand?: string;
};

type Player = {
  playerId?: number | string;
  id?: number | string;
  playerName?: string;
  name?: string;
  team?: string;
  opponent?: string;
  position?: string;
  bats?: string;
  throws?: string;
  battingOrder?: number | string;
  source?: string;
  confidence?: number;
  headshot?: string;
};

type Game = {
  gamePk?: number | string;
  id?: number | string;
  awayTeam?: string;
  homeTeam?: string;
  away?: string;
  home?: string;
  gameTime?: string;
  startTime?: string;
  venue?: string;
  status?: string;
  lineupConfirmed?: boolean;
  awayPitcher?: Pitcher | null;
  homePitcher?: Pitcher | null;
  awayLineup?: Player[];
  homeLineup?: Player[];
  players?: Player[];
  totalPlayers?: number;
};

type DailyBoardResponse = {
  ok?: boolean;
  date?: string;
  games?: Game[];
  totalGames?: number;
  totalPlayers?: number;
  source?: string;
  updatedAt?: string;
};

interface DailyPlayersPageProps {
  onAddLegToParlay?: (player: any, prop: any) => void;
  onSectionChange?: (section: string) => void;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

function safeText(value: any, fallback = 'TBD'): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string' || typeof value === 'number') return String(value);

  if (typeof value === 'object') {
    return (
      value.fullName ||
      value.name ||
      value.displayName ||
      value.abbrev ||
      value.abbreviation ||
      value.code ||
      fallback
    );
  }

  return fallback;
}

function playerName(player: Player) {
  return safeText(player.playerName || player.name, 'Unknown Player');
}

function pitcherName(pitcher?: Pitcher | null) {
  if (!pitcher) return 'TBD';
  return safeText(pitcher.name || pitcher.fullName, 'TBD');
}

function teamName(value?: any) {
  return safeText(value, 'TBD');
}

function getGamePlayers(game: Game): Player[] {
  const away = Array.isArray(game.awayLineup) ? game.awayLineup : [];
  const home = Array.isArray(game.homeLineup) ? game.homeLineup : [];

  // Backend sends clean split lineups. Some fallback paths also include
  // `players` as a combined copy, so only use it when split lineups are empty.
  if (away.length || home.length) {
    return [...away, ...home];
  }

  return Array.isArray(game.players) ? game.players : [];
}

function normalizeResponse(raw: any): DailyBoardResponse {
  const data = raw?.payload || raw?.data || raw || {};
  const games = Array.isArray(data.games) ? data.games : [];

  return {
    ok: data.ok ?? raw?.ok ?? true,
    date: data.date || todayISO(),
    games,
    totalGames: data.totalGames ?? games.length,
    totalPlayers:
      data.totalPlayers ??
      games.reduce((sum: number, game: Game) => sum + getGamePlayers(game).length, 0),
    source: data.source || 'daily-player-board',
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

function dataQuality(game: Game) {
  const total = getGamePlayers(game).length;
  if (game.lineupConfirmed && total > 0) return 'CONFIRMED';
  if (total > 0) return 'PROJECTED';
  if (game.awayPitcher || game.homePitcher) return 'PITCHERS';
  return 'GAME SHELL';
}

function qualityClass(label: string) {
  if (label === 'CONFIRMED') return 'border-vouch-emerald/40 bg-vouch-emerald/10 text-vouch-emerald';
  if (label === 'PROJECTED') return 'border-vouch-cyan/35 bg-vouch-cyan/10 text-vouch-cyan';
  if (label === 'PITCHERS') return 'border-vouch-cyan/30 bg-vouch-cyan/8 text-vouch-cyan/90';
  return 'border-white/10 bg-black/25 text-white/45';
}

function positionClass(pos?: string) {
  const p = String(pos || '').toUpperCase();
  if (p === 'P') return 'text-vouch-cyan';
  if (['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'OF'].includes(p)) return 'text-white/70';
  return 'text-white/40';
}

function playerHeadshot(player: Player): string | null {
  const id = player.playerId || player.id;
  if (!id) return null;

  // MLBAM image pattern. Good lightweight fallback for player cards.
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_180,q_auto:best/v1/people/${id}/headshot/67/current`;
}

function teamLogoUrl(team: any): string | null {
  const id = team?.id || team?.teamId || team?.mlbId;
  if (!id) return null;
  return `https://www.mlbstatic.com/team-logos/${id}.svg`;
}

function gameTeamId(game: Game, side: 'away' | 'home'): string | number | undefined {
  const anyGame: any = game;
  return (
    anyGame?.[`${side}TeamId`] ||
    anyGame?.teams?.[side]?.team?.id ||
    anyGame?.[side]?.id ||
    undefined
  );
}

function formatGameTime(value?: string) {
  if (!value) return 'Time TBD';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function matchupStatus(game: Game) {
  const total = getGamePlayers(game).length;
  if (game.lineupConfirmed && total >= 16) return 'Lineups confirmed';
  if (total > 0) return 'Projected hitters';
  if (game.awayPitcher || game.homePitcher) return 'Pitchers posted';
  return 'Game shell';
}

function matchupStatusClass(status: string) {
  if (status === 'Lineups confirmed') return 'border-vouch-emerald/40 bg-vouch-emerald/10 text-vouch-emerald';
  if (status === 'Projected hitters') return 'border-vouch-cyan/35 bg-vouch-cyan/10 text-vouch-cyan';
  if (status === 'Pitchers posted') return 'border-vouch-cyan/30 bg-vouch-cyan/8 text-vouch-cyan/90';
  return 'border-white/10 bg-black/25 text-white/45';
}

function scrollToGame(gamePk?: string | number) {
  if (!gamePk) return;
  const element = document.getElementById(`daily-game-${gamePk}`);
  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function TeamLogoBadge({ id, name, align = 'left' }: { id?: string | number; name: string; align?: 'left' | 'right' }) {
  const src = id ? `https://www.mlbstatic.com/team-logos/${id}.svg` : null;

  return (
    <div className={`flex min-w-0 items-center gap-2 ${align === 'right' ? 'justify-end' : ''}`}>
      {align === 'left' && (
        <div data-page="daily-players" className="daily-players-page flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[hsl(var(--ve-border)/0.32)] bg-white/95 p-1 shadow-lg shadow-[hsl(var(--ve-shadow)/0.18)]">
          {src ? <img src={src} alt={name} className="h-full w-full min-w-0 object-contain" loading="lazy" /> : <span className="text-xs font-black text-slate-900">{name.slice(0, 2)}</span>}
        </div>
      )}

      <div className={`min-w-0 ${align === 'right' ? 'text-right' : ''}`}>
        <div className="truncate text-sm font-black text-[hsl(var(--ve-text-primary))]">{name}</div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--ve-text-muted))]">
          {align === 'right' ? 'Home' : 'Away'}
        </div>
      </div>

      {align === 'right' && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[hsl(var(--ve-border)/0.32)] bg-white/95 p-1 shadow-lg shadow-[hsl(var(--ve-shadow)/0.18)]">
          {src ? <img src={src} alt={name} className="h-full w-full object-contain" loading="lazy" /> : <span className="text-xs font-black text-slate-900">{name.slice(0, 2)}</span>}
        </div>
      )}
    </div>
  );
}


function DailyPlayersSkeleton() {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-[hsl(var(--ve-border)/0.34)] bg-[linear-gradient(135deg,hsl(var(--ve-surface)/0.78),hsl(var(--ve-bg-panel)/0.92),rgba(0,240,255,0.10))] p-5 shadow-2xl shadow-[hsl(var(--ve-shadow)/0.20)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="h-4 w-40 animate-pulse rounded-full bg-vouch-cyan/20" />
            <div className="mt-4 h-9 w-72 animate-pulse rounded-2xl bg-[hsl(var(--ve-surface-raised)/0.52)]" />
            <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded-full bg-[hsl(var(--ve-surface-raised)/0.52)]" />
          </div>
          <div className="hidden h-12 w-36 animate-pulse rounded-2xl bg-vouch-cyan/10 md:block" />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="rounded-2xl border border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface-raised)/0.34)] p-4">
              <div className="h-3 w-24 animate-pulse rounded-full bg-[hsl(var(--ve-surface-raised)/0.52)]" />
              <div className="mt-3 h-7 w-16 animate-pulse rounded-xl bg-[hsl(var(--ve-surface-raised)/0.70)]" />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[hsl(var(--ve-border)/0.34)] bg-[hsl(var(--ve-surface)/0.74)] p-4 shadow-2xl shadow-[hsl(var(--ve-shadow)/0.18)] backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="h-4 w-44 animate-pulse rounded-full bg-vouch-cyan/20" />
            <div className="mt-2 h-3 w-64 animate-pulse rounded-full bg-[hsl(var(--ve-surface-raised)/0.52)]" />
          </div>
          <div className="hidden h-7 w-20 animate-pulse rounded-full bg-[hsl(var(--ve-surface-raised)/0.52)] sm:block" />
        </div>

        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="min-w-[310px] rounded-3xl border border-[hsl(var(--ve-border)/0.28)] bg-[linear-gradient(135deg,hsl(var(--ve-surface-raised)/0.42),hsl(var(--ve-bg-panel)/0.82),rgba(0,240,255,0.08))] p-4"
            >
              <div className="mb-4 flex justify-between">
                <div className="h-6 w-28 animate-pulse rounded-full bg-[hsl(var(--ve-surface-raised)/0.52)]" />
                <div className="h-4 w-16 animate-pulse rounded-full bg-[hsl(var(--ve-surface-raised)/0.52)]" />
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 animate-pulse rounded-2xl bg-white/20" />
                  <div>
                    <div className="h-4 w-24 animate-pulse rounded-full bg-[hsl(var(--ve-surface-raised)/0.52)]" />
                    <div className="mt-2 h-3 w-12 animate-pulse rounded-full bg-[hsl(var(--ve-surface-raised)/0.52)]" />
                  </div>
                </div>
                <div className="h-7 w-7 animate-pulse rounded-full bg-[hsl(var(--ve-surface-raised)/0.52)]" />
                <div className="flex items-center justify-end gap-2">
                  <div>
                    <div className="h-4 w-24 animate-pulse rounded-full bg-[hsl(var(--ve-surface-raised)/0.52)]" />
                    <div className="ml-auto mt-2 h-3 w-12 animate-pulse rounded-full bg-[hsl(var(--ve-surface-raised)/0.52)]" />
                  </div>
                  <div className="h-10 w-10 animate-pulse rounded-2xl bg-white/20" />
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface-raised)/0.28)] p-3">
                <div className="h-3 w-full animate-pulse rounded-full bg-[hsl(var(--ve-surface-raised)/0.52)]" />
                <div className="mt-2 h-3 w-5/6 animate-pulse rounded-full bg-[hsl(var(--ve-surface-raised)/0.52)]" />
                <div className="mt-2 h-3 w-4/6 animate-pulse rounded-full bg-[hsl(var(--ve-surface-raised)/0.52)]" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {[0, 1].map((game) => (
        <section
          key={game}
          className="overflow-hidden rounded-3xl border border-[hsl(var(--ve-border)/0.34)] bg-[hsl(var(--ve-surface)/0.74)] shadow-2xl shadow-[hsl(var(--ve-shadow)/0.18)] backdrop-blur-xl"
        >
          <div className="border-b border-[hsl(var(--ve-border)/0.30)] bg-[linear-gradient(90deg,hsl(var(--ve-surface-raised)/0.46),hsl(var(--ve-bg-panel)/0.82))] p-4">
            <div className="h-5 w-40 animate-pulse rounded-full bg-[hsl(var(--ve-surface-raised)/0.52)]" />
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr]">
              <div className="h-16 animate-pulse rounded-2xl bg-[hsl(var(--ve-surface-raised)/0.44)]" />
              <div className="h-12 w-20 animate-pulse rounded-2xl bg-[hsl(var(--ve-surface-raised)/0.44)]" />
              <div className="h-16 animate-pulse rounded-2xl bg-[hsl(var(--ve-surface-raised)/0.44)]" />
            </div>
          </div>

          <div className="grid gap-4 p-4 lg:grid-cols-2">
            {[0, 1].map((side) => (
              <div key={side} className="rounded-3xl border border-[hsl(var(--ve-border)/0.30)] bg-[hsl(var(--ve-surface)/0.66)] p-3">
                <div className="mb-3 h-12 animate-pulse rounded-2xl bg-[hsl(var(--ve-surface-raised)/0.44)]" />
                <div className="grid gap-2">
                  {[0, 1, 2, 3].map((player) => (
                    <div key={player} className="flex gap-3 rounded-2xl border border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface-raised)/0.42)] p-3">
                      <div className="h-16 w-16 animate-pulse rounded-2xl bg-[hsl(var(--ve-surface-raised)/0.52)]" />
                      <div className="flex-1">
                        <div className="h-4 w-40 animate-pulse rounded-full bg-[hsl(var(--ve-surface-raised)/0.52)]" />
                        <div className="mt-2 h-3 w-28 animate-pulse rounded-full bg-[hsl(var(--ve-surface-raised)/0.52)]" />
                        <div className="mt-3 h-5 w-32 animate-pulse rounded-full bg-[hsl(var(--ve-surface-raised)/0.52)]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}



function TeamVsTeamShowcase({ games }: { games: any[] }) {
  const getTeam = (game: any, side: "away" | "home") => {
    const raw =
      side === "away"
        ? game?.awayTeam || game?.away || game?.teams?.away?.team
        : game?.homeTeam || game?.home || game?.teams?.home?.team;

    if (!raw) return { name: "TBD", abbr: "TBD", logo: "" };
    if (typeof raw === "string") return { name: raw, abbr: raw.slice(0, 3).toUpperCase(), logo: "" };

    return {
      name: raw.name || raw.teamName || raw.shortName || raw.abbreviation || "TBD",
      abbr: raw.abbreviation || raw.teamName || raw.shortName || raw.name?.slice(0, 3)?.toUpperCase() || "TBD",
      logo: raw.logo || raw.logoUrl || raw.teamLogo || raw.image || "",
    };
  };

  const getTime = (game: any) => {
    const raw = game?.gameDate || game?.startTime || game?.dateTime || game?.time;
    if (!raw) return "Today";
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return String(raw);
    return parsed.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const getPitcher = (game: any, side: "away" | "home") => {
    const value =
      side === "away"
        ? game?.awayPitcher || game?.away_sp || game?.probablePitchers?.away || game?.teams?.away?.probablePitcher
        : game?.homePitcher || game?.home_sp || game?.probablePitchers?.home || game?.teams?.home?.probablePitcher;

    if (!value) return "Projected SP";
    if (typeof value === "string") return value;
    return value.fullName || value.name || "Projected SP";
  };

  const visibleGames = games.slice(0, 18);
  const loopingGames = visibleGames.length > 0 ? [...visibleGames, ...visibleGames] : [];

  return (
    <section className="daily-team-showcase" aria-label="Team versus team slideshow">
      <div className="daily-team-shortcuts" aria-label="Team shortcuts">
        {loopingGames.map((game: any, index: number) => {
          const away = getTeam(game, "away");
          const home = getTeam(game, "home");

          return (
            <a className="daily-team-shortcut" href={`#daily-game-${index}`} key={`shortcut-${game?.gamePk || game?.game_id || game?.id || index}`}>
              <span>{away.abbr}</span>
              <b>vs</b>
              <span>{home.abbr}</span>
            </a>
          );
        })}
      </div>

      <div className="daily-team-showcase-track">
        {visibleGames.map((game: any, index: number) => {
          const away = getTeam(game, "away");
          const home = getTeam(game, "home");

          return (
            <article className="daily-team-slide" id={`daily-game-${index % Math.max(visibleGames.length, 1)}`} key={`slide-${index}-${game?.gamePk || game?.game_id || game?.id || "game"}`}>
              <div className="daily-team-slide-top">
                <span>Game {index + 1}</span>
                <strong>{getTime(game)}</strong>
              </div>

              <div className="daily-team-versus">
                <div className="daily-team-side">
                  <div className="daily-team-logo">
                    {away.logo ? <img src={away.logo} alt="" /> : <span>{away.abbr.slice(0, 2)}</span>}
                  </div>
                  <h3>{away.name}</h3>
                  <p>SP: {getPitcher(game, "away")}</p>
                </div>

                <div className="daily-team-vs-pill">VS</div>

                <div className="daily-team-side daily-team-side-right">
                  <div className="daily-team-logo">
                    {home.logo ? <img src={home.logo} alt="" /> : <span>{home.abbr.slice(0, 2)}</span>}
                  </div>
                  <h3>{home.name}</h3>
                  <p>SP: {getPitcher(game, "home")}</p>
                </div>
              </div>

              <div className="daily-team-slide-footer">
                <span>Projected matchup</span>
                <span>Scroll for next team →</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}


function LiveTeamsStrip({ games }: { games: any[] }) {
  const getTeamName = (team: any) => {
    if (!team) return "TBD";
    if (typeof team === "string") return team;
    return team.name || team.teamName || team.abbreviation || team.shortName || "TBD";
  };

  const getGameTime = (game: any) => {
    const raw = game?.gameDate || game?.startTime || game?.dateTime || game?.time;
    if (!raw) return "Today";
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return String(raw);
    return parsed.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const marqueeGames = games.length > 0 ? [...games, ...games] : [];

  return (
    <section className="daily-live-teams-strip" aria-label="Live teams today">
      <div className="daily-live-teams-header">
        <div>
          <p className="daily-live-eyebrow">Today’s slate</p>
          <h2>Live Teams</h2>
        </div>
        <p>{games.length} games loaded</p>
      </div>

      <div className="daily-live-teams-scroller" aria-live="off">
        <div className="daily-live-teams-track">
        {marqueeGames.map((game: any, index: number) => {
          const away = getTeamName(game?.awayTeam || game?.away || game?.teams?.away?.team);
          const home = getTeamName(game?.homeTeam || game?.home || game?.teams?.home?.team);

          return (
            <article className="daily-live-team-card" key={game?.gamePk || game?.game_id || game?.id || index}>
              <div className="daily-live-status">
                <span>MLB</span>
                <strong>{getGameTime(game)}</strong>
              </div>

              <div className="daily-live-matchup">
                <span>{away}</span>
                <b>@</b>
                <span>{home}</span>
              </div>

              <div className="daily-live-card-footer">
                <span>Open matchup</span>
                <span>Research board →</span>
              </div>
            </article>
          );
        })}
        </div>
      </div>
    </section>
  );
}


function MatchupRail({ games }: { games: Game[] }) {
  if (!games.length) return null;

  return (
    <section className="rounded-3xl border border-[hsl(var(--ve-border)/0.34)] bg-[hsl(var(--ve-surface)/0.74)] p-4 shadow-2xl shadow-[hsl(var(--ve-shadow)/0.18)] backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-black uppercase tracking-[0.22em] text-vouch-cyan">
            Today’s Matchups
          </div>
          <div className="mt-1 text-xs text-[hsl(var(--ve-text-muted))]">
            Side-scroll board updates with the day’s MLB slate.
          </div>
        </div>

        <div className="hidden rounded-full border border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface-raised)/0.42)] px-3 py-1 text-xs font-bold text-[hsl(var(--ve-text-muted))] sm:block">
          Scroll →
        </div>
      </div>

      <div className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-1">
        {games.map((game, index) => {
          const awayTeam = teamName(game.awayTeam || (game as any).away);
          const homeTeam = teamName(game.homeTeam || (game as any).home);
          const awayId = gameTeamId(game, 'away');
          const homeId = gameTeamId(game, 'home');
          const status = matchupStatus(game);

          return (
            <button
              key={`${game.gamePk || game.id || index}-rail`}
              type="button"
              onClick={() => scrollToGame(game.gamePk || game.id)}
              className="min-w-[310px] snap-start rounded-3xl border border-[hsl(var(--ve-border)/0.28)] bg-[linear-gradient(135deg,hsl(var(--ve-surface-raised)/0.42),hsl(var(--ve-bg-panel)/0.82),rgba(0,240,255,0.08))] p-4 text-left shadow-xl shadow-[hsl(var(--ve-shadow)/0.18)] transition hover:-translate-y-0.5 hover:border-vouch-cyan/40 hover:shadow-vouch-cyan/15"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${matchupStatusClass(status)}`}>
                  {status}
                </span>
                <span className="text-[11px] font-bold text-[hsl(var(--ve-text-muted))]">
                  {formatGameTime(game.gameTime || game.startTime)}
                </span>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <TeamLogoBadge id={awayId} name={awayTeam} />
                <div className="rounded-full border border-[hsl(var(--ve-border)/0.32)] bg-[hsl(var(--ve-surface-raised)/0.42)] px-2 py-1 text-[10px] font-black text-[hsl(var(--ve-text-muted))]">
                  @
                </div>
                <TeamLogoBadge id={homeId} name={homeTeam} align="right" />
              </div>

              <div className="mt-4 grid gap-2 rounded-2xl border border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface-raised)/0.28)] p-3 text-[11px]">
                <div className="flex justify-between gap-3">
                  <span className="text-[hsl(var(--ve-text-muted))]">Away SP</span>
                  <span className="truncate font-bold text-vouch-cyan">{pitcherName(game.awayPitcher)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-[hsl(var(--ve-text-muted))]">Home SP</span>
                  <span className="truncate font-bold text-vouch-cyan">{pitcherName(game.homePitcher)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-[hsl(var(--ve-text-muted))]">Venue</span>
                  <span className="truncate font-bold text-[hsl(var(--ve-text-secondary))]">{game.venue || 'TBD'}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}


function orderNumber(player: Player): number {
  const raw = String(player.battingOrder || '').replace(/\D/g, '');
  const num = Number(raw);
  return Number.isFinite(num) && num > 0 ? num : 999;
}

function sortLineup(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    const orderDiff = orderNumber(a) - orderNumber(b);
    if (orderDiff !== 0) return orderDiff;
    return playerName(a).localeCompare(playerName(b));
  });
}


function TeamInitialIcon({ name }: { name: string }) {
  const safe = name || "TBD";
  const words = safe.split(/\s+/).filter(Boolean);
  const initials =
    words.length >= 2
      ? `${words[0][0]}${words[1][0]}`.toUpperCase()
      : safe.slice(0, 2).toUpperCase();

  return (
    <span
      className="inline-grid h-8 w-8 shrink-0 place-items-center border border-white/10 bg-black/30 font-mono text-[10px] font-bold uppercase text-vouch-cyan/80"
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}


function handednessLabel(hand?: string | null): string {
  const normalized = String(hand || "").slice(0, 1).toUpperCase();
  if (normalized === "L") return "Left";
  if (normalized === "R") return "Right";
  if (normalized === "S") return "Switch";
  return "Unknown";
}

function handednessClass(hand?: string | null): string {
  const normalized = String(hand || '').slice(0, 1).toUpperCase();
  if (normalized === 'L') return 'border-vouch-cyan/35 bg-vouch-cyan/10 text-vouch-cyan';
  if (normalized === 'R') return 'border-white/15 bg-black/30 text-white/65';
  if (normalized === 'S') return 'border-vouch-cyan/25 bg-vouch-cyan/8 text-vouch-cyan/80';
  return 'border-white/10 bg-black/25 text-white/40';
}

function HandednessBadge({ hand, prefix = 'Bats' }: { hand?: string | null; prefix?: string }) {
  const normalized = String(hand || '').slice(0, 1).toUpperCase() || 'U';
  const label = handednessLabel(normalized);

  return (
    <span
      className={`inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${handednessClass(normalized)}`}
      title={`${prefix} ${label}`}
      aria-label={`${prefix} ${label}`}
    >
      <span className="opacity-70">{prefix}</span>
      <span>{normalized}</span>
    </span>
  );
}


function PlayerCard({ player, index }: { player: Player; index: number }) {
  const headshot = playerHeadshot(player);
  const isProjected = String(player.source || '').toLowerCase().includes('projected');
  const order = orderNumber(player) === 999 ? index + 1 : orderNumber(player);

  return (
    <div className="group flex gap-3 rounded-2xl border border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface-raised)/0.42)] p-3 shadow-lg shadow-[hsl(var(--ve-shadow)/0.14)] transition hover:border-vouch-cyan/40 hover:bg-[hsl(var(--ve-surface-raised)/0.58)]">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[hsl(var(--ve-border)/0.34)] bg-[hsl(var(--ve-surface-raised)/0.52)]">
        {headshot ? (
          <img
            src={headshot}
            alt={playerName(player)}
            className={MLB_HEADSHOT_IMG_CLASS}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-black text-[hsl(var(--ve-text-muted))]">
            {playerName(player).slice(0, 1)}
          </div>
        )}

        <div className="absolute bottom-1 left-1 rounded-full bg-[hsl(var(--ve-bg-deep)/0.72)] px-1.5 py-0.5 text-[10px] font-black text-[hsl(var(--ve-text-primary))] backdrop-blur-sm">
          #{order}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-white">
              {playerName(player)}
            </div>
            <div className="mt-0.5 text-[11px] font-semibold text-[hsl(var(--ve-text-muted))]">
              {teamName(player.team)} vs {teamName(player.opponent)}
            </div>
          </div>

          <span className={`rounded-full bg-[hsl(var(--ve-surface-raised)/0.52)] px-2 py-1 text-[10px] font-black ${positionClass(player.position)}`}>
            {player.position || '—'}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
          {player.bats && <HandednessBadge hand={player.bats} prefix="Bats" />}

          <span
            className={`rounded-full border px-2 py-1 font-bold ${
              isProjected
                ? 'border-vouch-amber/25 bg-vouch-amber/10 text-vouch-amber'
                : 'border-vouch-cyan/30 bg-vouch-cyan/10 text-vouch-cyan'
            }`}
          >
            {isProjected ? 'Projected' : 'Confirmed'}
          </span>
        </div>
      </div>
    </div>
  );
}


function getPlayerImage(player: Player) {
  const direct = getDailyPlayerHeadshotUrl(player);
  if (direct) return direct;

  const raw = player as any;
  return (
    raw.headshotUrl ||
    raw.headshot ||
    raw.imageUrl ||
    raw.image ||
    raw.photoUrl ||
    raw.mlbHeadshotUrl ||
    ""
  );
}

function CompactRosterColumn({
  team,
  opponent,
  players,
}: {
  team: string;
  opponent: string;
  players: Player[];
}) {
  const roster = sortLineup(players).slice(0, 9);

  return (
    <section className="dp-roster-column">
      <header className="dp-roster-head">
        <TeamInitialIcon name={team} />
        <div>
          <h3>{team}</h3>
          <p>{roster.length}/9 hitters loaded</p>
        </div>
      </header>

      <div className="dp-roster-list">
        {roster.map((player, index) => {
          const name = playerName(player);
          const img = getPlayerImage(player);
          const isProjected = player.source === "projected";

          return (
            <article className="dp-player-row" key={`${player.playerId || player.id || name}-${index}`}>
              <span className="dp-slot">{index + 1}</span>

              <span className="dp-avatar">
                {img ? (
                  <img
                    src={img}
                    alt=""
                    className={MLB_HEADSHOT_IMG_CLASS}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                  />
                ) : (
                  name.slice(0, 2).toUpperCase()
                )}
              </span>

              <span className="dp-player-main">
                <strong>{name}</strong>
                <em>
                  {player.position || "BAT"}
                  {player.bats ? ` · ${player.bats}` : ""}
                </em>
              </span>

              <span className={isProjected ? "dp-status is-projected" : "dp-status"}>
                {isProjected ? "Proj" : "Live"}
              </span>
            </article>
          );
        })}

        {Array.from({ length: Math.max(0, 9 - roster.length) }).map((_, index) => (
          <article className="dp-player-row is-empty" key={`empty-${team}-${index}`}>
            <span className="dp-slot">–</span>
            <span className="dp-avatar">–</span>
            <span className="dp-player-main">
              <strong>Lineup pending</strong>
              <em>{opponent}</em>
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

function GameCard({ game }: { game: any; search?: string }) {
  const awayTeam = teamName(game.awayTeam || game.away);
  const homeTeam = teamName(game.homeTeam || game.home);
  const allPlayers = getGamePlayers(game);

  let awayPlayers = allPlayers.filter((player) => teamName(player.team) === awayTeam);
  let homePlayers = allPlayers.filter((player) => teamName(player.team) === homeTeam);

  if (!awayPlayers.length || !homePlayers.length) {
    awayPlayers = allPlayers.slice(0, 9);
    homePlayers = allPlayers.slice(9, 18);
  }

  return (
    <section className="dp-game-card">
      <header className="dp-game-head">
        <div className="dp-team-title">
          <TeamInitialIcon name={awayTeam} />
          <div>
            <h2>{awayTeam}</h2>
            <p>Away lineup</p>
          </div>
        </div>

        <div className="dp-vs">
          <span>Matchup</span>
          <strong>VS</strong>
        </div>

        <div className="dp-team-title is-right">
          <div>
            <h2>{homeTeam}</h2>
            <p>Home lineup</p>
          </div>
          <TeamInitialIcon name={homeTeam} />
        </div>
      </header>

      <div className="dp-roster-grid">
        <CompactRosterColumn team={awayTeam} opponent={homeTeam} players={awayPlayers} />
        <CompactRosterColumn team={homeTeam} opponent={awayTeam} players={homePlayers} />
      </div>
    </section>
  );
}

async function fetchProjectedHitters(
  teamId: number | string,
  teamName: string,
  opponent: string
): Promise<Player[]> {
  try {
    const rosterUrl = `https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=active`;
    const response = await fetch(rosterUrl, { headers: { accept: 'application/json' } });
    if (!response.ok) return [];

    const data = await response.json();
    const roster = Array.isArray(data?.roster) ? data.roster : [];

    const hitters = roster
      .filter((item: any) => {
        const pos = item?.position?.abbreviation || item?.person?.primaryPosition?.abbreviation || '';
        return pos && pos !== 'P';
      })
      .slice(0, 9);

    const ids = hitters.map((item: any) => item?.person?.id).filter(Boolean);
    const handById = new Map<number, string>();

    if (ids.length) {
      try {
        const peopleUrl = `https://statsapi.mlb.com/api/v1/people?personIds=${ids.join(",")}`;
        const peopleResponse = await fetch(peopleUrl, { headers: { accept: 'application/json' } });
        if (peopleResponse.ok) {
          const peopleData = await peopleResponse.json();
          for (const person of peopleData?.people || []) {
            const code = String(person?.batSide?.code || '').trim().slice(0, 1).toUpperCase();
            if (person?.id && ['L', 'R', 'S'].includes(code)) {
              handById.set(Number(person.id), code);
            }
          }
        }
      } catch {
        // Keep projected roster usable even if handedness enrichment fails.
      }
    }

    return hitters.map((item: any, index: number) => {
      const playerId = item?.person?.id;
      return {
        playerId,
        playerName: item?.person?.fullName || item?.person?.name || 'Unknown Player',
        team: teamName,
        opponent,
        position: item?.position?.abbreviation || item?.person?.primaryPosition?.abbreviation || '—',
        bats: handById.get(Number(playerId)),
        throws: undefined,
        battingOrder: index + 1,
        source: 'PROJECTED_active_roster_until_lineup_posts',
        confidence: 0.4,
      };
    });
  } catch {
    return [];
  }
}

async function fetchDirectMlbScheduleBoard(): Promise<DailyBoardResponse> {
  const date = todayISO();
  const scheduleUrl =
    `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}&hydrate=probablePitcher,team,venue`;

  const response = await fetch(scheduleUrl, { headers: { accept: 'application/json' } });

  if (!response.ok) {
    throw new Error(`MLB direct schedule failed: ${response.status}`);
  }

  const schedule = await response.json();
  const rawGames = schedule?.dates?.flatMap((d: any) => d?.games || []) || [];

  const games: Game[] = await Promise.all(
    rawGames.map(async (game: any) => {
      const awayTeamObj = game?.teams?.away?.team;
      const homeTeamObj = game?.teams?.home?.team;
      const awayTeam = awayTeamObj?.name || 'Away';
      const homeTeam = homeTeamObj?.name || 'Home';

      const awayPitcherRaw = game?.teams?.away?.probablePitcher;
      const homePitcherRaw = game?.teams?.home?.probablePitcher;

      const awayLineup = game?.teams?.away?.team?.id
        ? await fetchProjectedHitters(game.teams.away.team.id, awayTeam, homeTeam)
        : [];

      const homeLineup = game?.teams?.home?.team?.id
        ? await fetchProjectedHitters(game.teams.home.team.id, homeTeam, awayTeam)
        : [];

      const players = [...awayLineup, ...homeLineup];

      return {
        gamePk: game?.gamePk,
        awayTeam: awayTeamObj || awayTeam,
        homeTeam: homeTeamObj || homeTeam,
        awayTeamId: awayTeamObj?.id || game?.teams?.away?.team?.id,
        homeTeamId: homeTeamObj?.id || game?.teams?.home?.team?.id,
        gameTime: game?.gameDate || '',
        venue: game?.venue?.name || '',
        status: game?.status?.detailedState || game?.status?.abstractGameState || 'Scheduled',
        awayPitcher: awayPitcherRaw
          ? {
              id: awayPitcherRaw.id,
              name: awayPitcherRaw.fullName || awayPitcherRaw.name || 'TBD',
              throws: awayPitcherRaw?.pitchHand?.code || '',
            }
          : null,
        homePitcher: homePitcherRaw
          ? {
              id: homePitcherRaw.id,
              name: homePitcherRaw.fullName || homePitcherRaw.name || 'TBD',
              throws: homePitcherRaw?.pitchHand?.code || '',
            }
          : null,
        lineupConfirmed: false,
        awayLineup,
        homeLineup,
        players,
        totalPlayers: players.length,
      };
    })
  );

  const totalPlayers = games.reduce((sum, game) => sum + getGamePlayers(game).length, 0);

  return {
    ok: true,
    date,
    games,
    totalGames: games.length,
    totalPlayers,
    source: 'direct_mlb_statsapi_projected_hitters',
    updatedAt: new Date().toISOString(),
  };
}




function getTeamLabel(team: any): string {
  if (!team) return "Team TBD";

  if (typeof team === "string") {
    return team.trim() || "Team TBD";
  }

  const raw =
    team.name ||
    team.teamName ||
    team.clubName ||
    team.fullName ||
    team.displayName ||
    team.shortName ||
    team.abbreviation ||
    team.abbrev ||
    team.teamAbbr ||
    team.code ||
    "Team TBD";

  return String(raw).trim() || "Team TBD";
}

function getSafeArray(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

function getTeamAbbrSafe(team: any): string {
  if (!team) return "TBD";
  if (typeof team === "string") {
    const parts = team.trim().split(/\s+/);
    return parts.length >= 2 ? parts.map((part) => part[0]).join("").slice(0, 3).toUpperCase() : team.slice(0, 3).toUpperCase();
  }

  const raw =
    team.abbreviation ||
    team.abbrev ||
    team.teamAbbr ||
    team.code ||
    team.fileCode ||
    team.shortName ||
    team.name ||
    team.teamName ||
    "TBD";

  const value = String(raw).trim();
  if (value.length <= 4) return value.toUpperCase();

  const words = value.split(/\s+/).filter(Boolean);
  return words.length >= 2 ? words.map((word) => word[0]).join("").slice(0, 3).toUpperCase() : value.slice(0, 3).toUpperCase();
}


function getTeamIdSafe(team: any): string {
  const raw =
    team?.id ||
    team?.teamId ||
    team?.team_id ||
    team?.mlbId ||
    team?.mlb_id ||
    team?.sportRadarId ||
    "";

  return raw ? String(raw).trim() : "";
}

function getDailyPlayerIdSafe(player: any): string {
  const raw =
    player?.id ||
    player?.playerId ||
    player?.player_id ||
    player?.mlbId ||
    player?.mlb_id ||
    player?.person?.id ||
    player?.personId ||
    "";

  return raw ? String(raw).trim() : "";
}

function getDailyPlayerHeadshotUrl(player: any): string {
  const direct =
    player?.headshot ||
    player?.headshotUrl ||
    player?.image ||
    player?.imageUrl ||
    player?.playerImage ||
    player?.photo ||
    "";

  if (direct) return String(direct);

  const id = getDailyPlayerIdSafe(player);
  if (!id) return "";

  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_180,q_auto:best,f_auto/v1/people/${id}/headshot/67/current`;
}

function getTeamLogoUrl(team: any, gameTeamId?: string | number | null): string {
  const direct =
    team?.logo ||
    team?.logoUrl ||
    team?.image ||
    team?.imageUrl ||
    team?.teamLogo ||
    "";

  if (direct) return String(direct);

  const id = getTeamIdSafe(team) || (gameTeamId ? String(gameTeamId) : "");
  if (id) return logoByTeamId(Number(id)) || "";

  return logoByTeamName(getTeamLabel(team)) || "";
}

function resolveDailyTeam(game: any, side: "away" | "home") {
  const raw = side === "away" ? game?.awayTeam : game?.homeTeam;
  const gameTeamId = game?.[`${side}TeamId`];

  if (raw && typeof raw === "object") {
    return {
      ...raw,
      id: raw.id || raw.teamId || gameTeamId || teamIdByName(getTeamLabel(raw)),
      name: getTeamLabel(raw),
      abbreviation: getTeamAbbrSafe(raw),
    };
  }

  const name = getTeamLabel(raw);
  return {
    id: gameTeamId || teamIdByName(name),
    name,
    abbreviation: getTeamAbbrSafe(raw),
  };
}

function getMlbPlayerUrl(player: any): string {
  const id = getDailyPlayerIdSafe(player);
  return id ? `https://www.mlb.com/player/${id}` : "";
}


function getDailyPlayersForSide(game: any, side: "away" | "home"): any[] {
  const team = side === "away" ? game?.awayTeam : game?.homeTeam;

  const candidates = [
    game?.[`${side}Players`],
    game?.[`${side}Lineup`],
    game?.[`${side}Hitters`],
    game?.[`${side}Starters`],
    game?.[side]?.players,
    game?.[side]?.lineup,
    game?.[side]?.hitters,
    game?.teams?.[side]?.players,
    game?.teams?.[side]?.lineup,
    game?.lineups?.[side],
    team?.players,
    team?.lineup,
    team?.hitters,
    team?.starters,
  ];

  const firstArray = candidates.find((candidate) => Array.isArray(candidate));
  return getSafeArray(firstArray)
    .filter(Boolean)
    .sort((a, b) => {
      const ao = Number(a?.battingOrder ?? a?.batting_order ?? a?.order ?? a?.lineupSpot ?? a?.spot ?? 99);
      const bo = Number(b?.battingOrder ?? b?.batting_order ?? b?.order ?? b?.lineupSpot ?? b?.spot ?? 99);
      return ao - bo;
    })
    .slice(0, 9);
}

function getDailyPlayerName(player: any): string {
  return String(
    player?.fullName ||
      player?.name ||
      player?.playerName ||
      player?.displayName ||
      player?.person?.fullName ||
      player?.person?.name ||
      "Player TBD"
  );
}

function getDailyPlayerInitials(player: any): string {
  const name = getDailyPlayerName(player);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getDailyPlayerPosition(player: any): string {
  return String(
    player?.position ||
      player?.primaryPosition?.abbreviation ||
      player?.primaryPosition?.name ||
      player?.pos ||
      player?.fieldPosition ||
      "UTIL"
  );
}

function getDailyPlayerHand(player: any): string {
  const raw =
    player?.bats ||
    player?.batSide?.code ||
    player?.batSide?.description ||
    player?.batSide?.name ||
    player?.batHand ||
    player?.hand ||
    "";

  const value = String(raw).trim().slice(0, 1).toUpperCase();
  return ["L", "R", "S"].includes(value) ? value : "—";
}

function getDailyPlayerOrder(player: any, index: number): string {
  return String(player?.battingOrder ?? player?.batting_order ?? player?.order ?? player?.lineupSpot ?? player?.spot ?? index + 1);
}

function getDailyStatus(game: any): string {
  const raw = String(game?.lineupStatus || game?.status || game?.gameStatus || "").toLowerCase();
  if (raw.includes("confirm") || raw.includes("final")) return "Confirmed";
  if (raw.includes("pending") || raw.includes("preview")) return "Pending";
  if (raw.includes("project")) return "Projected";

  const awayCount = getDailyPlayersForSide(game, "away").length;
  const homeCount = getDailyPlayersForSide(game, "home").length;
  if (awayCount >= 9 && homeCount >= 9) return "Projected";
  return "Pending";
}

function DailyTeamIcon({ team, gameTeamId, size = 'md' }: { team: any; gameTeamId?: string | number | null; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const name = getTeamLabel(team);
  const abbr = getTeamAbbrSafe(team);
  const logoUrl = getTeamLogoUrl(team, gameTeamId);
  const sizeClass =
    size === 'lg'
      ? 'h-8 w-8 sm:h-10 sm:w-10'
      : size === 'sm'
        ? 'h-6 w-6 sm:h-7 sm:w-7'
        : size === 'xs'
          ? 'h-5 w-5 sm:h-6 sm:w-6'
          : 'h-7 w-7 sm:h-8 sm:w-8';
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <span
      className={`relative inline-grid ${sizeClass} shrink-0 place-items-center overflow-hidden rounded-md border border-vouch-cyan/20 bg-white/95 p-0.5 shadow-sm shadow-black/20`}
      aria-hidden="true"
      title={name}
    >
      {logoUrl && !logoFailed ? (
        <img
          src={logoUrl}
          alt=""
          className="h-full w-full object-contain"
          loading="lazy"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <span className="font-mono text-[8px] font-black uppercase leading-none text-slate-800 sm:text-[9px]">
          {abbr.slice(0, 3)}
        </span>
      )}
    </span>
  );
}

function DailyStarterRow({ player, index, team, teamAbbr, search }: { player: any; index: number; team: any; teamAbbr: string; search: string }) {
  const name = getDailyPlayerName(player);
  const position = getDailyPlayerPosition(player);
  const hand = getDailyPlayerHand(player);
  const order = getDailyPlayerOrder(player, index);
  const playerImage = getDailyPlayerHeadshotUrl(player);
  const playerUrl = getMlbPlayerUrl(player);
  const query = search.trim().toLowerCase();
  const isMatch =
    query.length > 0 &&
    `${name} ${position} ${hand} ${teamAbbr}`.toLowerCase().includes(query);
  const isProjected = String(player?.source || '').toLowerCase().includes('project');

  return (
    <button
      type="button"
      className={`grid min-h-[52px] w-full grid-cols-[32px_44px_minmax(0,1fr)] items-center gap-2.5 border px-2.5 py-2 text-left font-z8 transition sm:min-h-[48px] sm:grid-cols-[28px_40px_minmax(0,1fr)_auto] sm:gap-2 sm:px-2 sm:py-1.5 ${
        isMatch
          ? 'border-vouch-cyan/45 bg-vouch-cyan/10'
          : 'border-white/10 bg-black/25 hover:border-vouch-cyan/30 hover:bg-vouch-cyan/5'
      }`}
      onClick={() => {
        if (playerUrl) window.open(playerUrl, '_blank', 'noopener,noreferrer');
      }}
      aria-label={playerUrl ? `Open ${name} MLB profile` : `${name} starter card`}
    >
      <div className={`${Z8_LABEL} flex h-7 w-7 items-center justify-center border border-vouch-cyan/25 bg-vouch-cyan/10 text-vouch-cyan`}>
        {order}
      </div>

      <div className="relative h-11 w-11 shrink-0 overflow-hidden border border-white/10 bg-black/40 sm:h-10 sm:w-10">
        {playerImage ? (
          <img
            src={playerImage}
            alt=""
            className={MLB_HEADSHOT_IMG_CLASS}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-mono text-[10px] font-bold text-white/50">
            {getDailyPlayerInitials(player)}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <strong className="block min-w-0 truncate font-mono text-xs font-bold uppercase tracking-wide text-white sm:text-[13px]">
            {name}
          </strong>
          <span
            className={`${Z8_LABEL} shrink-0 border px-1.5 py-0.5 sm:hidden ${isProjected ? 'border-vouch-cyan/30 bg-vouch-cyan/8 text-vouch-cyan/80' : 'border-vouch-emerald/30 bg-vouch-emerald/10 text-vouch-emerald'}`}
          >
            {isProjected ? 'Proj' : 'Live'}
          </span>
        </div>
        <span className="mt-0.5 flex flex-wrap items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-white/40">
          <DailyTeamIcon team={team} size="xs" />
          <span>{teamAbbr}</span>
          <span>·</span>
          <span>{position || 'UTIL'}</span>
          <HandednessBadge hand={hand} prefix="Bats" />
        </span>
      </div>

      <div className="hidden flex-col items-end gap-0.5 sm:flex">
        <span className={`${Z8_LABEL} border px-1.5 py-0.5 ${isProjected ? 'border-vouch-cyan/30 bg-vouch-cyan/8 text-vouch-cyan/80' : 'border-vouch-emerald/30 bg-vouch-emerald/10 text-vouch-emerald'}`}>
          {isProjected ? 'Proj' : 'Live'}
        </span>
        <small className="font-mono text-[8px] uppercase tracking-widest text-white/30">View</small>
      </div>
    </button>
  );
}

function DailyRosterPanel({ game, side, search }: { game: any; side: "away" | "home"; search: string }) {
  const team = resolveDailyTeam(game, side);
  const teamName = getTeamLabel(team);
  const teamAbbr = getTeamAbbrSafe(team);
  const players = getDailyPlayersForSide(game, side);
  const sideLabel = side === "away" ? "Away starters" : "Home starters";
  const gameTeamId = game?.[`${side}TeamId`];

  return (
    <section className={`${Z8_SURFACE} min-w-0 overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/30 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <DailyTeamIcon team={team} gameTeamId={gameTeamId} />
          <div className="min-w-0">
            <strong className="block truncate font-mono text-xs font-bold uppercase tracking-wide text-white">{teamName}</strong>
            <span className={`${Z8_LABEL} text-white/40`}>{sideLabel}</span>
          </div>
        </div>
        <div className={`${Z8_LABEL} border border-vouch-emerald/30 bg-vouch-emerald/10 px-2 py-1 text-vouch-emerald`}>
          {players.length}/9
        </div>
      </div>

      {players.length > 0 ? (
        <div className="grid gap-1.5 p-2">
          {players.map((player, index) => (
            <DailyStarterRow
              key={`${side}-${player?.id || player?.playerId || player?.mlbId || getDailyPlayerName(player)}-${index}`}
              player={player}
              index={index}
              team={team}
              teamAbbr={teamAbbr}
              search={search}
            />
          ))}
        </div>
      ) : (
        <div className="border-t border-white/10 px-4 py-8 text-center">
          <strong className={`${Z8_LABEL} block text-white/70`}>Lineup pending</strong>
          <span className="mt-1 block font-mono text-[10px] text-white/40">
            Starters will appear here once MLB data is available.
          </span>
        </div>
      )}
    </section>
  );
}

function DailyMatchupTheater({
  games,
  selectedGame,
  selectedGameIndex,
  setSelectedGameIndex,
  goToPreviousGame,
  goToNextGame,
  search,
}: {
  games: any[];
  selectedGame: any;
  selectedGameIndex: number;
  setSelectedGameIndex: (index: number) => void;
  goToPreviousGame: () => void;
  goToNextGame: () => void;
  search: string;
}) {
  if (!selectedGame) return null;

  const away = resolveDailyTeam(selectedGame, "away");
  const home = resolveDailyTeam(selectedGame, "home");
  const awayName = getTeamLabel(away);
  const homeName = getTeamLabel(home);
  const awayAbbr = getTeamAbbrSafe(away);
  const homeAbbr = getTeamAbbrSafe(home);
  const awayPlayers = getDailyPlayersForSide(selectedGame, "away");
  const homePlayers = getDailyPlayersForSide(selectedGame, "home");
  const status = getDailyStatus(selectedGame);
  const isProjectedSlate = status === 'Projected' || status === 'Pending';

  return (
    <section
      className={`${Z8_PANEL_PREMIUM} min-w-0 overflow-hidden p-0`}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') goToPreviousGame();
        if (event.key === 'ArrowRight') goToNextGame();
      }}
    >
      <div className="flex flex-col gap-2 border-b border-white/10 bg-black/30 p-2 sm:gap-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPreviousGame}
            className={`${Z8_IDLE} flex h-11 w-11 shrink-0 items-center justify-center font-mono text-sm sm:h-9 sm:w-9`}
            aria-label="Previous matchup"
          >
            ←
          </button>

          <div className={`${Z8_SURFACE} flex min-w-0 flex-1 flex-col items-center px-3 py-1.5 text-center sm:flex-none`}>
            <span className={`${Z8_LABEL} text-white/40`}>Matchup</span>
            <strong className="font-mono text-sm font-bold text-white">
              {selectedGameIndex + 1} / {games.length}
            </strong>
          </div>

          <button
            type="button"
            onClick={goToNextGame}
            className={`${Z8_IDLE} flex h-11 w-11 shrink-0 items-center justify-center font-mono text-sm sm:h-9 sm:w-9`}
            aria-label="Next matchup"
          >
            →
          </button>
        </div>

        <div className="no-scrollbar -mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:px-0" aria-label="Matchup shortcuts">
          {games.map((game, index) => {
            const chipAway = resolveDailyTeam(game, "away");
            const chipHome = resolveDailyTeam(game, "home");
            const isActive = index === selectedGameIndex;
            const chipStatus = getDailyStatus(game);

            return (
              <button
                type="button"
                key={`daily-chip-${game?.gamePk || game?.game_id || game?.id || index}`}
                className={`flex min-w-[132px] shrink-0 snap-start flex-col gap-1 border px-2.5 py-2 text-left font-z8 transition sm:min-w-[160px] sm:px-2 sm:py-1.5 ${
                  isActive ? Z8_ACTIVE : Z8_IDLE
                }`}
                onClick={() => setSelectedGameIndex(index)}
                aria-label={`Open ${getTeamLabel(chipAway)} versus ${getTeamLabel(chipHome)}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <DailyTeamIcon team={chipAway} gameTeamId={game?.awayTeamId} size="sm" />
                  <span className={`${Z8_LABEL} text-vouch-cyan/80`}>vs</span>
                  <DailyTeamIcon team={chipHome} gameTeamId={game?.homeTeamId} size="sm" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold text-white">
                    {getTeamAbbrSafe(chipAway)} @ {getTeamAbbrSafe(chipHome)}
                  </span>
                  <span className={`${Z8_LABEL} ${chipStatus === 'Confirmed' ? 'text-vouch-emerald' : 'text-vouch-cyan/70'}`}>
                    {chipStatus}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {isProjectedSlate && (
        <div className={`${Z8_LABEL} border-b border-vouch-cyan/25 bg-vouch-cyan/8 px-4 py-2 text-vouch-cyan/90`}>
          Official lineup not posted yet — projected roster preview only.
        </div>
      )}

      <article className="border-b border-white/10">
        <header className="flex flex-col gap-4 border-b border-white/10 bg-black/25 p-3 sm:p-4 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center md:gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <DailyTeamIcon team={away} gameTeamId={selectedGame?.awayTeamId} size="lg" />
            <div className="min-w-0">
              <span className={`${Z8_LABEL} text-white/40`}>Away</span>
              <strong className="block truncate font-mono text-sm font-bold uppercase tracking-wide text-white sm:text-base">{awayName}</strong>
              <small className={`${Z8_LABEL} text-white/35`}>{awayPlayers.length}/9 starters loaded</small>
            </div>
          </div>

          <div className={`${Z8_SURFACE} self-center px-4 py-2 text-center`}>
            <span className={`${Z8_LABEL} ${status === 'Confirmed' ? 'text-vouch-emerald' : 'text-vouch-cyan/80'}`}>{status}</span>
            <strong className="mt-1 block font-mono text-xs font-bold tracking-widest text-vouch-cyan">
              {awayAbbr} VS {homeAbbr}
            </strong>
          </div>

          <div className="flex min-w-0 items-center gap-3 md:justify-end md:text-right">
            <div className="min-w-0 md:order-1">
              <span className={`${Z8_LABEL} text-white/40`}>Home</span>
              <strong className="block truncate font-mono text-sm font-bold uppercase tracking-wide text-white sm:text-base">{homeName}</strong>
              <small className={`${Z8_LABEL} text-white/35`}>{homePlayers.length}/9 starters loaded</small>
            </div>
            <DailyTeamIcon team={home} gameTeamId={selectedGame?.homeTeamId} size="lg" />
          </div>
        </header>

        <div className="grid grid-cols-1 gap-3 p-2.5 sm:p-3 lg:grid-cols-2">
          <DailyRosterPanel game={selectedGame} side="away" search={search} />
          <DailyRosterPanel game={selectedGame} side="home" search={search} />
        </div>
      </article>
    </section>
  );
}


function getBootDailyPlayersBoard(): DailyBoardResponse | null {
  const bootBoard = bootDataStore.get<DailyBoardResponse>("dailyPlayers");
  if (bootBoard?.games?.length) return bootBoard;

  const bootLineup = bootDataStore.get<DailyBoardResponse>("lineupToday");
  if (bootLineup?.games?.length) return bootLineup;

  return null;
}

export default function DailyPlayersPage({ onSectionChange }: DailyPlayersPageProps) {
  const bootBoard = getBootDailyPlayersBoard();

  const [data, setData] = useState<DailyBoardResponse | null>(() => bootBoard);
  const [loading, setLoading] = useState(() => !bootBoard);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'pitchers'>('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);

  async function fetchBoard(options: { background?: boolean } = {}) {
    if (!options.background) setLoading(true);
    setError(null);

    let finalData: DailyBoardResponse | null = null;
    let finalError = '';

    try {
      finalData = await fetchDirectMlbScheduleBoard();
    } catch (directErr: any) {
      finalError = directErr?.message || String(directErr);
    }

    if (!finalData) {
      try {
        finalData = await fetchDirectMlbScheduleBoard();
        finalError = '';
      } catch (directErr: any) {
        finalData = {
          ok: false,
          date: todayISO(),
          games: [],
          totalGames: 0,
          totalPlayers: 0,
          source: 'empty-fallback',
          updatedAt: new Date().toISOString(),
        };
        setError(finalError || directErr?.message || 'Could not load Daily Player Board.');
      }
    }

    setData(finalData);
    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => {
    fetchBoard({ background: Boolean(bootBoard) });
  }, []);

  const games = useMemo(() => {
    const list = data?.games || [];

    return list.filter((game) => {
      const quality = dataQuality(game);
      if (filter === 'confirmed') return quality === 'CONFIRMED';
      if (filter === 'pending') return quality !== 'CONFIRMED';
      if (filter === 'pitchers') return Boolean(game.awayPitcher || game.homePitcher);
      return true;
    });
  }, [data?.games, filter]);

  const totalPlayers = useMemo(
    () => (data?.games || []).reduce((sum, game) => sum + getGamePlayers(game).length, 0),
    [data?.games]
  );

  useEffect(() => {
    if (selectedGameIndex > Math.max(games.length - 1, 0)) {
      setSelectedGameIndex(0);
    }
  }, [games.length, selectedGameIndex]);

  const getTeamLabel = (team: any) => {
    if (!team) return "TBD";
    if (typeof team === "string") return team;
    return team.name || team.teamName || team.shortName || team.abbreviation || "TBD";
  };

  const selectedGame = games[selectedGameIndex] || null;

  const goToPreviousGame = () => {
    if (!games.length) return;
    setSelectedGameIndex((current) => (current - 1 + games.length) % games.length);
  };

  const goToNextGame = () => {
    if (!games.length) return;
    setSelectedGameIndex((current) => (current + 1) % games.length);
  };

  return (
    <main className={`${Z8_PAGE} daily-players-page min-w-0 overflow-x-hidden px-3 py-4 sm:px-4 lg:py-5`}>
      <div className="daily-players-content mx-0 max-w-none space-y-4">
        <header className={`${Z8_PANEL_PREMIUM} p-4 sm:p-5`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={`${Z8_LABEL} border border-vouch-cyan/35 bg-vouch-cyan/10 px-2.5 py-1 text-vouch-cyan`}>
                  Daily Player Board
                </span>
                <span className={`${Z8_LABEL} border border-white/10 bg-black/25 px-2.5 py-1 text-white/50`}>
                  <Calendar className="mr-1 inline h-3 w-3 text-vouch-cyan/70" />
                  {data?.date || todayISO()}
                </span>
              </div>

              <h1 className="font-mono text-2xl font-bold uppercase tracking-wide text-white sm:text-3xl">
                Today&apos;s MLB Starting Lineups
              </h1>

              <p className="mt-1.5 max-w-3xl font-mono text-[11px] leading-5 text-white/45 sm:text-xs">
                Posted MLB starting hitters when lineups are available. Projected previews are labeled — never shown as confirmed.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {onSectionChange && (
                <button
                  type="button"
                  onClick={() => onSectionChange('hr_board')}
                  className={`${Z8_IDLE} inline-flex w-full items-center justify-center gap-2.5 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wide sm:w-auto`}
                >
                  <HrBrandIcon size="sm" />
                  Home Run Intelligence
                </button>
              )}
              <button
                type="button"
                onClick={() => fetchBoard()}
                className={`${Z8_ACTIVE} inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wide sm:w-auto`}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh Board
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[
              { label: 'Games Loaded', value: data?.totalGames ?? games.length },
              { label: 'Players Starting', value: totalPlayers },
              { label: 'Last Updated', value: lastUpdated ? lastUpdated.toLocaleTimeString() : 'Not yet' },
            ].map((stat) => (
              <div key={stat.label} className={`${Z8_SURFACE} px-3 py-2.5`}>
                <div className={`${Z8_LABEL} text-white/40`}>{stat.label}</div>
                <div className="mt-0.5 font-mono text-xl font-bold text-white">{stat.value}</div>
              </div>
            ))}
          </div>
        </header>

        <section className={`${Z8_PANEL_PREMIUM} flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between`}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search player, team, position..."
            className={`${Z8_SURFACE} w-full px-3.5 py-2.5 font-mono text-sm text-white outline-none placeholder:text-white/30 focus:border-vouch-cyan/45 focus:ring-1 focus:ring-vouch-cyan/20 md:max-w-md`}
          />

          <div className="flex flex-wrap gap-1.5">
            {(['all', 'confirmed', 'pending', 'pitchers'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wide transition sm:py-1.5 ${
                  filter === item ? Z8_ACTIVE : Z8_IDLE
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {loading && (
          <div className={`${Z8_PANEL_PREMIUM} flex items-center justify-center gap-3 p-10 text-center`}>
            <RefreshCw className="h-5 w-5 animate-spin text-vouch-cyan" />
            <span className={`${Z8_LABEL} text-white/50`}>Loading Daily Player Board...</span>
          </div>
        )}

        {!loading && error && (
          <div className="border border-red-500/30 bg-red-500/10 px-4 py-3 font-mono text-sm text-red-300">
            {error}
          </div>
        )}

        {!loading && games.length === 0 && (
          <div className={`${Z8_PANEL_PREMIUM} p-8 text-center`}>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center border border-white/10 bg-black/30">
              <Users className="h-6 w-6 text-white/35" />
            </div>
            <div className="font-mono text-base font-bold uppercase tracking-wide text-white">No games found for this filter.</div>
            <div className="mt-2 font-mono text-xs text-white/45">
              Try All or Refresh Board. If it still shows empty, the schedule endpoint may not have today&apos;s MLB slate.
            </div>
          </div>
        )}

        {!loading && games.length > 0 && (
          <DailyMatchupTheater
            games={games}
            selectedGame={selectedGame}
            selectedGameIndex={selectedGameIndex}
            setSelectedGameIndex={setSelectedGameIndex}
            goToPreviousGame={goToPreviousGame}
            goToNextGame={goToNextGame}
            search={search}
          />
        )}
      </div>
    </main>
  );
}
