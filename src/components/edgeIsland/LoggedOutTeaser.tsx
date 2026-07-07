import { Lock, ShieldCheck } from 'lucide-react';
import type { EdgeIslandSectionProps } from './edgeIslandTypes';

export function LoggedOutTeaser({ onSectionChange }: EdgeIslandSectionProps) {
  return (
    <section className="rounded-[1.5rem] border border-emerald-400/18 bg-emerald-400/[0.055] p-4 backdrop-blur-2xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <div className="terminal-text text-vouch-emerald">Public preview</div>
          <h2 className="mt-1 text-lg font-black text-white">Sign in to turn Edge Island into your personal morning board.</h2>
          <p className="mt-1 text-sm leading-6 text-white/52">
            The preview can show today’s public edge board. A signed-in account adds saved slips, tracked players, personal record context, alerts, and premium lab shortcuts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSectionChange('feed')}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-xs font-black text-vouch-emerald transition hover:border-emerald-400/45"
          >
            <ShieldCheck className="h-4 w-4" />
            Open app preview
          </button>
          <button
            type="button"
            onClick={() => onSectionChange('premium')}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-black text-white/70 transition hover:border-vouch-cyan/30 hover:text-white"
          >
            <Lock className="h-4 w-4" />
            See premium tools
          </button>
        </div>
      </div>
    </section>
  );
}
