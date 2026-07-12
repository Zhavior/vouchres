import React, { useMemo } from 'react';
import { ChevronRight, Flame, Radar } from 'lucide-react';
import { useLiveGames } from '../../hooks/queries/useLiveGames';
import { useDailyReport } from '../../hooks/queries/useDailyReport';
import { useDailyHrBoard } from '../../features/hr/hooks/useDailyHrBoard';
import { buildBoard } from '../../features/hr/utils/normalizeHrWatch';
import type { HrWatchRow } from '../../features/hr/types/hrWatch';
import { todayISO } from '../../hooks/queries/hrBoardQuery';
import { sortLiveGameCards, liveGameDisplayStatus, type LiveGameCard } from '../../types/liveGames';
import { getMlbHeadshotUrl, getPlayerInitials, MLB_HEADSHOT_IMG_CLASS } from '../../lib/mlbHeadshot';
import { logoByTeamId, logoByTeamName } from '../../lib/teamLogos';
import type { VulnerablePitcher } from '../../types/mlb';
import { Z8_LABEL, Z8_PANEL } from '../../theme/z8Tokens';

const MAX_SPOTLIGHT = 6;

interface Props {
  onSectionChange: (section: string) => void;
}

/**
 * Today page top rails: horizontal games slider, then Top HR hitters and
 * Top pitcher targets as small snap-scroll cards — 3 visible per row on
 * mobile, 6 on desktop.
 */
export default function TodaySliders({ onSectionChange }: Props) {
  const liveGamesQuery = useLiveGames();
  const hrBoard = useDailyHrBoard(todayISO());
  const dailyReportQuery = useDailyReport();

  const games = useMemo(
    () => sortLiveGameCards(liveGamesQuery.data?.games ?? []),
    [liveGamesQuery.data?.games],
  );

  const topHitters = useMemo<HrWatchRow[]>(() => {
    if (!hrBoard.data) return [];
    const board = buildBoard(hrBoard.data as unknown);
    const rows = board.confirmed.length ? board.confirmed : board.curated;
    return [...rows]
      .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999) || b.hrScore - a.hrScore)
      .slice(0, MAX_SPOTLIGHT);
  }, [hrBoard.data]);

  const topPitchers = useMemo<VulnerablePitcher[]>(
    () => (dailyReportQuery.data?.vulnerablePitchers ?? []).slice(0, MAX_SPOTLIGHT),
    [dailyReportQuery.data?.vulnerablePitchers],
  );

  return (
    <div className="space-y-4">
      <SliderSection
        title="Today's Games"
        loading={liveGamesQuery.isLoading}
        empty={games.length === 0}
        emptyLabel="No MLB games on today's slate."
        onOpen={() => onSectionChange('live_games')}
        openLabel="Live Games"
      >
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {games.map((game) => (
            <GameSliderCard key={game.id} game={game} onClick={() => onSectionChange('live_games')} />
          ))}
        </div>
      </SliderSection>

      <SliderSection
        title="Top HR Intelligence"
        icon={Flame}
        loading={hrBoard.loading}
        empty={topHitters.length === 0}
        emptyLabel="HR board loads when today's data is available."
        onOpen={() => onSectionChange('hr_board')}
        openLabel="HR Board"
      >
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {topHitters.map((row, i) => (
            <PlayerSpotlightCard
              key={row.stableId}
              rank={i + 1}
              playerId={row.playerId}
              headshotUrl={row.headshotUrl}
              teamLogoUrl={row.teamLogoUrl ?? logoByTeamName(row.team)}
              name={row.playerName}
              subline={row.opponent ? `vs ${row.opponent}` : row.team}
              statLabel="HR"
              statValue={String(Math.round(row.hrScore))}
              accent="cyan"
              onClick={() => onSectionChange('hr_board')}
            />
          ))}
        </div>
      </SliderSection>

      <SliderSection
        title="Top Pitcher Targets"
        icon={Radar}
        loading={dailyReportQuery.isLoading}
        empty={topPitchers.length === 0}
        emptyLabel="Probable pitchers post closer to first pitch."
        onOpen={() => onSectionChange('team_matchup_lab')}
        openLabel="Matchup Lab"
      >
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {topPitchers.map((pitcher, i) => (
            <PlayerSpotlightCard
              key={pitcher.pitcherId}
              rank={i + 1}
              playerId={pitcher.pitcherId}
              teamLogoUrl={logoByTeamName(pitcher.team)}
              name={pitcher.pitcherName}
              subline={`vs ${pitcher.opponent}`}
              statLabel="Vuln"
              statValue={`${Math.round(pitcher.vulnerabilityScore)}`}
              accent="amber"
              onClick={() => onSectionChange('team_matchup_lab')}
            />
          ))}
        </div>
      </SliderSection>
    </div>
  );
}

