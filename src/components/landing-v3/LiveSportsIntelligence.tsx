import { useMemo } from "react";
import {
  Activity,
  ArrowUpRight,
  CircleDot,
  Clock3,
  Radio,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useLiveGames } from "../../hooks/queries/useLiveGames";
import { TeamLogo } from "../live/LiveTeamLogo";
import { logoByTeamId, logoByTeamName } from "../../lib/teamLogos";
import clsx from "clsx";

import {
  liveGameDisplayStatus,
  sortLiveGameCards,
  type LiveGameCard as LiveGame,
} from "../../types/liveGames";

const groundingEase = [0.22, 1, 0.36, 1] as const;

function isLiveGame(game: LiveGame): boolean {
  return Boolean(game.isLive) || /progress|live|in play|warmup|delayed/i.test(game.status);
}

function isFinalGame(game: LiveGame): boolean {
  return Boolean(game.isFinal) || /final|game over|completed/i.test(game.status);
}

function formatGameTime(iso: string | null): string {
  if (!iso) return "Time TBD";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Time TBD";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function formatFeedTime(iso: string | null | undefined): string {
  if (!iso) return "Awaiting feed timestamp";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Awaiting feed timestamp";

  return `Updated ${new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)}`;
}

function TeamRow({
  abbreviation,
  name,
  score,
  teamId,
  emphasized,
}: {
  abbreviation: string | null;
  name: string;
  score: number | null;
  teamId: number | null;
  emphasized: boolean;
}) {
  const logo = logoByTeamId(teamId) ?? logoByTeamName(name);
  const fallback = abbreviation || name.slice(0, 3).toUpperCase();

  return (
    <div className="flex min-w-0 items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border p-1.5 text-xs font-semibold tracking-[0.08em]",
            emphasized
              ? "border-sky-300/30 bg-sky-300/10 text-sky-100"
              : "border-white/10 bg-white/[0.035] text-white/65",
          ].join(" ")}
        >
          {logo ? (
            <TeamLogo src={logo} alt={`${name} logo`} size={28} />
          ) : (
            fallback
          )}
        </div>

        <div className="min-w-0">
          <p
            className={[
              "truncate text-sm font-medium",
              emphasized ? "text-white" : "text-white/68",
            ].join(" ")}
          >
            {name}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-white/32">
            {fallback}
          </p>
        </div>
      </div>

      <span
        className={[
          "font-mono text-2xl font-medium tabular-nums tracking-[-0.04em]",
          emphasized ? "text-white" : "text-white/58",
        ].join(" ")}
        aria-label={score === null ? "Score not available" : `${score} runs`}
      >
        {score ?? "—"}
      </span>
    </div>
  );
}

