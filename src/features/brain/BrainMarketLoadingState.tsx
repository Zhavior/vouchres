import { useEffect, useState } from "react";
import { Brain, Clock3 } from "lucide-react";
import { Z8_LABEL, Z8_PANEL_PREMIUM } from "../../theme/z8Tokens";

function formatWait(milliseconds: number | null): string {
  if (milliseconds == null) return "Waiting for the next scheduled slate";
  if (milliseconds <= 0) return "Awaiting the next scheduled Brain run";
  const totalMinutes = Math.ceil(milliseconds / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  return hours
    ? `${hours}h ${totalMinutes % 60}m until the decision window`
    : `${totalMinutes}m until the decision window`;
}

const STATE_LABELS = {
  no_games: "No games are scheduled",
  waiting_for_window: "Waiting for the decision window",
  waiting_for_evidence: "Waiting for required evidence",
  ready_to_process: "Ready for the scheduled Brain run",
  locked: "Pregame decisions are locked",
} as const;

export function BrainMarketLoadingState({
  market,
  readiness,
  millisecondsUntilWindow,
  state,
  blockers = [],
  evaluatedAt,
}: {
  market: string;
  readiness: number;
  millisecondsUntilWindow: number | null;
  state: keyof typeof STATE_LABELS;
  blockers?: string[];
  evaluatedAt?: string;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(
      () => setElapsed((value) => value + 1_000),
      1_000,
    );
    return () => window.clearInterval(timer);
  }, []);
  const remaining =
    millisecondsUntilWindow == null
      ? null
      : Math.max(0, millisecondsUntilWindow - elapsed);
  const percent = Math.max(0, Math.min(99, Math.round(readiness)));
  return (
    <div
      className={`${Z8_PANEL_PREMIUM} overflow-hidden p-5`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center border border-vouch-cyan/25 bg-vouch-cyan/5 text-vouch-cyan">
            <Brain className="h-5 w-5 animate-pulse" />
          </span>
          <div>
            <div className={`${Z8_LABEL} text-vouch-cyan`}>
              ProjectVABrAIns is thinking
            </div>
            <h3 className="mt-1 text-base font-bold text-white">
              {market} picks are not posted yet
            </h3>
            <p className="mt-1 text-sm leading-6 text-white/45">
              Waiting for fresh identity, lineup, matchup, and performance
              evidence. The Brain will not force picks.
            </p>
          </div>
        </div>
        <strong className="font-mono text-2xl text-white">{percent}%</strong>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-vouch-cyan to-vouch-emerald transition-[width] duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>
      {blockers.length > 0 && (
        <p className="mt-3 text-xs leading-5 text-amber-100/55">
          Missing or insufficient:{" "}
          {blockers.map((value) => value.replaceAll("_", " ")).join(", ")}.
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className={`${Z8_LABEL} text-white/35`}>
          Evidence readiness · {STATE_LABELS[state]}
        </span>
        <span className="flex items-center gap-2 font-mono text-[11px] text-white/50">
          <Clock3 className="h-3.5 w-3.5" />
          {state === "waiting_for_window"
            ? formatWait(remaining)
            : evaluatedAt
              ? `Checked ${new Date(evaluatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
              : "Check time unavailable"}
        </span>
      </div>
    </div>
  );
}
