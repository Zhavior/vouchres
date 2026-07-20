import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { hasTierAccess, type RequiredTier } from '../pro/proAccessUtils';
import type { CreatorProofProfile } from '../../types';

export interface ProResearchGateProps {
  profile: Pick<CreatorProofProfile, 'subscriptionTier'>;
  required?: RequiredTier;
  /** What this section actually contains — shown on the lock card. */
  title: string;
  detail?: string;
  onUpgrade?: () => void;
  children: ReactNode;
}

/**
 * Wraps any deep-research section behind the Pro tier boundary. Renders
 * children unmodified once entitled — never a blurred/teaser copy of real
 * data, since that risks implying values that aren't actually available.
 */
export function ProResearchGate({
  profile,
  required = 'GOLD',
  title,
  detail,
  onUpgrade,
  children,
}: ProResearchGateProps) {
  if (hasTierAccess(profile, required)) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-[hsl(var(--ve-accent)/0.3)] bg-[hsl(var(--ve-accent)/0.10)]">
        <Lock className="h-5 w-5 text-[hsl(var(--ve-accent))]" />
      </span>
      <div>
        <p className="text-sm font-black uppercase tracking-[0.1em] text-white">{title}</p>
        <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-white/45">
          {detail ?? 'This deep-research view requires a Pro subscription. No simulated data is shown in its place.'}
        </p>
      </div>
      {onUpgrade && (
        <button
          type="button"
          onClick={onUpgrade}
          className="rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wide"
          style={{ background: 'hsl(var(--ve-accent))', color: 'hsl(var(--ve-bg))' }}
        >
          Unlock Pro research
        </button>
      )}
    </div>
  );
}
