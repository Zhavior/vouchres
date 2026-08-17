import { ArrowUpRight, CircleDot, Clock3 } from "lucide-react";
import { TeamLogo } from "../live/LiveTeamLogo";
import { logoByTeamId, logoByTeamName } from "../../lib/teamLogos";
import { liveGameDisplayStatus } from "../../types/liveGames";
import {
  formatGameTime,
  isFinalGame,
  isLiveGame,
  useResearchPreview,
} from "./researchPreviewData";

function TeamRow({
  name,
  abbr,
  teamId,
  score,
  showScore,
  leading,
}: {
  name: string;
  abbr: string | null;
  teamId: number | null;
  score: number | null;
  showScore: boolean;
  leading: boolean;
}) {
  const logo = logoByTeamId(teamId) ?? logoByTeamName(name);
  const fallback = abbr || name.slice(0, 3).toUpperCase();

  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] p-1.5 text-[10px] font-bold text-white/60">
          {logo ? <TeamLogo src={logo} alt="" size={26} /> : fallback}
        </div>
        <p
          className={`truncate text-[15px] font-semibold ${
            leading ? "text-white" : "text-white/80"
          }`}
        >
          {name}
        </p>
      </div>
      {showScore && (
        <span className="font-mono text-xl font-semibold tabular-nums text-white">
          {score ?? "—"}
        </span>
      )}
    </div>
  );
}

function SignalBar({ label, value }: { label: string; value: number | null }) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
          {label}
        </span>
        <span className="font-mono text-xs font-semibold text-white/85">
          {value == null ? "n/a" : pct}
        </span>
      </div>
      <div
        className={`mt-1.5 h-1 overflow-hidden rounded-full ${
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

export interface HeroResearchCardProps {
  onOpenPreview?: () => void;
}

/**
 * Hero visual anchor. Every value shown is read from the live schedule feed or
 * a linked HR board row — the card degrades to explicit loading, feed-error, or
 * labeled demo states rather than filling gaps with invented numbers.
 */
export default function HeroResearchCard({ onOpenPreview }: HeroResearchCardProps) {
  const preview = useResearchPreview();
  const {
    featuredGame,
    primaryPlayer,
    status,
    statusLabel,
    usingDemo,
    isLoading,
    slateCount,
    feedTimestamp,
  } = preview;

  const showScore = featuredGame
    ? isLiveGame(featuredGame) || isFinalGame(featuredGame)
    : false;
  const awayScore = showScore ? featuredGame?.awayScore ?? null : null;
  const homeScore = showScore ? featuredGame?.homeScore ?? null : null;

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute -inset-6 rounded-[40px] bg-[radial-gradient(circle_at_30%_20%,rgba(0,217,160,0.18),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.14),transparent_55%)] blur-2xl"
      />

      <div className="relative overflow-hidden rounded-[26px] border border-white/12 bg-gradient-to-b from-ve-graphite/95 to-ve-obsidian/95 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent"
        />

        <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/60">
              MLB
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
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-white/35">
            {isLoading ? "Loading slate…" : `${slateCount} games today`}
          </p>
        </div>

        <div className="px-5 py-5">
          {isLoading ? (
            <div className="space-y-3" aria-live="polite">
              <div className="h-9 animate-pulse rounded-xl bg-white/[0.05]" />
              <div className="h-9 animate-pulse rounded-xl bg-white/[0.04]" />
              <div className="h-20 animate-pulse rounded-xl bg-white/[0.03]" />
            </div>
          ) : (
            <>
              {usingDemo && (
                <p className="mb-4 rounded-xl border border-amber-300/25 bg-amber-300/[0.07] px-3 py-2 text-[11px] leading-5 text-amber-50">
                  Demo research view — sample data. No game is listed on today&apos;s official
                  slate.
                </p>
              )}
              {status === "error" && (
                <p className="mb-4 rounded-xl border border-rose-300/25 bg-rose-300/[0.07] px-3 py-2 text-[11px] leading-5 text-rose-50">
                  The MLB schedule feed is unavailable. No fallback scores are shown.
                </p>
              )}

              <div className="space-y-2.5">
                <TeamRow
                  name={featuredGame?.awayTeam ?? "Away team"}
                  abbr={featuredGame?.awayAbbr ?? null}
                  teamId={featuredGame?.awayTeamId ?? null}
                  score={awayScore}
                  showScore={showScore}
                  leading={
                    awayScore != null && homeScore != null && awayScore > homeScore
                  }
                />
                <div className="h-px bg-white/[0.07]" />
                <TeamRow
                  name={featuredGame?.homeTeam ?? "Home team"}
                  abbr={featuredGame?.homeAbbr ?? null}
                  teamId={featuredGame?.homeTeamId ?? null}
                  score={homeScore}
                  showScore={showScore}
                  leading={
                    awayScore != null && homeScore != null && homeScore > awayScore
                  }
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/45">
                <span>
                  {featuredGame
                    ? showScore
                      ? liveGameDisplayStatus(featuredGame)
                      : formatGameTime(featuredGame.gameDate)
                    : "Game time unavailable"}
                </span>
                <span className="text-white/20">•</span>
                <span className="truncate">{featuredGame?.venue || "Venue not listed"}</span>
              </div>

              {primaryPlayer ? (
                <div className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-100/70">
                        Linked research row
                      </p>
                      <p className="mt-1.5 truncate text-[15px] font-semibold text-white">
                        {primaryPlayer.playerName}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-white/50">
                        {primaryPlayer.team} vs {primaryPlayer.opponent}
                        {primaryPlayer.pitcherName ? ` · vs ${primaryPlayer.pitcherName}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-3xl font-bold leading-none text-emerald-200">
                        {Math.round(primaryPlayer.hrScore)}
                      </p>
                      <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-white/40">
                        HR score
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <SignalBar label="Power" value={primaryPlayer.hitterPower} />
                    <SignalBar label="Pitcher" value={primaryPlayer.pitcherVulnerability} />
                    <SignalBar label="Park" value={primaryPlayer.parkFactor} />
                  </div>

                  <div className="mt-3.5 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${
                        primaryPlayer.truthStatus === "official"
                          ? "border border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
                          : "border border-amber-300/25 bg-amber-300/10 text-amber-100"
                      }`}
                    >
                      {primaryPlayer.truthStatus === "official"
                        ? "Confirmed lineup"
                        : "Preview only"}
                    </span>
                    <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white/55">
                      Confidence{" "}
                      {primaryPlayer.dataConfidence == null
                        ? "n/a"
                        : Math.round(primaryPlayer.dataConfidence)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5 text-[12px] leading-6 text-white/50">
                  {usingDemo
                    ? "Sample mode does not attach fabricated player signals."
                    : "No linked research row for this game yet — schedule context stands on its own."}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] bg-black/25 px-5 py-3">
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-white/35">
            {feedTimestamp}
          </p>
          <button
            type="button"
            onClick={onOpenPreview}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-emerald-200 transition hover:text-emerald-100"
          >
            See the full evidence
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
