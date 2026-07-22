import type { ReactNode } from 'react';
import { Flame, ShieldAlert, Sparkles, Activity } from 'lucide-react';
import { Z8_LABEL, Z8_PAGE, Z8_PAGE_GAP, Z8_PAGE_PAD_X, Z8_PAGE_PAD_Y } from '../../theme/z8Tokens';

export function MatchupPageShell({
  active,
  onNavigate,
  children,
}: {
  active: 'hitter' | 'pitcher';
  onNavigate?: (section: string) => void;
  children: ReactNode;
}) {
  const handleNav = (section: string) => {
    if (onNavigate) {
      onNavigate(section);
    } else {
      window.location.hash = `#/${section.replace('_', '-')}`;
    }
  };

  return (
    <main className={`${Z8_PAGE} matchup-workspace min-h-0 min-w-0 overflow-x-hidden ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y}`}>
      <div className={`mx-auto flex max-w-[1380px] flex-col ${Z8_PAGE_GAP}`}>
        {/* Unified Matchup Header Hero */}
        <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a121e] via-[#070c14] to-[#04080e] p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className={`${Z8_LABEL} flex items-center gap-2 text-vouch-cyan font-bold`}>
                <Sparkles className="h-4 w-4 text-vouch-cyan" /> Matchup Intelligence Suite · Statcast & Sabermetric Hub
              </div>
              <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
                Batter vs. Pitcher <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-vouch-cyan via-vouch-emerald to-amber-300">
                  Sabermetric Edge Matrix
                </span>
              </h1>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-300 max-w-2xl">
                Analyze Log5 HR probability ratios, Statcast xwOBA/HardHit vulnerabilities, pitch arsenal frequencies, and platoon splits across today's entire slate.
              </p>
            </div>

            {/* Unified Suite Navigation Tabs */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <button
                type="button"
                data-active={active === 'hitter'}
                onClick={() => handleNav('hitter_matchup')}
                className={`group flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl border font-mono text-xs font-black uppercase tracking-wider transition ${
                  active === 'hitter'
                    ? 'border-vouch-emerald/50 bg-vouch-emerald/15 text-vouch-emerald shadow-lg shadow-vouch-emerald/10'
                    : 'border-white/10 bg-black/40 text-slate-400 hover:border-white/20 hover:text-white'
                }`}
              >
                <Flame className={`h-4 w-4 transition ${active === 'hitter' ? 'text-vouch-emerald' : 'text-slate-400 group-hover:text-rose-400'}`} />
                <span>Hitter Matchups</span>
              </button>

              <button
                type="button"
                data-active={active === 'pitcher'}
                onClick={() => handleNav('pitcher_matchup')}
                className={`group flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl border font-mono text-xs font-black uppercase tracking-wider transition ${
                  active === 'pitcher'
                    ? 'border-vouch-cyan/50 bg-vouch-cyan/15 text-vouch-cyan shadow-lg shadow-vouch-cyan/10'
                    : 'border-white/10 bg-black/40 text-slate-400 hover:border-white/20 hover:text-white'
                }`}
              >
                <ShieldAlert className={`h-4 w-4 transition ${active === 'pitcher' ? 'text-vouch-cyan' : 'text-slate-400 group-hover:text-vouch-cyan'}`} />
                <span>Pitcher Matchups</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <div className="matchup-reveal space-y-6">{children}</div>
      </div>
    </main>
  );
}
