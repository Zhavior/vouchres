import type { LiveAtBatSnapshot } from "../../types/liveAtBat";

type PlayerIntelligenceCardProps = {
  snapshot?: LiveAtBatSnapshot;
  onOpenPitcherProfile?: (pitcherId: number) => void;
};

export function PlayerIntelligenceCard({
  snapshot,
  onOpenPitcherProfile,
}: PlayerIntelligenceCardProps) {
  const batter = snapshot?.play?.batter;
  const pitcher = snapshot?.play?.pitcher;

  return (
    <section className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-[linear-gradient(145deg,rgba(8,20,31,0.97),rgba(4,9,16,0.95))] shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/70">
            Live Matchup
          </p>
          <p className="mt-1 text-xs text-white/45">
            Pitcher vs current batter
          </p>
        </div>

        <span className="rounded-full border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-red-300">
          Live
        </span>
      </header>

      <div className="grid grid-cols-1 gap-px bg-white/10 md:grid-cols-2">
        <article className="bg-ve-obsidian p-4 sm:p-5">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
            Pitcher
          </p>

          <div className="mt-3 flex items-center gap-3">
            <PlayerAvatar
              name={pitcher?.name ?? "Pitcher"}
              imageUrl={null}
              accent="cyan"
            />

            <div className="min-w-0">
              <h3 className="truncate text-lg font-black text-white sm:text-xl">
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
              className="mt-4 w-full rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2.5 text-sm font-black text-cyan-300 transition hover:border-cyan-300/50 hover:bg-cyan-400/15"
            >
              View Pitcher Profile
            </button>
          )}
        </article>

        <article className="bg-ve-storm p-4 sm:p-5">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
            At The Plate
          </p>

          <div className="mt-3 flex items-center gap-3">
            <PlayerAvatar
              name={batter?.name ?? "Batter"}
              imageUrl={batter?.headshot ?? null}
              accent="gold"
            />

            <div className="min-w-0">
              <h3 className="truncate text-lg font-black text-white sm:text-xl">
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

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
            <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-white/35">
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
      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
      : "border-amber-300/30 bg-amber-300/10 text-amber-200";

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={`${name} headshot`}
        className="h-16 w-16 shrink-0 rounded-2xl border border-white/10 bg-black/30 object-cover"
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border text-lg font-black ${accentClass}`}
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-center">
      <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-white/35">
        {label}
      </p>

      <p className="mt-1 text-base font-black text-white">
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
