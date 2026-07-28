import { motion } from "framer-motion";

type HeroContentProps = {
  onJoinBeta: () => void;
  onViewDemo: () => void;
};

export default function HeroContent({
  onJoinBeta,
  onViewDemo,
}: HeroContentProps) {
  return (
    <div className="relative z-20 mx-auto flex max-w-5xl flex-col items-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <p className="mb-6 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">
          VouchEdge
        </p>

        <h1 className="text-6xl font-black leading-[0.9] tracking-[-0.06em] text-white md:text-8xl xl:text-9xl">
          The game begins
          <br />
          before the first pitch.
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-white/70 md:text-xl">
          Live sports intelligence that reveals every signal, every reason,
          and every result before the game unfolds.
        </p>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={onJoinBeta}
            className="rounded-2xl bg-cyan-400 px-8 py-4 text-lg font-semibold text-black transition duration-300 hover:scale-[1.03] hover:bg-cyan-300"
          >
            Explore Today's Games
          </button>

          <button
            onClick={onViewDemo}
            className="rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-lg font-medium text-white backdrop-blur-xl transition duration-300 hover:bg-white/10"
          >
            Watch the Experience
          </button>
        </div>
      </motion.div>
    </div>
  );
}
