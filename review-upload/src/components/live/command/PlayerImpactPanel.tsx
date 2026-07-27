type Impact = {
  player: string;
  event: "HR" | "RBI" | "SB" | "HIT";
  value: number;
};

export function PlayerImpactPanel({
  impacts = [],
}: {
  impacts?: Impact[];
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/50 p-4">
      <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
        Live Impact
      </p>

      <div className="mt-3 space-y-2">
        {impacts.length === 0 ? (
          <div className="text-sm text-white/50">
            Waiting for game events...
          </div>
        ) : (
          impacts.map((impact, index) => (
            <div
              key={`${impact.player}-${index}`}
              className="rounded-xl bg-white/5 p-3 flex justify-between"
            >
              <span className="font-bold text-white">
                {impact.player}
              </span>

              <span className="text-vouch-cyan font-mono">
                {impact.event} +{impact.value}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
