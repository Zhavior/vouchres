import type { LiveAtBatSnapshot } from "../../types/liveAtBat";

type LiveAtBatMatchupCardProps = {
  snapshot?: LiveAtBatSnapshot;
  onOpenPitcherProfile?: (pitcherId: number) => void;
};

export function LiveAtBatMatchupCard({
  snapshot,
  onOpenPitcherProfile,
}: LiveAtBatMatchupCardProps) {
  const batter = snapshot?.play?.batter;
  const pitcher = snapshot?.play?.pitcher;

  return (
    <section className="overflow-hidden border border-white/[0.08] bg-white/[0.015]">
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-ve-emerald">
            Live Matchup
          </p>
          <p className="mt-1 text-xs text-white/40">
            Pitcher vs current batter
          </p>
        </div>

        <span className="border border-ve-red/25 bg-ve-red/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-ve-red">
          Live
        </span>
      </header>

      <div className="grid grid-cols-1 gap-px bg-white/[0.08] md:grid-cols-2">
        <article className="bg-[#050505] p-4 sm:p-5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            Pitcher
          </p>

          <div className="mt-3 flex items-center gap-3">
            <PlayerAvatar
              name={pitcher?.name ?? "Pitcher"}
              imageUrl={null}
              accent="cyan"
            />

            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold tracking-tight text-white sm:text-xl">
                {pitcher?.name ?? "Waiting for pitcher"}
              </h3>

              <p className="mt-1 text-xs text-white/50">
                {pitcher?.gameLine ?? "Live pitching line unavailable"}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Metric
              label="Inning"
              value={
                snapshot?.inning != null
                  ? `${snapshot.halfInning ?? ""} ${snapshot.inning}`.trim()
                  : "—"
              }
            />
            <Metric label="Outs" value={snapshot?.outs ?? "—"} />
            <Metric
              label="Pitches"
              value={snapshot?.play?.pitches.length ?? "—"}
            />
          </div>

          {pitcher?.id != null && onOpenPitcherProfile && (
            <button
              type="button"
              onClick={() => onOpenPitcherProfile(pitcher.id as number)}
              className="mt-4 w-full border border-ve-emerald/25 bg-ve-emerald/10 px-4 py-2.5 text-sm font-medium uppercase tracking-wider text-ve-emerald transition-colors hover:border-ve-emerald/40 hover:bg-ve-emerald/20"
            >
              View Pitcher Profile
            </button>
          )}
        </article>

        <article className="bg-[#0a0a0a] p-4 sm:p-5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            At The Plate
          </p>

          <div className="mt-3 flex items-center gap-3">
            <PlayerAvatar
              name={batter?.name ?? "Batter"}
              imageUrl={batter?.headshot ?? null}
              accent="gold"
            />

            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold tracking-tight text-white sm:text-xl">
                {batter?.name ?? "Waiting for batter"}
              </h3>

              <p className="mt-1 text-xs text-white/50">
                {batter?.gameLine ?? "Live batting line unavailable"}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Metric label="Balls" value={snapshot?.count.balls ?? "—"} />
            <Metric label="Strikes" value={snapshot?.count.strikes ?? "—"} />
            <Metric
              label="Runners"
              value={countRunners(snapshot?.runners)}
            />
          </div>

          <div className="mt-4 border border-white/[0.08] bg-white/[0.03] p-3">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Current play
            </p>

            <p className="mt-1.5 text-sm leading-relaxed text-white/75">
              {snapshot?.play?.description ??
                "Waiting for the next MLB play update."}
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}

function PlayerAvatar({
  name,
  imageUrl,
  accent,
}: {
  name: string;
  imageUrl: string | null;
  accent: "cyan" | "gold";
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const accentClass =
    accent === "cyan"
      ? "border-ve-emerald/25 bg-ve-emerald/10 text-ve-emerald"
      : "border-ve-amber/25 bg-ve-amber/10 text-ve-amber";

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={`${name} headshot`}
        className="h-16 w-16 shrink-0 border border-white/[0.08] bg-white/[0.03] object-cover"
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`flex h-16 w-16 shrink-0 items-center justify-center border text-lg font-bold ${accentClass}`}
      aria-hidden="true"
    >
      {initials || "—"}
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="border border-white/[0.08] bg-white/[0.03] p-3 text-center">
      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
        {label}
      </p>

      <p className="mt-1 text-base font-bold tabular-nums text-white">
        {value}
      </p>
    </div>
  );
}

function countRunners(
  runners: LiveAtBatSnapshot["runners"] | undefined,
): number {
  if (!runners) return 0;

  return [
    runners.first,
    runners.second,
    runners.third,
  ].filter(Boolean).length;
}
