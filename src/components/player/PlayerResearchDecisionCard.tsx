import type { NormalizedPlayerPayload } from "@/adapters/normalized";

interface Props {
  payload: NormalizedPlayerPayload;
  onOpen?: () => void;
}

function scoreColor(score: number | null | undefined) {
  if (!score) return "text-white/60";
  if (score >= 85) return "text-green-400";
  if (score >= 70) return "text-yellow-400";
  return "text-red-400";
}

export default function PlayerResearchDecisionCard({
  payload,
  onOpen,
}: Props) {
  const {
    player,
    scoreBreakdown,
    matchup,
    recentForm,
  } = payload;

  const score =
    scoreBreakdown?.finalScore ??
    player.vouchScore ??
    player.hrEdge ??
    0;

  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/40 p-3 shadow-xl backdrop-blur sm:rounded-3xl sm:p-5">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        {player.headshot && (
          <img
            src={player.headshot}
            alt={player.playerName ?? "Player"}
            className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-24 sm:w-24 sm:rounded-2xl"
          />
        )}

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold text-white sm:text-2xl">
            {player.playerName}
          </h2>

          <p className="truncate text-xs text-white/60 sm:text-sm">
            {player.team} vs {player.opponent}
          </p>

          {player.opponentPitcherName && (
            <p className="mt-1 truncate text-xs text-white/50 sm:text-sm">
              vs {player.opponentPitcherName}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-white/5 p-3 sm:mt-6 sm:rounded-2xl sm:p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/60 sm:text-sm">
            VouchEdge Score
          </span>

          <span
            className={`text-2xl font-black sm:text-3xl ${scoreColor(score)}`}
          >
            {score}
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-400"
            style={{
              width: `${Math.min(score, 100)}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
        <Signal
          label="HR Edge"
          value={
            player.hrEdge
              ? `${player.hrEdge}`
              : "N/A"
          }
        />

        <Signal
          label="Pitcher Vulnerability"
          value={
            scoreBreakdown?.pitcherVulnerability
              ? `${scoreBreakdown.pitcherVulnerability}`
              : matchup?.pitcherVulnerability
                ? `${matchup.pitcherVulnerability}`
                : "N/A"
          }
        />

        <Signal
          label="Recent Power"
          value={
            recentForm?.recentPowerScore
              ? `${recentForm.recentPowerScore}`
              : "N/A"
          }
        />

        <Signal
          label="Weather Boost"
          value={
            matchup?.weatherBoost
              ? `+${matchup.weatherBoost}%`
              : "N/A"
          }
        />
      </div>

      {player.riskLabel && (
        <div className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-xs text-white/70 sm:mt-5 sm:px-4 sm:py-3 sm:text-sm">
          Risk:
          <span className="ml-2 font-semibold text-white">
            {player.riskLabel}
          </span>
        </div>
      )}

      {onOpen && (
        <button
          onClick={onOpen}
          className="mt-5 w-full rounded-xl bg-white px-4 py-3 font-bold text-black transition hover:bg-white/90"
        >
          Open Full Intelligence
        </button>
      )}
    </div>
  );
}

function Signal({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-white/5 p-2.5 sm:p-3">
      <div className="truncate text-[10px] uppercase tracking-wide text-white/40 sm:text-xs">
        {label}
      </div>

      <div className="mt-1 truncate text-base font-bold text-white sm:text-lg">
        {value}
      </div>
    </div>
  );
}

