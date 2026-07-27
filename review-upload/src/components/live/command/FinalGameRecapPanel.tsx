type TeamSummary = {
  name?: string;
  abbreviation?: string;
};

type ScoreSummary = {
  away?: number | null;
  home?: number | null;
};

type FinalGameRecapPanelProps = {
  game: {
    away?: TeamSummary;
    home?: TeamSummary;
    venue?: string | null;
    status?: string | null;
    score?: ScoreSummary | null;
    awayProbablePitcher?: { name?: string } | null;
    homeProbablePitcher?: { name?: string } | null;
    probablePitchers?: {
      away?: { name?: string } | null;
      home?: { name?: string } | null;
    } | null;
  };
};

export function FinalGameRecapPanel({ game }: FinalGameRecapPanelProps) {
  const awayName = game.away?.name ?? game.away?.abbreviation ?? "Away";
  const homeName = game.home?.name ?? game.home?.abbreviation ?? "Home";
  const awayAbbr = game.away?.abbreviation ?? awayName;
  const homeAbbr = game.home?.abbreviation ?? homeName;

  const awayScore = game.score?.away ?? 0;
  const homeScore = game.score?.home ?? 0;

  const winner =
    awayScore > homeScore
      ? awayName
      : homeScore > awayScore
        ? homeName
        : "No clear winner";

  const margin = Math.abs(awayScore - homeScore);

  const awayPitcher =
    game.awayProbablePitcher?.name ??
    game.probablePitchers?.away?.name ??
    "Away starter";

  const homePitcher =
    game.homeProbablePitcher?.name ??
    game.probablePitchers?.home?.name ??
    "Home starter";

  const gameScript =
    awayScore === homeScore
      ? "The scoreboard closed level, so the real story is in the missed leverage spots and late-inning sequencing."
      : margin <= 2
        ? "This was a leverage game: one or two plate appearances likely changed the whole read."
        : "This game separated clearly on execution, run creation, and who controlled the pressure innings.";

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%),linear-gradient(145deg,rgba(6,15,28,0.98),rgba(3,7,14,0.96))] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.45)] sm:p-5">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">
              Vouch AI Final Read
            </span>

            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              Postgame
            </span>
          </div>

          <h3 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
            {winner === "No clear winner" ? `${awayName} vs ${homeName}` : `${winner} controlled the final read`}
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
            Final: {awayAbbr} {awayScore} – {homeScore} {homeAbbr}. {gameScript}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-xs text-white/55 lg:min-w-60">
          <p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-white/35">
            Result context
          </p>
          <p className="mt-2 font-bold text-white/75">{game.status ?? "Final"}</p>
          <p className="mt-1">{game.venue ?? "Venue TBD"}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <RecapCard
          title="Game script"
          body={`${gameScript} Vouch AI would prioritize late scoring chances, base-state pressure, and the innings where the win probability bent hardest.`}
        />

        <RecapCard
          title="Pitching read"
          body={`${awayName}: ${awayPitcher}. ${homeName}: ${homePitcher}. The postgame lens starts with who survived traffic and who forced the bullpen to cover risk.`}
        />

        <RecapCard
          title="Next betting note"
          body="Carry forward lineup pressure, bullpen usage, and which hitters produced quality contact. Those signals matter more than the final score alone."
        />
      </div>
    </section>
  );
}

function RecapCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
      <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300/80">
        {title}
      </p>
      <p className="mt-3 text-sm leading-6 text-white/70">{body}</p>
    </article>
  );
}
