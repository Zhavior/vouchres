import { Plus } from 'lucide-react';

export interface StickyResearchActionProps {
  /** e.g. "Home run market" — the market this action commits to. */
  eyebrow?: string;
  /** e.g. "Choose HR prop" */
  label: string;
  disabled?: boolean;
  /** Shown as the button label (and title tooltip) when disabled. */
  disabledReason?: string | null;
  onClick: () => void;
  /** Small trust line under the button, e.g. lineup + freshness labels joined. */
  trustLine?: string;
  className?: string;
}

/**
 * The single primary commit action for a player decision — "add to slip",
 * "save to watchlist", etc. One component so the sidebar rail, the overview
 * card, and the mobile sticky bar never drift into three different buttons
 * with three different disabled-state rules.
 */
export function StickyResearchAction({
  eyebrow,
  label,
  disabled = false,
  disabledReason,
  onClick,
  trustLine,
  className = '',
}: StickyResearchActionProps) {
  const shown = disabled ? (disabledReason ?? label) : label;
  return (
    <div className={className}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={disabled ? (disabledReason ?? undefined) : undefined}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          background: disabled ? 'hsl(var(--ve-surface-2))' : 'hsl(var(--ve-accent))',
          color: disabled ? 'hsl(var(--ve-text-secondary))' : 'hsl(var(--ve-bg))',
        }}
      >
        <span className="min-w-0">
          {eyebrow && <small className="block text-[10px] font-bold uppercase tracking-[0.14em] opacity-70">{eyebrow}</small>}
          <strong className="block truncate text-sm font-black leading-tight">{shown}</strong>
        </span>
        <Plus className="h-4 w-4 shrink-0" />
      </button>
      {trustLine && (
        <p className="mt-2 text-center text-[11px] text-white/35">{trustLine}</p>
      )}
    </div>
  );
}
