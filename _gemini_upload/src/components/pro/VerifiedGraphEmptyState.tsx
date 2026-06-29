/**
 * VerifiedGraphEmptyState.tsx — Honest empty state for graph sections.
 *
 * Wraps VerifiedDataNotice in a graph-section-sized container.
 * Used when a graph section has NO data to render (all fields null).
 *
 * This component NEVER fakes data. It shows exactly what's missing.
 */

import React from 'react';
import { VerifiedDataNotice, type VerifiedDataNoticeVariant } from './VerifiedDataNotice';

export interface VerifiedGraphEmptyStateProps {
  variant: VerifiedDataNoticeVariant;
  title?: string;
  detail?: string;
  /** Optional section header (matches ProGraphShell header style) */
  sectionTitle?: string;
  className?: string;
}

export const VerifiedGraphEmptyState: React.FC<VerifiedGraphEmptyStateProps> = React.memo(
  function VerifiedGraphEmptyState({
    variant,
    title,
    detail,
    sectionTitle,
    className = '',
  }) {
    return (
      <section
        className={`rounded-2xl border border-slate-800/70 bg-slate-950/35 p-3 ${className}`}
      >
        {sectionTitle && (
          <h4 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">
            {sectionTitle}
          </h4>
        )}
        <VerifiedDataNotice variant={variant} title={title} detail={detail} />
      </section>
    );
  }
);

export default VerifiedGraphEmptyState;
