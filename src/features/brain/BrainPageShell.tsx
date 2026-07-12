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
        <header className="brain-hero p-4 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className={`${Z8_LABEL} brain-product-mark`}><Brain className="h-4 w-4" /> Your VouchEdge Brain · MLB</div>
              <h1 className="mt-4 max-w-2xl text-3xl font-black leading-[1.04] tracking-[-0.035em] text-white sm:text-5xl">Your daily decision room.</h1>
              <p className="mt-3 text-sm leading-6 text-white/55">A private-feeling research workspace that compares the slate, rejects weak options, and delivers a short briefing you can understand and audit.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => onNavigate('brain_picks')} className={`z8-control inline-flex min-h-11 items-center justify-center gap-2 border px-4 font-mono text-[11px] font-bold uppercase ${active === 'picks' ? 'border-vouch-emerald/50 bg-vouch-emerald/12 text-vouch-emerald' : 'border-white/10 bg-black/30 text-white/55'}`}><Crosshair className="h-4 w-4" /> Picks</button>
              <button type="button" onClick={() => onNavigate('brain_performance')} className={`z8-control inline-flex min-h-11 items-center justify-center gap-2 border px-4 font-mono text-[11px] font-bold uppercase ${active === 'performance' ? 'border-vouch-emerald/50 bg-vouch-emerald/12 text-vouch-emerald' : 'border-white/10 bg-black/30 text-white/55'}`}><ChartNoAxesCombined className="h-4 w-4" /> Performance</button>
            </div>
          </div>
        </header>
        <div className="brain-reveal contents">{children}</div>
      </div>
    </main>
  );
}
