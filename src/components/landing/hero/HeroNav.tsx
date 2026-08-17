import { motion } from "framer-motion";

type HeroNavProps = {
  onJoinBeta: () => void;
  onLogin: () => void;
};

export default function HeroNav({
  onJoinBeta,
  onLogin,
}: HeroNavProps) {
  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div className="mx-auto mt-5 flex max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-2xl">
        <div className="text-xl font-black tracking-tight text-white">
          VouchEdge
        </div>

        <nav className="hidden gap-8 text-sm text-white/60 md:flex">
          <a href="#experience" className="transition hover:text-white">
            Experience
          </a>

          <a href="#research" className="transition hover:text-white">
            Research
          </a>

          <a href="#record" className="transition hover:text-white">
            The Record
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={onLogin}
            className="rounded-xl px-4 py-2 text-white/70 transition hover:text-white"
          >
            Log In
          </button>

          <button
            onClick={onJoinBeta}
            className="rounded-xl bg-emerald-400 px-5 py-2 font-semibold text-black transition hover:scale-[1.03]"
          >
            Explore
          </button>
        </div>
      </div>
    </motion.header>
  );
}
