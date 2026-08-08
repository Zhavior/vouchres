import React from 'react';
import { Zap } from 'lucide-react';

interface HrProModeToggleProps {
  isProMode: boolean;
  onToggle: () => void;
  /** Fired on hover/focus so the Pro chunks are already in flight by the click. */
  onIntent?: () => void;
  className?: string;
}

/**
 * The persistent Standard/Pro switch.
 *
 * The control is a fixed 228×40 box in both states — the label, the icon well
 * and the track never change size — so flipping it moves the header by exactly
 * zero pixels. The width is set by the longer Pro-mode label so that
 * state fits without truncating.
 */
export const HrProModeToggle: React.FC<HrProModeToggleProps> = ({ isProMode, onToggle, onIntent, className = '' }) => (
  <button
    type="button"
    role="switch"
    aria-checked={isProMode}
    onClick={onToggle}
    onPointerEnter={onIntent}
    onFocus={onIntent}
    title={isProMode ? 'Switch back to the simplified board' : 'Unlock the full analytics suite'}
    data-pro={isProMode}
    className={`group inline-flex h-10 w-[228px] shrink-0 items-center gap-2 rounded-xl border px-2.5 font-mono transition duration-200 ${
      isProMode
        ? 'border-vouch-cyan/60 bg-vouch-cyan/15 text-vouch-cyan shadow-[0_0_16px_rgba(0,240,255,0.28)]'
        : 'border-white/15 bg-black/30 text-white/55 hover:border-vouch-cyan/35 hover:text-white/80'
    } ${className}`}
  >
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition duration-200 ${
        isProMode ? 'border-vouch-cyan/50 bg-vouch-cyan/20' : 'border-white/12 bg-white/5'
      }`}
    >
      <Zap className={`h-3.5 w-3.5 ${isProMode ? 'fill-current' : ''}`} />
    </span>

    <span className="min-w-0 flex-1 truncate text-left text-[10px] font-black uppercase tracking-[0.1em]">
      {isProMode ? 'Pro mode: On' : 'Pro mode: Off'}
    </span>

    <span
      aria-hidden
      className={`relative h-5 w-9 shrink-0 rounded-full border transition duration-200 ${
        isProMode ? 'border-vouch-cyan/50 bg-vouch-cyan/25' : 'border-white/15 bg-black/40'
      }`}
    >
      <span
        className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full transition-all duration-200 ${
          isProMode ? 'left-[18px] bg-vouch-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)]' : 'left-[2px] bg-white/35'
        }`}
      />
    </span>
  </button>
);

export default HrProModeToggle;
