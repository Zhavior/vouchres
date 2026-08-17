import { ArrowRight, CircleDot, Clock3, MapPin, Radio, ShieldAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { TeamLogo } from "../live/LiveTeamLogo";
import { logoByTeamId, logoByTeamName } from "../../lib/teamLogos";
import { liveGameDisplayStatus } from "../../types/liveGames";
import {
  formatGameTime,
  isFinalGame,
  isLiveGame,
  useResearchPreview,
  type EvidenceItem,
  type EvidenceState,
} from "./researchPreviewData";

const groundingEase = [0.22, 1, 0.36, 1] as const;

const STATE_STYLE: Record<
  EvidenceState,
  { chip: string; card: string; label: string; Icon: typeof ShieldCheck }
> = {
  available: {
    chip: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
    card: "border-emerald-300/15 hover:border-emerald-300/30",
    label: "Available",
    Icon: ShieldCheck,
  },
  partial: {
    chip: "border-amber-300/25 bg-amber-300/10 text-amber-100",
    card: "border-amber-300/15 hover:border-amber-300/30",
    label: "Partial",
    Icon: TriangleAlert,
  },
  unavailable: {
    chip: "border-white/12 bg-white/[0.04] text-white/50",
    card: "border-white/[0.07] hover:border-white/15",
    label: "Unavailable",
    Icon: ShieldAlert,
  },
};

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">{label}</p>
      <p className="mt-1 truncate text-[13px] text-white/80" title={value}>
        {value}
      </p>
    </div>
  );
}

function LayerStat({ label, value }: { label: string; value: number | null }) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/25 px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">
          {label}
        </span>
        <span className="font-mono text-sm font-semibold text-white/90">
          {value == null ? "n/a" : pct}
        </span>
      </div>
      <div
        className={`mt-2 h-1 overflow-hidden rounded-full ${
          value == null ? "border border-dashed border-white/15" : "bg-white/[0.08]"
        }`}
      >
        {value != null && (
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400/80 to-emerald-300/80"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    </div>
  );
}

