import type { IntelligenceAnalysis } from "../types";

interface Props<TPlayer = Record<string, any>> {
  player: TPlayer;
  analysis: IntelligenceAnalysis;
}

function tierLabel(tier: IntelligenceAnalysis["tier"]) {
  switch (tier) {
    case "S":
      return "★★★★★ ELITE";
    case "A":
      return "★★★★ STRONG";
    case "B":
      return "★★★ GOOD";
    case "C":
      return "★★ WATCH";
    default:
      return "★ DEVELOPING";
  }
}

export default function HeroHeader<TPlayer extends Record<string, any>>({
  player,
  analysis,
}: Props<TPlayer>) {
  const name =
    player?.playerName ??
    player?.fullName ??
    player?.name ??
    "Player";

  const team =
    player?.team ??
    player?.teamAbbreviation ??
    "";

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
        {tierLabel(analysis.tier)}
      </p>

      <h1 className="text-3xl font-black tracking-tight text-white">
        {name}
      </h1>

      <p className="text-zinc-400">
        {team}
        {team && analysis.opponent ? " • " : ""}
        {analysis.opponent ? `vs ${analysis.opponent}` : ""}
      </p>
    </div>
  );
}
