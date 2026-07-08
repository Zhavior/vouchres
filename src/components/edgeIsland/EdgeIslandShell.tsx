import { Activity, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import type { CreatorProofProfile } from '../../types';

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
    <main className="mx-auto w-full max-w-[1500px] px-3 py-4 font-z8 text-white sm:px-5 lg:px-6">
      <header className="mb-4 rounded-[1.5rem] border border-white/10 bg-black/35 px-4 py-4 shadow-[0_18px_70px_rgba(0,0,0,0.40)] backdrop-blur-2xl sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5">
              <Activity className="h-3.5 w-3.5 text-vouch-emerald" />
              <span className="terminal-text text-vouch-emerald">Z8 Edge Island</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {isLoggedIn ? `Morning board, ${firstName(profile)}.` : 'Morning edge board preview.'}
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-white/52">
              Today’s strongest signals, tracked players, saved slips, and next actions in one command surface.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="terminal-text">Mode</div>
              <div className="mt-1 text-sm font-black text-white">{isLoggedIn ? 'Personalized' : 'Public preview'}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="terminal-text">Sync</div>
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