function SliderSection({
  title,
  icon: Icon,
  loading,
  empty,
  emptyLabel,
  onOpen,
  openLabel,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  loading: boolean;
  empty: boolean;
  emptyLabel: string;
  onOpen: () => void;
  openLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${Z8_PANEL} ve-premium-panel p-3 sm:p-4`}>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-white font-mono">
          {Icon ? <Icon className="h-3.5 w-3.5 text-vouch-cyan" /> : null}
          {title}
        </h2>
        <button
          type="button"
          onClick={onOpen}
          className={`inline-flex items-center gap-1 ${Z8_LABEL} text-vouch-cyan/80 hover:text-vouch-cyan`}
        >
          {openLabel}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="flex gap-2" role="status" aria-label={`Loading ${title}`}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 w-[31%] shrink-0 animate-pulse rounded-xl bg-white/5 md:w-[15.5%]" />
          ))}
        </div>
      ) : empty ? (
        <p className="py-3 text-center text-xs text-white/40 font-mono">{emptyLabel}</p>
      ) : (
        children
      )}
    </section>
  );
}

function GameSliderCard({ game, onClick }: { game: LiveGameCard; onClick: () => void }) {
  const status = liveGameDisplayStatus(game);
  const showScore = game.isLive || game.isFinal;
  const awayWinning = showScore && (game.awayScore ?? 0) > (game.homeScore ?? 0);
  const homeWinning = showScore && (game.homeScore ?? 0) > (game.awayScore ?? 0);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-[44%] shrink-0 snap-start overflow-hidden rounded-xl border p-2.5 text-left transition-all hover:-translate-y-0.5 sm:w-[30%] md:w-[19%] xl:w-[15.5%] ${
        game.isLive
          ? 'border-vouch-emerald/35 bg-gradient-to-b from-vouch-emerald/[0.08] to-black/30 shadow-[0_0_18px_-6px_rgba(52,211,153,0.35)]'
          : 'border-white/10 bg-gradient-to-b from-white/[0.04] to-black/30 hover:border-vouch-cyan/40'
      }`}
    >
      <span
        className={`inline-flex items-center gap-1 truncate text-[9px] font-black uppercase tracking-wide ${
          game.isLive ? 'text-vouch-emerald' : game.isFinal ? 'text-white/40' : 'text-vouch-cyan/75'
        }`}
      >
        {game.isLive ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-vouch-emerald" /> : null}
        {status}
      </span>
      <TeamScoreRow
        teamId={game.awayTeamId}
        teamName={game.awayTeam}
        abbr={game.awayAbbr ?? game.awayTeam}
        score={showScore ? game.awayScore : null}
        winning={awayWinning}
        final={Boolean(game.isFinal)}
      />
      <TeamScoreRow
        teamId={game.homeTeamId}
        teamName={game.homeTeam}
        abbr={game.homeAbbr ?? game.homeTeam}
        score={showScore ? game.homeScore : null}
        winning={homeWinning}
        final={Boolean(game.isFinal)}
      />
    </button>
  );
}

