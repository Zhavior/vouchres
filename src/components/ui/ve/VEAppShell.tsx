import type { ReactNode } from 'react';

type VEAppShellProps = {
  children: ReactNode;
  active?: string;
  onNavigate?: (section: string) => void;
};

const navItems = [
  ['island', 'Edge Island'],
  ['today', 'Today'],
  ['vouch-board', 'Vouch Board'],
  ['feed', 'Feed'],
  ['leaderboard', 'Leaderboard'],
  ['profile', 'Profile'],
  ['settings', 'Settings'],
];

export function VEAppShell({ children, active, onNavigate }: VEAppShellProps) {
  return (
    <main className="ve-page ve-grid min-h-screen text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-black/25 p-5 lg:block">
          <div className="mb-8 text-2xl font-black italic">
            Vouch<span className="text-cyan-300">Edge</span>
          </div>

          <nav className="space-y-2">
            {navItems.map(([key, label]) => (
              <button
                key={key}
                onClick={() => onNavigate?.(key)}
                className={`w-full rounded-2xl px-4 py-3 text-left text-xs font-black uppercase tracking-widest transition ${
                  active === key
                    ? 'bg-cyan-300 text-black'
                    : 'text-white/55 hover:bg-white/10 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#020617]/80 backdrop-blur-xl">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="lg:hidden text-xl font-black italic">
                Vouch<span className="text-cyan-300">Edge</span>
              </div>

              <div className="hidden text-xs font-black uppercase tracking-[0.3em] text-cyan-300 lg:block">
                Edge Island OS
              </div>

              <div className="flex gap-3">
                <button className="rounded-full border border-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-white/55">
                  Alerts
                </button>
                <button
                  onClick={() => onNavigate?.('profile')}
                  className="rounded-full border border-cyan-300/30 px-4 py-2 text-xs font-black uppercase tracking-widest text-cyan-300"
                >
                  Profile
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
