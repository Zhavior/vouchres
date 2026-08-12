import { AuroraMaxPanel, AuroraMaxTruthBadge } from '../../aurora-max/AuroraMaxPrimitives';

type TeamSummary = {
  name?: string;
  abbreviation?: string;
};

type PitcherSummary = {
  name?: string;
};

type PregameAiReadPanelProps = {
  game: {
    away?: TeamSummary;
    home?: TeamSummary;
    venue?: string | null;
    status?: string | null;
    isLive?: boolean;
    isFinal?: boolean;
    awayWinPct?: number | null;
    homeWinPct?: number | null;
    winProbability?: {
      away?: number | null;
      home?: number | null;
    } | null;
    awayProbablePitcher?: PitcherSummary | null;
    homeProbablePitcher?: PitcherSummary | null;
    probablePitchers?: {
      away?: PitcherSummary | null;
      home?: PitcherSummary | null;
    } | null;
  };
};

export function PregameAiReadPanel({ game }: PregameAiReadPanelProps) {
  const awayName = game.away?.name ?? game.away?.abbreviation ?? "Away";
  const homeName = game.home?.name ?? game.home?.abbreviation ?? "Home";

  const awayPitcher =
    game.awayProbablePitcher?.name ??
    game.probablePitchers?.away?.name ??
    "TBD";

  const homePitcher =
    game.homeProbablePitcher?.name ??
    game.probablePitchers?.home?.name ??
    "TBD";

  const homeWinPct =
    game.homeWinPct ??
    game.winProbability?.home ??
    null;

  const awayWinPct =
    game.awayWinPct ??
    game.winProbability?.away ??
    null;

  const edgeText =
    homeWinPct != null && awayWinPct != null
      ? homeWinPct >= awayWinPct
        ? `${homeName} hold the early model lean.`
        : `${awayName} hold the early model lean.`
      : "The edge is still forming while VouchEdge waits for confirmed market and lineup context.";

  return (
    <AuroraMaxPanel as="section" className="relative overflow-hidden p-4 sm:p-5">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-vouch-cyan/70 to-transparent" />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <AuroraMaxTruthBadge state="projected">Vouch AI Game Read</AuroraMaxTruthBadge>
            <AuroraMaxTruthBadge state="projected">Pregame</AuroraMaxTruthBadge>
          </div>

          <h3 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
            {awayName} at {homeName}
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
            This matchup is not live yet, so Vouch AI is reading it like a
            pregame desk: probable pitchers, early win lean, player pressure,
            and the swing points that can change the game once first pitch hits.
          </p>
        </div>

        <div className="border border-white/10 bg-black/25 p-3 text-xs text-white/55 lg:min-w-60">
          <p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-white/35">
            Game context
          </p>
          <p className="mt-2 font-bold text-white/75">{game.status ?? "Scheduled"}</p>
          <p className="mt-1">{game.venue ?? "Venue TBD"}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <ReadCard
          title="Human read"
          body={`${edgeText} The first real separator will be how each lineup handles the starting pitcher the first time through the order.`}
        />

        <ReadCard
          title="Pitching lens"
          body={`${awayName}: ${awayPitcher}. ${homeName}: ${homePitcher}. If either starter is confirmed late, treat this read as provisional until lineups lock.`}
        />

        <ReadCard
          title="What changes live"
          body="Once the game starts, this panel gives way to the Live Command Center: score, pitcher/batter matchup, live at-bat feed, win probability, and impact plays."
        />
      </div>
    </AuroraMaxPanel>
  );
}

function ReadCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <article className="aurora-max-panel border-white/10 bg-white/[0.045] p-4">
      <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-vouch-cyan/70">
        {title}
      </p>
      <p className="mt-3 text-sm leading-6 text-white/70">{body}</p>
    </article>
  );
}
