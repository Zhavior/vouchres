import { Activity, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import type { CreatorProofProfile } from '../../types';
import {
  Z8_LABEL,
  Z8_PAGE,
  Z8_PAGE_PAD_X,
  Z8_PAGE_PAD_Y,
  Z8_STAT_CHIP,
} from '../../theme/z8Tokens';

interface EdgeIslandShellProps {
  children: ReactNode;
  profile?: CreatorProofProfile | null;
  isLoggedIn: boolean;
  updatedAt: string | null;
}

function firstName(profile?: CreatorProofProfile | null): string {
  return profile?.displayName?.trim().split(/\s+/)[0] || 'Capper';
}

function formatSyncTime(updatedAt: string | null): string {
  if (!updatedAt) return 'Waiting for sync';
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return 'Synced';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function EdgeIslandShell({ children, profile, isLoggedIn, updatedAt }: EdgeIslandShellProps) {
  const syncLabel = formatSyncTime(updatedAt);

  return (
    <main
      className={`${Z8_PAGE} ve-page-shell relative mx-auto w-full min-w-0 max-w-[1500px] overflow-x-hidden ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y} ve-safe-bottom bg-ve-obsidian text-ve-flash`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,240,255,0.14),transparent_70%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:32px_32px]"
        aria-hidden
      />

      <header className="glass-command ve-premium-panel relative mb-5 w-full overflow-hidden rounded-[1.75rem] border border-ve-fuse/45 px-4 py-5 shadow-[0_0_48px_rgba(0,229,255,0.1)] sm:px-6 sm:py-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-ve-ion/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-vouch-emerald/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-ve-ion/50 to-transparent" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-ve-ion/35 bg-ve-ion/10 px-3 py-1.5 shadow-[inset_0_0_14px_rgba(0,229,255,0.1)]">
              <Sparkles className="h-3.5 w-3.5 text-ve-ion" />
              <span className={`terminal-text ${Z8_LABEL} text-ve-ion`}>The Edge Island</span>
              <Zap className="h-3 w-3 text-ve-ion/70" />
            </div>

            <h1 className="text-2xl font-black tracking-tight text-ve-flash sm:text-[2rem] lg:text-4xl">
              {isLoggedIn ? (
                <>
                  Morning board,{' '}
                  <span className="bg-gradient-to-r from-ve-ion to-vouch-emerald bg-clip-text text-transparent">
                    {firstName(profile)}.
                  </span>
                </>
              ) : (
                'Morning edge board preview.'
              )}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-ve-ion/50 sm:text-[15px]">
              Today&apos;s strongest signals, tracked players, saved slips, and next actions — one command surface built from verified backend data.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-stretch lg:shrink-0">
            <div className={`${Z8_STAT_CHIP} min-h-11 min-w-[7.5rem] border border-ve-fuse/40 bg-ve-graphite/50 backdrop-blur-sm`}>
              <div className={`${Z8_LABEL} text-ve-ion/45`}>Mode</div>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-black text-ve-flash">
                <Activity className="h-3.5 w-3.5 shrink-0 text-vouch-emerald" />
                {isLoggedIn ? 'Personalized' : 'Preview'}
              </div>
            </div>
            <div className={`${Z8_STAT_CHIP} min-h-11 min-w-[7.5rem] border border-ve-fuse/40 bg-ve-graphite/50 backdrop-blur-sm`}>
              <div className={`${Z8_LABEL} text-ve-ion/45`}>Backend</div>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-black text-ve-flash">
                <ShieldCheck className={`h-3.5 w-3.5 shrink-0 ${updatedAt ? 'text-vouch-emerald' : 'text-white/35'}`} />
                {updatedAt ? 'Live' : 'Waiting'}
              </div>
              <div className="mt-0.5 text-[10px] font-semibold text-white/35">{syncLabel}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative grid min-w-0 grid-cols-1 gap-5 md:gap-6">{children}</div>
    </main>
  );
}
