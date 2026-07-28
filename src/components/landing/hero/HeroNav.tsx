import VouchEdgeLogo from "../../brand/VouchEdgeLogo";
import { LogIn } from "lucide-react";

type HeroNavProps = {
  onJoinBeta: () => void;
  onLogin: () => void;
};

export default function HeroNav({
  onJoinBeta,
  onLogin,
}: HeroNavProps) {
  return (
    <nav className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <VouchEdgeLogo showBeta />

        <div className="hidden gap-10 text-sm text-white/60 md:flex">
          <a href="#experience">Experience</a>
          <a href="#research">Research</a>
          <a href="#record">The Record</a>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onLogin}
            className="rounded-xl border border-white/10 px-4 py-2 text-white"
          >
            <LogIn className="mr-2 inline h-4 w-4" />
            Log In
          </button>

          <button
            onClick={onJoinBeta}
            className="rounded-xl bg-cyan-400 px-5 py-2 font-bold text-black"
          >
            Explore
          </button>
        </div>
      </div>
    </nav>
  );
}
