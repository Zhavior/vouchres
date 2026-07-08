/**
 * SignalPanel.tsx — Sport-agnostic signal panel.
 *
 * Generic panel that renders a header + signal graph + optional action.
 * Use this for any sport's player/team/game deep-dive views.
 *
 * For MLB-specific player panels, use PlayerSignalPanel instead.
 */

import React from 'react';
import type { NormalizedSignal } from '../../adapters/normalized';
import { ACCENT, withAlpha } from '../../theme/colors';
import { SignalGraph, type SignalGraphProps } from './SignalGraph';
import { VerifiedGraphEmptyState } from './VerifiedGraphEmptyState';

export interface SignalPanelProps {
  /** Panel title (e.g. "Player Edge Lab") */
  title: string;
  /** Optional header subtitle */
  subtitle?: string;
  /** Accent color */
  accent?: string;
  /** Header content (e.g. player name + team) */
  header?: React.ReactNode;
  /** Signal graph configuration */
  graph: Omit<SignalGraphProps, 'className'>;
  /** Optional warnings to show above the graph */
  warnings?: string[];
  /** Optional action button (e.g. "Add to Parlay") */
  action?: React.ReactNode;
  /** Show empty state if graph.signals is empty */
  className?: string;
}

export const SignalPanel: React.FC<SignalPanelProps> = React.memo(function SignalPanel({
  title,
  subtitle,
  accent = ACCENT.matchup,
  header,
  graph,
  warnings = [],
  action,
  className = '',
}) {
  // Handle missing graph signals — show empty state
  if (!graph.signals || graph.signals.length === 0) {
    return (
      <VerifiedGraphEmptyState
        variant="no-data"
        title={`${title} unavailable`}
        detail="No signal data was provided for this panel."
        className={className}
      />
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      {header && (
        <div
          className="ve-card rounded-2xl p-3"
          style={{ borderColor: withAlpha(accent, 0.16) }}
        >
          {header}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-[hsl(var(--ve-accent-gold)/0.26)] bg-[hsl(var(--ve-accent-gold)/0.06)] p-2.5">
          <div className="space-y-1">
            {warnings.slice(0, 3).map((w, i) => (
              <p key={i} className="text-[11px] leading-snug text-[hsl(var(--ve-text-secondary))]">
                {w}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Signal graph */}
      <SignalGraph {...graph} accent={accent} />

      {/* Optional action */}
      {action && <div>{action}</div>}
    </div>
  );
});

export default SignalPanel;
