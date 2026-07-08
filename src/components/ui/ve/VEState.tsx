import type { ReactNode } from 'react';
import { VEButton } from './VEButton';
import { VECard } from './VECard';

type VEStateTone = 'loading' | 'empty' | 'error' | 'success';

type VEStateProps = {
  tone?: VEStateTone;
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

export function VEState({
  tone = 'empty',
  eyebrow,
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: VEStateProps) {
  return (
    <VECard className={`ve-state ve-state-${tone}`}>
      {icon ? <div className="ve-state-icon">{icon}</div> : null}
      {eyebrow ? <div className="ve-kicker">{eyebrow}</div> : null}
      <h2 className="ve-state-title">{title}</h2>
      {description ? <p className="ve-state-description">{description}</p> : null}
      {actionLabel && onAction ? (
        <VEButton variant={tone === 'error' ? 'danger' : 'secondary'} onClick={onAction}>
          {actionLabel}
        </VEButton>
      ) : null}
    </VECard>
  );
}