function LiveGameCard({
  game,
  index,
  className,
  featured,
}: {
  game: LiveGame;
  index: number;
  className?: string;
  featured?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const live = isLiveGame(game);
  const final = isFinalGame(game);
  const showScore = live || final;
  const awayScore = showScore ? game.awayScore : null;
  const homeScore = showScore ? game.homeScore : null;
  const awayLeads = awayScore !== null && homeScore !== null && awayScore > homeScore;
  const homeLeads = awayScore !== null && homeScore !== null && homeScore > awayScore;
  const status = live ? "LIVE" : final ? "FINAL" : "SCHEDULED";
  const period = live || final ? liveGameDisplayStatus(game) : formatGameTime(game.gameDate);

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.38,
        delay: reduceMotion ? 0 : index * 0.06,
        ease: groundingEase,
      }}
      className={clsx(
        "group relative isolate min-w-0 overflow-hidden rounded-[2rem] border border-white/[0.05] bg-[#050505]/60 p-6 shadow-2xl backdrop-blur-2xl transition-all duration-500",
        featured &&
          "border-cyan-400/20 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_65%),#050505/80] shadow-[0_32px_120px_rgba(34,211,238,0.12)]",
        className
      )}
    >
      {featured && (
        <div className="absolute right-5 top-5 z-20 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200 backdrop-blur">
          Featured Matchup
        </div>
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-sky-400/[0.06] blur-3xl"
      />

      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
              MLB
            </span>

            <span
              className={[
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
                live
                  ? "border border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-200"
                  : "border border-white/10 bg-white/[0.035] text-white/48",
              ].join(" ")}
            >
              {live ? (
                <CircleDot aria-hidden="true" className="h-3 w-3" strokeWidth={2} />
              ) : (
                <Clock3 aria-hidden="true" className="h-3 w-3" strokeWidth={2} />
              )}
              {status}
            </span>
          </div>

          <span className="text-right text-xs font-medium text-white/42">{period}</span>
        </div>

        <div className="mt-7 space-y-4">
          <TeamRow
            abbreviation={game.awayAbbr}
            name={game.awayTeam}
            score={awayScore}
            teamId={game.awayTeamId}
            emphasized={awayLeads}
          />

          <div className="h-px bg-white/[0.07]" />

          <TeamRow
            abbreviation={game.homeAbbr}
            name={game.homeTeam}
            score={homeScore}
            teamId={game.homeTeamId}
            emphasized={homeLeads}
          />
        </div>

        <div className="mt-7 rounded-2xl border border-white/[0.07] bg-black/15 p-4">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/34">
                Official game context
              </p>
              <p className="mt-2 text-sm font-medium leading-5 text-white/78">
                {game.venue || "Venue not yet listed"}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <ShieldCheck aria-hidden="true" className="ml-auto h-5 w-5 text-sky-200" strokeWidth={1.8} />
              <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-white/30">
                {formatFeedTime(game.feedAsOf)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function SlateStateCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="md:col-span-2 xl:col-span-3 rounded-[2rem] border border-white/[0.05] bg-[#050505]/60 px-6 py-16 text-center backdrop-blur-xl">
      <p className="text-lg font-medium text-white/80">{title}</p>
      <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-white/50">{detail}</p>
    </div>
  );
}

export default function LiveSportsIntelligence() {
  const reduceMotion = useReducedMotion();
  const liveQuery = useLiveGames({ refetchInterval: 45_000 });
  const games = useMemo(
    () => sortLiveGameCards(liveQuery.data?.games ?? []).slice(0, 3),
    [liveQuery.data?.games],
  );
  const allGames = liveQuery.data?.games ?? [];
  const liveCount = allGames.filter(isLiveGame).length;
  const feedState = liveQuery.isError ? "Unavailable" : liveQuery.isLoading ? "Loading" : "Connected";
  const intelligenceSignals = [
    {
      label: "Official slate",
      value: liveQuery.isLoading ? "—" : String(allGames.length),
      detail: liveQuery.data?.date || "Today",
      icon: Radio,
    },
    {
      label: "Live now",
      value: liveQuery.isLoading ? "—" : String(liveCount),
      detail: "From MLB game status",
      icon: Activity,
    },
    {
      label: "MLB feed",
      value: feedState,
      detail: formatFeedTime(liveQuery.data?.updatedAt),
      icon: ShieldCheck,
    },
  ];

  return (
    <section
      id="live-intelligence"
      aria-labelledby="live-intelligence-title"
      className="relative isolate px-4 py-32 sm:px-6 sm:py-48 lg:px-8 bg-black"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-20 -z-10 h-[34rem] w-[min(90vw,72rem)] -translate-x-1/2 rounded-full bg-sky-500/[0.045] blur-3xl"
      />

      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.4, ease: groundingEase }}
          className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end"
        >
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/15 bg-sky-300/[0.055] px-3 py-1.5">
              <Radio aria-hidden="true" className="h-3.5 w-3.5 text-sky-300" strokeWidth={2} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-100/75">
                Live sports intelligence
              </span>
            </div>

            <h2
              id="live-intelligence-title"
              className="mt-8 max-w-2xl text-balance text-[9vw] font-black leading-[0.9] tracking-tight text-white sm:text-[6vw] lg:text-[72px]"
            >
              See today&apos;s games. Understand tomorrow&apos;s edge.
            </h2>
            <p className="mt-8 max-w-xl text-pretty text-lg leading-8 text-white/60 sm:text-xl sm:leading-9">
              Official schedules are only the beginning. VouchEdge combines live MLB data with context, momentum, travel, weather, injuries, and performance trends so every matchup becomes easier to understand before the first pitch.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {intelligenceSignals.map((signal) => {
              const Icon = signal.icon;

              return (
                <div key={signal.label} className="min-w-0 rounded-3xl border border-white/[0.04] bg-[#050505]/80 p-5 sm:p-6 shadow-xl backdrop-blur-md">
                  <Icon aria-hidden="true" className="h-5 w-5 text-sky-400" strokeWidth={2} />
                  <p className="mt-6 truncate font-mono text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {signal.value}
                  </p>
                  <p className="mt-2 truncate text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                    {signal.label}
                  </p>
                  <p className="mt-2 hidden truncate text-sm text-white/30 sm:block">{signal.detail}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {games.map((game, index) => (
            <LiveGameCard
              key={game.id}
              game={game}
              index={index}
              className={index === 0 ? "md:col-span-2 xl:col-span-2" : undefined}
              featured={index === 0}
            />
          ))}
          {liveQuery.isLoading ? (
            <SlateStateCard title="Loading today&apos;s MLB slate…" detail="Scores and status will appear only after the official feed responds." />
          ) : liveQuery.isError ? (
            <SlateStateCard title="The MLB feed is unavailable right now." detail="No fallback scores or game claims are shown when the source cannot be reached." />
          ) : games.length === 0 ? (
            <SlateStateCard title="No games are listed on today&apos;s official slate." detail="This section will update automatically when the MLB feed publishes a game." />
          ) : null}
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.38, delay: reduceMotion ? 0 : 0.12, ease: groundingEase }}
          className="mt-5 flex flex-col gap-4 rounded-[1.75rem] border border-white/[0.08] bg-white/[0.022] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
        >
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sky-300/15 bg-sky-300/[0.055]">
              <TrendingUp aria-hidden="true" className="h-5 w-5 text-sky-200" strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <p className="font-medium text-white">Game context refreshes from the MLB feed.</p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-white/42">
                Scheduled games show no score. Live and final scores appear only when returned by the source.
              </p>
            </div>
          </div>

          <a
            href="#features"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-white transition-[transform,background-color,border-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070a10] motion-reduce:transform-none motion-reduce:transition-none"
          >
            Explore today&apos;s matchups
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
