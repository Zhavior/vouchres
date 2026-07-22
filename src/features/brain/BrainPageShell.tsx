import type { ReactNode } from 'react';
import { Brain, ChartNoAxesCombined, Crosshair } from 'lucide-react';
import { Z8_LABEL, Z8_PAGE, Z8_PAGE_GAP, Z8_PAGE_PAD_X, Z8_PAGE_PAD_Y } from '../../theme/z8Tokens';
import './brain.css';

export function BrainPageShell({
  active,
  onNavigate,
  children,
}: {
  active: 'picks' | 'performance';
  onNavigate: (section: string) => void;
  children: ReactNode;
}) {
  return (
    <main className={`${Z8_PAGE} brain-workspace min-h-0 min-w-0 overflow-x-hidden ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y}`}>
      <div className={`mx-auto flex max-w-[1380px] flex-col ${Z8_PAGE_GAP}`}>
        <header className="brain-hero rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className={`${Z8_LABEL} brain-product-mark text-xs font-bold text-vouch-cyan`}>
                <Brain className="h-3.5 w-3.5 text-vouch-cyan" /> ProjectVABrAIns · Sports Intelligence Brain
              </div>
              <h1 className="mt-2 max-w-2xl text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
                The evidence room <span className="text-vouch-emerald">for every decision.</span>
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs sm:text-sm leading-relaxed text-white/60">
                The Brain compares the full slate, publishes only what survives, and keeps the record visible after the game ends. No hidden certainty, no rewritten history.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 shrink-0">
              <button
                type="button"
                data-active={active === 'picks'}
                onClick={() => onNavigate('brain_picks')}
                className="brain-tab z8-control inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 font-mono text-xs font-bold uppercase transition"
              >
                <Crosshair className="h-3.5 w-3.5" /> Picks
              </button>
              <button
                type="button"
                data-active={active === 'performance'}
                onClick={() => onNavigate('brain_performance')}
                className="brain-tab z8-control inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 font-mono text-xs font-bold uppercase transition"
              >
                <ChartNoAxesCombined className="h-3.5 w-3.5" /> Performance
              </button>
            </div>
          </div>
        </header>
        <div className="brain-reveal">{children}</div>
      </div>
    </main>
  );
}
