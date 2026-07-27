import type { CSSProperties } from 'react';
import {
  ArrowRight,
  Code2,
  Eye,
  LogIn,
  Play,
  ShieldCheck,
  Sparkles,
  Waves,
} from 'lucide-react';

type EdgeCodeWelcomeProps = {
  onLogin: () => void;
  onSignup: () => void;
  onPreviewSite: () => void;
  onEnterIsland: () => void;
};

const codeLines = [
  "const edge = createPortal('The Edge');",
  "edge.layer('welcome').sell({ proof, research, social });",
  "edge.auth.login(() => transform('The Island'));",
  "edge.signup.trial({ days: 14, cancelAnytime: true });",
  "edge.dashboard.mount(['alerts', 'todayBoard', 'ledger']);",
  "edge.ready('Enter VouchEdge when you choose');",
];

export default function EdgeCodeWelcome({
  onLogin,
  onSignup,
  onPreviewSite,
  onEnterIsland,
}: EdgeCodeWelcomeProps) {
  return (
    <section className="ve-code-stage relative overflow-hidden rounded-[2.75rem] border ve-theme-border shadow-2xl shadow-black/40">
      <span className="ve-code-orb left-[8%] top-[18%] h-3 w-3" />
      <span className="ve-code-orb right-[14%] top-[22%] h-5 w-5 [animation-delay:-2s]" />
      <span className="ve-code-orb bottom-[18%] left-[42%] h-4 w-4 [animation-delay:-4s]" />

      <div className="relative z-10 grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_0.92fr] lg:p-8">
        <div className="flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border ve-theme-border ve-theme-soft-bg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] ve-theme-accent-text">
            <Sparkles className="h-3.5 w-3.5" />
            Live portal boot
          </div>

          <h2 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl">
            The Edge is your{' '}
            <span className="ve-theme-gradient-text">command layer.</span>
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            Watch the portal boot up. New users see the sales layer first. Login or sign up,
            then the welcome layer transforms into The Island dashboard.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={onSignup}
              className="edge-portal-shine ve-theme-gradient ve-theme-glow rounded-2xl px-6 py-3.5 text-sm font-black transition hover:-translate-y-0.5"
            >
              <span className="inline-flex items-center gap-2">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>

            <button
              onClick={onLogin}
              className="rounded-2xl border ve-theme-border ve-theme-soft-bg px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5"
            >
              <span className="inline-flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Login
              </span>
            </button>

            <button
              onClick={onPreviewSite}
              className="rounded-2xl border border-slate-700 bg-slate-900/70 px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5"
            >
              <span className="inline-flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview Site
              </span>
            </button>
          </div>

          <button
            onClick={onEnterIsland}
            className="mt-4 w-fit rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-5 py-3 text-xs font-black text-emerald-100 transition hover:-translate-y-0.5"
          >
            <span className="inline-flex items-center gap-2">
              <Play className="h-4 w-4" />
              Demo the Island transition
            </span>
          </button>
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-slate-950/75 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 ve-theme-accent-text" />
              <span className="text-xs font-black text-white">edge.boot.js</span>
            </div>
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/70" />
            </div>
          </div>

          <div className="font-mono text-xs leading-6 sm:text-sm">
            {codeLines.map((line, index) => (
              <div
                key={line}
                className="ve-code-line flex gap-3"
                style={{ '--line-delay': `${index * 150}ms` } as CSSProperties}
              >
                <span className="select-none text-slate-600">{String(index + 1).padStart(2, '0')}</span>
                <span>
                  <span className="text-violet-300">{line.split('(')[0]}</span>
                  <span className="text-slate-300">{line.includes('(') ? '(' + line.split('(').slice(1).join('(') : ''}</span>
                </span>
              </div>
            ))}
            <div className="ve-code-line mt-3 flex items-center gap-2 text-emerald-300" style={{ '--line-delay': '1050ms' } as CSSProperties}>
              <ShieldCheck className="h-4 w-4" />
              system.ready <span className="ve-code-cursor" />
            </div>
          </div>

          <div className="mt-5 rounded-2xl border ve-theme-border ve-theme-soft-bg p-3">
            <div className="flex items-center gap-2 text-xs font-black text-white">
              <Waves className="h-4 w-4 ve-theme-accent-text" />
              After login: Welcome Portal → The Island
            </div>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              The user stays inside The Edge until they choose to enter the full VouchEdge site.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
