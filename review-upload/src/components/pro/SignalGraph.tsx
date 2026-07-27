/**
 * SignalGraph.tsx — Sport-agnostic signal graph.
 *
 * The most generic graph component in the package. Accepts an array of
 * NormalizedSignal objects and renders them as horizontal bars.
 *
 * Use this for any sport (MLB, NBA, NHL, NFL) — it has zero MLB assumptions.
 * For MLB-specific HR graphs, use HrSignalGraphs instead.
 *
 * Future-proof: when NBA/NHL/NFL adapters are added, they can output
 * NormalizedSignal[] and feed it directly to this component.
 */

import React from 'react';
import type { NormalizedSignal } from '../../adapters/normalized';
import { ProGraphShell } from './ProGraphShell';
import { ProSignalBar } from './ProSignalBar';
import { VerifiedGraphEmptyState } from './VerifiedGraphEmptyState';
import { Lock } from 'lucide-react';
import { ACCENT } from '../../theme/colors';

export interface SignalGraphProps {
  /** Section title (e.g. "Edge Score Breakdown") */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Accent color */
  accent?: string;
  /** Array of normalized signals to render as bars */
  signals: NormalizedSignal[];
  /** Optional right-side badge node */
  right?: React.ReactNode;
  /** Optional footer note */
  footer?: React.ReactNode;
  /** Optional icon for the section header */
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  className?: string;
}

/**
 * SignalGraph — renders an array of NormalizedSignal objects as horizontal bars.
 * Sport-agnostic. Handles empty arrays and null signals safely.
 */
export const SignalGraph: React.FC<SignalGraphProps> = React.memo(function SignalGraph({
  title,
  subtitle,
  accent = ACCENT.matchup,
  signals,
  right,
  footer,
  icon,
  className = '',
}) {
  // Handle empty/null signals — show empty state, never crash
  if (!signals || signals.length === 0) {
    return (
      <VerifiedGraphEmptyState
        variant="no-data"
        sectionTitle={title}
        title="No signal data available"
        detail="The payload did not include any signals for this section."
        className={className}
      />
    );
  }

  const Icon = icon ?? Lock;

  return (
    <ProGraphShell
      icon={Icon}
      title={title}
      subtitle={subtitle}
      accent={accent}
      right={right}
      footer={footer}
      className={className}
    >
      <div className="space-y-2.5">
        {signals.map((signal) => (
          <ProSignalBar
            key={signal.key}
            label={signal.label}
            value={signal.value}
            max={signal.max}
            color={signal.color}
            hint={signal.hint}
          />
        ))}
      </div>
    </ProGraphShell>
  );
});

export default SignalGraph;
