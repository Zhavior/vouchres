import { Activity, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import type { CreatorProofProfile } from '../../types';
import {
  Z8_LABEL,
  Z8_PAGE,
  Z8_PAGE_PAD_X,
  Z8_PAGE_PAD_Y,
  Z8_PANEL_PREMIUM,
  Z8_SECTION_HEADER,
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
    <main className={`${Z8_PAGE} mx-auto w-full max-w-[1500px] ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y}`}>
      <header className={`${Z8_SECTION_HEADER} mb-4 rounded-[1.5rem] ${Z8_PANEL_PREMIUM} px-4 py-4 sm:px-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-vouch-cyan/20 bg-vouch-cyan/10 px-3 py-1.5">
              <Activity className="h-3.5 w-3.5 text-vouch-cyan" />
              <span className={`terminal-text ${Z8_LABEL} text-vouch-cyan`}>Z8 Edge Island</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {isLoggedIn ? `Morning board, ${firstName(profile)}.` : 'Morning edge board preview.'}
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-white/52">
              Today’s strongest signals, tracked players, saved slips, and next actions in one command surface.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <div className={Z8_STAT_CHIP}>
              <div className={`${Z8_LABEL} text-white/40`}>Mode</div>
              <div className="mt-1 text-sm font-black text-white">{isLoggedIn ? 'Personalized' : 'Public preview'}</div>
            </div>
            <div className={Z8_STAT_CHIP}>
              <div className={`${Z8_LABEL} text-white/40`}>Sync</div>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-black text-white">
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