function EvidenceCard({ item }: { item: EvidenceItem }) {
  const style = STATE_STYLE[item.state];
  const { Icon } = style;

  return (
    <div
      className={`flex h-full flex-col rounded-2xl border bg-white/[0.02] p-4 transition-colors ${style.card}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[14px] font-semibold text-white">{item.label}</p>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${style.chip}`}
        >
          <Icon aria-hidden="true" className="h-3 w-3" />
          {style.label}
        </span>
      </div>

      <p className="mt-2 text-[13px] leading-6 text-white/65">{item.explanation}</p>
      <p className="mt-2.5 text-[12px] leading-5 text-white/45">{item.detail}</p>

      <dl className="mt-auto grid gap-1 pt-3.5 text-[11px] leading-4 text-white/35">
        <div className="flex gap-1.5">
          <dt className="shrink-0 font-semibold uppercase tracking-[0.1em]">Source</dt>
          <dd className="min-w-0 truncate" title={item.source}>
            {item.source}
          </dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="shrink-0 font-semibold uppercase tracking-[0.1em]">Fresh</dt>
          <dd className="min-w-0 truncate" title={item.freshness}>
            {item.freshness}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export interface ResearchPreviewSectionProps {
  onExploreBoard?: () => void;
}

export default function ResearchPreviewSection({
  onExploreBoard,
}: ResearchPreviewSectionProps) {
  const reduceMotion = useReducedMotion();
  const {
    featuredGame,
    primaryPlayer,
    evidenceItems,
    status,
    statusLabel,
    usingDemo,
    isLoading,
    slateCount,
    liveCount,
    feedTimestamp,
    sourceLabel,
  } = useResearchPreview();

  const showScore = featuredGame
    ? isLiveGame(featuredGame) || isFinalGame(featuredGame)
    : false;
  const awayLogo = featuredGame
    ? logoByTeamId(featuredGame.awayTeamId) ?? logoByTeamName(featuredGame.awayTeam)
    : null;
  const homeLogo = featuredGame
    ? logoByTeamId(featuredGame.homeTeamId) ?? logoByTeamName(featuredGame.homeTeam)
    : null;

  return (
    <section
      id="research-preview"
      aria-labelledby="research-preview-title"
      className="relative isolate scroll-mt-20 border-t border-white/[0.06] bg-black px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-[min(90vw,60rem)] -translate-x-1/2 rounded-full bg-emerald-500/[0.06] blur-3xl"
      />

      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, ease: groundingEase }}
          className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.06] px-3 py-1.5">
              <Radio aria-hidden="true" className="h-3.5 w-3.5 text-emerald-300" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100/80">
                Real research preview
              </span>
            </div>
            <h2
              id="research-preview-title"
              className="mt-5 text-balance text-3xl font-black tracking-tight text-white sm:text-[2.6rem] sm:leading-[1.08]"
            >
              See one matchup the way the research board shows it.
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-white/65">
              Pulled from today&apos;s MLB schedule feed and a linked research row when one
              exists. Missing fields stay missing — no invented confidence, weather, or results.
            </p>
          </div>

          <div className="flex shrink-0 gap-2.5">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
              <p className="font-mono text-2xl font-semibold text-white">
                {isLoading ? "—" : slateCount}
              </p>
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">
                Games today
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
              <p className="font-mono text-2xl font-semibold text-white">
                {isLoading ? "—" : liveCount}
              </p>
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">
                Live now
              </p>
            </div>
          </div>
        </motion.div>

        <motion.article
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4, ease: groundingEase }}
          className="mt-10 overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-b from-ve-graphite/95 to-ve-obsidian/95 shadow-[0_28px_80px_-24px_rgba(0,0,0,0.85)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/60">
                Featured matchup
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] ${
                  status === "live"
                    ? "border border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
                    : status === "demo"
                      ? "border border-amber-300/25 bg-amber-300/10 text-amber-100"
                      : status === "error"
                        ? "border border-rose-300/25 bg-rose-300/10 text-rose-100"
                        : "border border-white/10 bg-white/[0.04] text-white/55"
                }`}
              >
                {status === "live" ? (
                  <CircleDot aria-hidden="true" className="h-2.5 w-2.5" />
                ) : (
                  <Clock3 aria-hidden="true" className="h-2.5 w-2.5" />
                )}
                {statusLabel}
              </span>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/35">
              {feedTimestamp}
            </p>
          </div>

          {usingDemo && (
            <p className="border-b border-amber-300/20 bg-amber-300/[0.07] px-5 py-3 text-[13px] leading-6 text-amber-50 sm:px-7">
              Demo research view — sample data. Today&apos;s official slate has no game to feature
              right now.
            </p>
          )}
          {status === "error" && (
            <p className="border-b border-rose-300/20 bg-rose-300/[0.07] px-5 py-3 text-[13px] leading-6 text-rose-50 sm:px-7">
              The MLB schedule feed is unavailable. No fallback scores or fake matchups are shown.
            </p>
          )}

          <div className="grid gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">
                {featuredGame
                  ? `${featuredGame.awayTeam} @ ${featuredGame.homeTeam}`
                  : isLoading
                    ? "Loading today’s slate…"
                    : usingDemo
                      ? "Sample Away @ Sample Home"
                      : "Waiting for today’s slate"}
              </h3>

              <div className="mt-4 space-y-2.5">
                {[
                  {
                    name: featuredGame?.awayTeam ?? "Away team",
                    logo: awayLogo,
                    score: showScore ? featuredGame?.awayScore ?? null : null,
                    role: "Away",
                  },
                  {
                    name: featuredGame?.homeTeam ?? "Home team",
                    logo: homeLogo,
                    score: showScore ? featuredGame?.homeScore ?? null : null,
                    role: "Home",
                  },
                ].map((team) => (
                  <div
                    key={team.role}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] p-1.5 text-[10px] font-bold text-white/55">
                        {team.logo ? <TeamLogo src={team.logo} alt="" size={26} /> : team.role[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-white">{team.name}</p>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                          {team.role}
                        </p>
                      </div>
                    </div>
                    {showScore && (
                      <span className="font-mono text-xl font-semibold tabular-nums text-white">
                        {team.score ?? "—"}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/[0.07] pt-4 sm:grid-cols-3">
                <MetaCell
                  label="First pitch"
                  value={
                    featuredGame
                      ? showScore
                        ? liveGameDisplayStatus(featuredGame)
                        : formatGameTime(featuredGame.gameDate)
                      : "Unavailable"
                  }
                />
                <MetaCell label="Venue" value={featuredGame?.venue || "Not listed"} />
                <MetaCell label="Source" value={sourceLabel} />
              </div>

              <p className="mt-5 flex items-start gap-2 rounded-xl border border-white/[0.07] bg-black/25 px-3.5 py-3 text-[12px] leading-6 text-white/50">
                <MapPin aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/35" />
                Confidence represents how strongly the available evidence supports the current
                research conclusion. It is not a guarantee of the outcome.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-100/70">
                Key research signals
              </p>

              {primaryPlayer ? (
                <>
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xl font-bold text-white">
                        {primaryPlayer.playerName}
                      </p>
                      <p className="mt-1 truncate text-[13px] text-white/55">
                        {primaryPlayer.team} vs {primaryPlayer.opponent}
                        {primaryPlayer.pitcherName ? ` · vs ${primaryPlayer.pitcherName}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-4xl font-bold leading-none text-emerald-200">
                        {Math.round(primaryPlayer.hrScore)}
                      </p>
                      <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-white/40">
                        HR research score
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2.5">
                    <LayerStat label="Power" value={primaryPlayer.hitterPower} />
                    <LayerStat label="Pitcher" value={primaryPlayer.pitcherVulnerability} />
                    <LayerStat label="Park" value={primaryPlayer.parkFactor} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`rounded-md border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${
                        primaryPlayer.truthStatus === "official"
                          ? STATE_STYLE.available.chip
                          : STATE_STYLE.partial.chip
                      }`}
                    >
                      {primaryPlayer.truthStatus === "official"
                        ? "Confirmed lineup"
                        : "Preview only"}
                    </span>
                    <span className="rounded-md border border-white/12 bg-white/[0.04] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/55">
                      Data confidence{" "}
                      {primaryPlayer.dataConfidence == null
                        ? "not provided"
                        : Math.round(primaryPlayer.dataConfidence)}
                    </span>
                  </div>

                  {primaryPlayer.reasons[0] && (
                    <p className="mt-4 border-t border-white/[0.07] pt-4 text-[13px] leading-6 text-white/70">
                      {primaryPlayer.reasons[0]}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-4 text-[13px] leading-6 text-white/60">
                  {usingDemo
                    ? "Sample mode does not attach fabricated player signals."
                    : isLoading
                      ? "Loading linked research rows for this matchup…"
                      : "No linked research row is available for this game yet. Schedule context still stands on its own."}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/[0.07] bg-black/25 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-[13px] leading-6 text-white/50">
              After the game, tracked decisions can be compared with the final result.
            </p>
            <button
              type="button"
              onClick={onExploreBoard}
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-300 to-emerald-300 px-5 text-sm font-bold text-[#03131a] transition hover:brightness-110"
            >
              Explore Today&apos;s MLB Board
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </motion.article>

        <div className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h3 className="text-xl font-bold tracking-tight text-white">
              Evidence behind this matchup
            </h3>
            <p className="text-[13px] text-white/45">
              Colour shows what is known, partial, or unavailable.
            </p>
          </div>

          <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {evidenceItems.map((item) => (
              <EvidenceCard key={item.label} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
