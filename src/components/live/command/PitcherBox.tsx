export type LivePitcherSummary = {
  name: string;
  team?: string;
  headshotUrl?: string;
  inningsPitched?: string;
  strikeouts?: number;
  walks?: number;
  hitsAllowed?: number;
  pitchesThrown?: number;
  strikesThrown?: number;
  maxVelocityMph?: number;
  era?: string;
  whip?: string;
};

type PitcherBoxProps = {
  pitcher?: LivePitcherSummary;
  onOpenProfile?: () => void;
};

export function PitcherBox({
  pitcher,
  onOpenProfile,
}: PitcherBoxProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-vouch-cyan/20 bg-[linear-gradient(145deg,rgba(8,18,28,0.96),rgba(4,9,16,0.92))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-vouch-cyan/70">
            Live Pitcher
          </p>
          <p className="mt-1 text-xs text-white/45">
            Current mound profile
          </p>
        </div>

        <span className="rounded-full border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-red-300">
          Live
        </span>
      </div>

      {pitcher ? (
        <>
          <div className="mt-4 flex items-center gap-3">
            {pitcher.headshotUrl ? (
              <img
                src={pitcher.headshotUrl}
                alt=""
                className="h-14 w-14 rounded-2xl border border-white/10 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl font-black text-vouch-cyan">
                {pitcher.name
                  .split(/\s+/)
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <h3 className="truncate text-xl font-black text-white">
                {pitcher.name}
              </h3>

              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-white/45">
                {pitcher.team ?? "MLB"}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="IP" value={pitcher.inningsPitched ?? "—"} />
            <Metric label="K" value={pitcher.strikeouts ?? "—"} />
            <Metric label="BB" value={pitcher.walks ?? "—"} />
            <Metric label="Pitches" value={pitcher.pitchesThrown ?? "—"} />
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Hits" value={pitcher.hitsAllowed ?? "—"} />
            <Metric label="Strikes" value={pitcher.strikesThrown ?? "—"} />
            <Metric
              label="Max Velo"
              value={
                pitcher.maxVelocityMph != null
                  ? `${pitcher.maxVelocityMph.toFixed(1)}`
                  : "—"
              }
            />
            <Metric
              label="ERA / WHIP"
              value={
                pitcher.era || pitcher.whip
                  ? `${pitcher.era ?? "—"} / ${pitcher.whip ?? "—"}`
                  : "—"
              }
            />
          </div>

          {onOpenProfile && (
            <button
              type="button"
              onClick={onOpenProfile}
              className="mt-4 w-full rounded-2xl border border-vouch-cyan/25 bg-vouch-cyan/10 px-4 py-2.5 text-sm font-black text-vouch-cyan transition hover:border-vouch-cyan/50 hover:bg-vouch-cyan/15"
            >
              View Pitcher Profile
            </button>
          )}
        </>
      ) : (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/50">
          Waiting for the MLB live feed to identify the active pitcher.
        </div>
      )}
    </section>
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
    <div className="rounded-2xl border border-white/8 bg-white/[0.045] p-3">
      <p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <p className="mt-1 truncate text-base font-black text-white">
        {value}
      </p>
    </div>
  );
}
