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
        <header className="brain-hero p-5 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className={`${Z8_LABEL} brain-product-mark`}><Brain className="h-4 w-4" /> ProjectVABrAIns · Sports intelligence brain</div>
              <h1 className="mt-4 max-w-2xl text-3xl font-black leading-[0.96] tracking-[-0.055em] text-white sm:text-5xl">The evidence room<br /><span className="text-vouch-emerald">for every decision.</span></h1>
              <p className="brain-hero-kicker mt-4 text-sm leading-6">The Brain compares the full slate, publishes only what survives, and keeps the record visible after the game ends. No hidden certainty, no rewritten history.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" data-active={active === 'picks'} onClick={() => onNavigate('brain_picks')} className="brain-tab z8-control inline-flex min-h-11 items-center justify-center gap-2 border px-4 font-mono text-[11px] font-bold uppercase"><Crosshair className="h-4 w-4" /> Picks</button>
              <button type="button" data-active={active === 'performance'} onClick={() => onNavigate('brain_performance')} className="brain-tab z8-control inline-flex min-h-11 items-center justify-center gap-2 border px-4 font-mono text-[11px] font-bold uppercase"><ChartNoAxesCombined className="h-4 w-4" /> Performance</button>
            </div>
          </div>
        </header>
        <div className="brain-reveal">{children}</div>
      </div>
    </main>
  );
}
