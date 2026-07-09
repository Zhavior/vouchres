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

export default function PlayerIntelligenceCard({
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
    <div className="rounded-3xl border border-white/10 bg-black/40 p-5 shadow-xl backdrop-blur">
      <div className="flex gap-4">
        {player.headshot && (
          <img
            src={player.headshot}
            alt={player.playerName ?? "Player"}
            className="h-24 w-24 rounded-2xl object-cover"
          />
        )}

        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">
            {player.playerName}
          </h2>

          <p className="text-sm text-white/60">
            {player.team} vs {player.opponent}
          </p>

          {player.opponentPitcherName && (
            <p className="mt-1 text-sm text-white/50">
              vs {player.opponentPitcherName}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">
            VouchEdge Score
          </span>

          <span
            className={`text-3xl font-black ${scoreColor(score)}`}
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

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
        <div className="mt-5 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70">
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
    <div className="rounded-xl bg-white/5 p-3">
      <div className="text-xs uppercase tracking-wide text-white/40">
        {label}
      </div>

      <div className="mt-1 text-lg font-bold text-white">
        {value}
      </div>
    </div>
  );
}


