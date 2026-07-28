import { motion } from 'framer-motion';
export default function LiveHud() {
  const metrics = [
    ["Pitching", 90],
    ["Bullpen", 84],
    ["Weather", 72],
    ["Travel", 91],
  ] as const;

  return (
    <div className="space-y-6 animate-[float_6s_ease-in-out_infinite] rounded-[32px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
            Live Matchup
          </p>
          <h3 className="mt-2 text-2xl font-bold text-white">
            Yankees vs Blue Jays
          </h3>
        </div>

        <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-300">
          LIVE
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <div className="flex items-center justify-between">
          <span className="text-white/60">Confidence</span>

          <span className="text-5xl font-black text-cyan-300">
            82%
          </span>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-cyan-300"
            initial={{ width: 0 }}
            animate={{ width: "82%" }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {metrics.map(([label, value]) => (
          <div key={label}>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-white/70">{label}</span>
              <span className="text-white">{value}%</span>
            </div>

            <div className="h-2 rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-300"
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{
                  duration: 1,
                  delay: value / 200,
                  ease: "easeOut",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.03] p-4">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-cyan-300">
          Evidence
        </p>

        <div className="space-y-2 text-sm text-white/75">
          <div>✓ Bullpen rested</div>
          <div>✓ Wind favors hitters</div>
          <div>✓ Line movement +3%</div>
          <div>✓ No late injuries</div>
        </div>
      </div>
    </div>
  );
}
