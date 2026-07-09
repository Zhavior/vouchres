import { Activity, ShieldCheck, Zap } from 'lucide-react';
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

export function EdgeIslandShell({ children, profile, isLoggedIn, updatedAt }: EdgeIslandShellProps) {
  return (
    <main className={`${Z8_PAGE} ve-page-shell mx-auto w-full max-w-[1500px] ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y} bg-ve-obsidian text-ve-flash`}>
      <header className="glass-command ve-premium-panel relative mb-4 overflow-hidden rounded-[1.5rem] border border-ve-fuse/50 px-4 py-4 shadow-[0_0_40px_rgba(0,229,255,0.08)] sm:px-5">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-ve-ion/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-vouch-emerald/8 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-ve-ion/35 bg-ve-ion/10 px-3 py-1.5 shadow-[inset_0_0_12px_rgba(0,229,255,0.12)]">
              <Activity className="h-3.5 w-3.5 text-ve-ion" />
              <span className={`terminal-text ${Z8_LABEL} text-ve-ion`}>Lightning Edge Island</span>
              <Zap className="h-3 w-3 text-ve-ion/70" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-ve-flash sm:text-3xl">
              {isLoggedIn ? `Morning board, ${firstName(profile)}.` : 'Morning edge board preview.'}
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-ve-ion/45">
              Today’s strongest signals, tracked players, saved slips, and next actions in one command surface.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <div className={`${Z8_STAT_CHIP} border border-ve-fuse/40 bg-ve-graphite/40`}>
              <div className={`${Z8_LABEL} text-ve-ion/40`}>Mode</div>
              <div className="mt-1 text-sm font-black text-ve-flash">{isLoggedIn ? 'Personalized' : 'Public preview'}</div>
            </div>
            <div className={`${Z8_STAT_CHIP} border border-ve-fuse/40 bg-ve-graphite/40`}>
              <div className={`${Z8_LABEL} text-ve-ion/40`}>Sync</div>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-black text-ve-flash">
                <ShieldCheck className="h-3.5 w-3.5 text-vouch-emerald" />
                {updatedAt ? 'Live data' : 'Waiting'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {children}
    </main>
  );
}
