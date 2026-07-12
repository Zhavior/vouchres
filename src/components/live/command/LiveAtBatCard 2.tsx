type Batter = {
  name: string;
  average?: string;
  homeRuns?: number;
  rbi?: number;
  headshot?: string;
};

type Pitcher = {
  name: string;
};

type LiveAtBatCardProps = {
  batter?: Batter;
  pitcher?: Pitcher;
  balls?: number;
  strikes?: number;
  outs?: number;
};

export function LiveAtBatCard({
  batter,
  pitcher,
  balls = 0,
  strikes = 0,
  outs = 0,
}: LiveAtBatCardProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/50 p-4 overflow-hidden">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">
        Live At Bat
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">

        <div>
          <div className="text-xs text-white/40">
            Pitcher
          </div>

          <div className="mt-1 text-lg font-black text-white">
            {pitcher?.name ?? "Waiting..."}
          </div>
        </div>


        <div>
          <div className="text-xs text-white/40">
            Batter
          </div>

          <div className="mt-1 text-lg font-black text-cyan-400">
            {batter?.name ?? "Waiting..."}
          </div>
        </div>

      </div>


      {batter && (
        <div className="mt-4 rounded-xl bg-white/5 p-3">
          <div className="grid grid-cols-3 gap-3 text-center">

            <Stat
              label="AVG"
              value={batter.average ?? "-"}
            />

            <Stat
              label="HR"
              value={batter.homeRuns ?? 0}
            />

            <Stat
              label="RBI"
              value={batter.rbi ?? 0}
            />

          </div>
        </div>
      )}


      <div className="mt-4 flex justify-between rounded-xl bg-white/5 p-3">

        <div>
          <div className="text-xs text-white/40">
            Count
          </div>

          <div className="text-xl font-black text-white">
            {balls}-{strikes}
          </div>
        </div>


        <div>
          <div className="text-xs text-white/40">
            Outs
          </div>

          <div className="text-xl font-black text-white">
            {outs}
          </div>
        </div>

      </div>

    </section>
  );
}


function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <div className="text-[10px] text-white/40">
        {label}
      </div>

      <div className="text-lg font-black text-white">
        {value}
      </div>
    </div>
  );
}