function TeamScoreRow({
  teamId,
  teamName,
  abbr,
  score,
  winning,
  final: isFinal,
}: {
  teamId: number | null;
  teamName: string;
  abbr: string;
  score: number | null;
  winning: boolean;
  final: boolean;
}) {
  const logo = logoByTeamId(teamId) ?? logoByTeamName(teamName);
  const dim = isFinal && !winning && score !== null;

  return (
    <div className="mt-1.5 flex items-center justify-between gap-2">
      <span className="flex min-w-0 items-center gap-1.5">
        {logo ? (
          <img src={logo} alt="" loading="lazy" className="h-5 w-5 shrink-0 object-contain drop-shadow-[0_0_4px_rgba(255,255,255,0.15)]" />
        ) : (
          <span className="h-5 w-5 shrink-0 rounded-full bg-white/10" />
        )}
        <span className={`truncate text-xs font-black font-mono ${dim ? 'text-white/40' : 'text-white'}`}>{abbr}</span>
      </span>
      <span className={`text-sm font-black font-mono ${winning ? 'text-vouch-emerald' : dim ? 'text-white/35' : 'text-white/75'}`}>
        {score ?? ''}
      </span>
    </div>
  );
}

const SPOTLIGHT_ACCENTS = {
  cyan: {
    ring: 'ring-vouch-cyan/50',
    glow: 'shadow-[0_0_16px_-4px_rgba(0,240,255,0.4)]',
    hover: 'hover:border-vouch-cyan/50',
    stat: 'border-vouch-cyan/30 bg-vouch-cyan/10 text-vouch-cyan',
    rank: 'bg-vouch-cyan text-black',
  },
  amber: {
    ring: 'ring-amber-400/50',
    glow: 'shadow-[0_0_16px_-4px_rgba(251,191,36,0.4)]',
    hover: 'hover:border-amber-400/50',
    stat: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    rank: 'bg-amber-400 text-black',
  },
} as const;

function PlayerSpotlightCard({
  rank,
  playerId,
  headshotUrl,
  teamLogoUrl,
  name,
  subline,
  statLabel,
  statValue,
  accent,
  onClick,
}: {
  rank: number;
  playerId: string | number | null;
  headshotUrl?: string | null;
  teamLogoUrl?: string | null;
  name: string;
  subline: string;
  statLabel: string;
  statValue: string;
  accent: keyof typeof SPOTLIGHT_ACCENTS;
  onClick: () => void;
}) {
  const headshot = headshotUrl ?? getMlbHeadshotUrl(playerId, 96);
  const tone = SPOTLIGHT_ACCENTS[accent];
  const isTop = rank === 1;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-[31%] shrink-0 snap-start overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-black/30 p-2 pt-2.5 text-left transition-all hover:-translate-y-0.5 md:w-[15.5%] ${tone.hover} ${isTop ? tone.glow : ''}`}
    >
      <span className={`absolute left-1.5 top-1.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black ${tone.rank}`}>
        {rank}
      </span>
      {teamLogoUrl ? (
        <img
          src={teamLogoUrl}
          alt=""
          loading="lazy"
          className="pointer-events-none absolute -right-2 -top-2 h-12 w-12 object-contain opacity-15"
        />
      ) : null}

      <div className="relative mx-auto h-12 w-12">
        <div className={`h-12 w-12 overflow-hidden rounded-full border border-white/15 bg-white/5 ring-2 ${tone.ring}`}>
          {headshot ? (
            <img src={headshot} alt="" loading="lazy" className={MLB_HEADSHOT_IMG_CLASS} />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-black text-white/60">
              {getPlayerInitials(name)}
            </span>
          )}
        </div>
        {teamLogoUrl ? (
          <img
            src={teamLogoUrl}
            alt=""
            loading="lazy"
            className="absolute -bottom-0.5 -right-0.5 h-4.5 w-4.5 rounded-full bg-black/70 object-contain p-0.5"
            style={{ height: 18, width: 18 }}
          />
        ) : null}
      </div>

      <p className="mt-1.5 truncate text-center text-[11px] font-black text-white">{name}</p>
      <p className="truncate text-center text-[9px] text-white/40 font-mono">{subline}</p>
      <p className={`mx-auto mt-1.5 w-fit rounded-full border px-2 py-0.5 text-center text-[9px] font-black uppercase tracking-wide ${tone.stat}`}>
        {statLabel} {statValue}
      </p>
    </button>
  );
}
