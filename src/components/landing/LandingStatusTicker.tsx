import { createPortal } from 'react-dom';

const TICKER_ITEMS = [
  'VOUCHEDGE_TERMINAL // TRUST_FIRST_PROTOCOL',
  'HR_BOARD: LIVE_WHEN_SIGNED_IN',
  'JUDGE_COUNCIL: DS · PH · MR · RA · PE',
  'NO_FAKE_LINEUPS // NO_FAKE_ODDS',
  'EDGE_ISLAND: READY',
] as const;

/** Viewport-pinned marquee — portaled to body so nested scroll/transform shells cannot break fixed positioning. */
export default function LandingStatusTicker() {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="ve-terminal-ticker pointer-events-none fixed inset-x-0 bottom-0 z-[120] overflow-hidden border-t border-white/10 bg-black/85 py-2 shadow-[0_-18px_40px_rgba(0,0,0,0.75)] backdrop-blur-xl"
      aria-hidden="true"
    >
      <div className="ve-terminal-ticker-track flex gap-16 whitespace-nowrap">
        {[1, 2].map((pass) =>
          TICKER_ITEMS.map((item) => (
            <span
              key={`${pass}-${item}`}
              className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/35"
            >
              {item} //
            </span>
          )),
        )}
      </div>
    </div>,
    document.body,
  );
}
