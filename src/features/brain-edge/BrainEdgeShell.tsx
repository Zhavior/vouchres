import type { ReactNode } from 'react';
import { BarChart3, BrainCircuit, Crosshair } from 'lucide-react';
import {
  Z8_LABEL,
  Z8_PAGE,
  Z8_PAGE_GAP,
  Z8_PAGE_PAD_X,
  Z8_PAGE_PAD_Y,
} from '../../theme/z8Tokens';
import '../brain/brain.css';
import './brain-edge.css';

export type BrainEdgeView = 'intelligence' | 'graphs';

type Props = {
  activeView: BrainEdgeView;
  onViewChange: (view: BrainEdgeView) => void;
  header?: ReactNode;
  children: ReactNode;
};

export default function BrainEdgeShell({
  activeView,
  onViewChange,
  header,
  children,
}: Props) {
  return (
    <main
      className={`${Z8_PAGE} brain-workspace brain-edge-workspace min-h-0 min-w-0 overflow-x-hidden ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y}`}
    >
      <div className={`mx-auto flex max-w-[1480px] flex-col ${Z8_PAGE_GAP}`}>
        <header className="brain-hero brain-edge-hero rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div
                className={`${Z8_LABEL} brain-product-mark text-xs font-bold text-vouch-cyan`}
              >
                <BrainCircuit className="h-3.5 w-3.5" />
                ProjectVABrAIns · MLB Decision Laboratory
              </div>

              <h1 className="mt-2 max-w-3xl text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
                AI Edge Lab is an{' '}
                <span className="text-vouch-emerald">
                  evidence workspace.
                </span>
              </h1>

              <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-white/60 sm:text-sm">
                Research the slate, inspect individual player evidence, compare
                source-backed model inputs, review pitcher pressure, and audit judge
                signals without leaving the workspace.
              </p>
            </div>

            <div
              className="brain-edge-view-switch grid shrink-0 grid-cols-2 gap-2"
              role="tablist"
              aria-label="AI Edge Lab workspace"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeView === 'intelligence'}
                data-active={activeView === 'intelligence'}
                onClick={() => onViewChange('intelligence')}
                className="brain-tab z8-control inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 font-mono text-xs font-bold uppercase transition"
              >
                <Crosshair className="h-3.5 w-3.5" />
                Intelligence
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeView === 'graphs'}
                data-active={activeView === 'graphs'}
                onClick={() => onViewChange('graphs')}
                className="brain-tab z8-control inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 font-mono text-xs font-bold uppercase transition"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Pro Graphs
              </button>
            </div>
          </div>
        </header>

        {header ? <div className="brain-edge-sticky-header">{header}</div> : null}

        <section
          className="brain-edge-module brain-reveal min-w-0"
          data-view={activeView}
        >
          {children}
        </section>
      </div>
    </main>
  );
}
