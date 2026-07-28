import type { IntelligenceAnalysis } from "./types";
import HeroHeader from "./Hero/HeroHeader";
import HeroScore from "./Hero/HeroScore";
import HeroSignals from "./Hero/HeroSignals";

interface Props<TPlayer = Record<string, unknown>> {
  player: TPlayer;
  analysis: IntelligenceAnalysis;
}

function formatPercentage(value: number | null | undefined, showPlus = false) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }

  const prefix = showPlus && value > 0 ? "+" : "";
  return `${prefix}${value}%`;
}

function formatTier(tier: string | null | undefined) {
  const normalizedTier = tier?.trim();

  if (!normalizedTier) {
    return "Matchup tier unavailable";
  }

  return `${normalizedTier} matchup`;
}

export default function Hero<TPlayer extends Record<string, unknown>>({
  player,
  analysis,
}: Props<TPlayer>) {
  const playerName =
    (typeof player.playerName === "string" && player.playerName) ||
    (typeof player.name === "string" && player.name) ||
    (typeof player.fullName === "string" && player.fullName) ||
    "Unknown Player";

  const team =
    (typeof player.team === "string" && player.team) ||
    (typeof player.teamAbbreviation === "string" &&
      player.teamAbbreviation) ||
    "";

  const evidence = Array.isArray(analysis.evidence)
    ? analysis.evidence
        .map((item, index) => {
          const record = item as unknown as Record<string, unknown>;

          const possibleLabel = [
            record.label,
            record.title,
            record.text,
            record.description,
            record.value,
          ].find(
            (value): value is string =>
              typeof value === "string" && value.trim().length > 0,
          );

          if (!possibleLabel) {
            return null;
          }

          const id =
            typeof record.id === "string" || typeof record.id === "number"
              ? String(record.id)
              : String(index);

          return {
            key: `${id}-${possibleLabel}`,
            label: possibleLabel,
          };
        })
        .filter(
          (
            item,
          ): item is {
            key: string;
            label: string;
          } => item !== null,
        )
    : [];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-zinc-950 p-6 shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />

      <div className="relative space-y-6">
        <HeroHeader player={player} analysis={analysis} />

        <HeroScore analysis={analysis} />

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="text-xs uppercase text-zinc-500">Edge</div>
            <div className="mt-2 text-2xl font-bold text-emerald-400">
              {formatPercentage(analysis.edge, true)}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="text-xs uppercase text-zinc-500">
              Confidence
            </div>
            <div className="mt-2 text-2xl font-bold text-cyan-300">
              {formatPercentage(analysis.confidence)}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="text-xs uppercase text-zinc-500">Tier</div>
            <div className="mt-2 truncate text-2xl font-bold text-yellow-300">
              {analysis.tier || "—"}
            </div>
          </div>
        </div>

        {evidence.length > 0 ? (
          <div className="flex flex-wrap gap-2" aria-label="Verified evidence">
            {evidence.map((item) => (
              <div
                key={item.key}
                className="rounded-full border border-cyan-500/15 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-200"
              >
                {item.label}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-white/45">
            Verified matchup evidence is not available in the current player
            payload.
          </div>
        )}
      </div>
    </section>
  );
}