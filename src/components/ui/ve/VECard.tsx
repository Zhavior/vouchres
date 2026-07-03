import type { HTMLAttributes, ReactNode } from 'react';

type VECardTone = 'default' | 'elevated' | 'soft' | 'danger' | 'success' | 'warning';

type VECardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: VECardTone;
  interactive?: boolean;
  children: ReactNode;
};

const toneClass: Record<VECardTone, string> = {
  default: 've-card',
  elevated: 've-card ve-card-elevated',
  soft: 've-card ve-card-soft',
  danger: 've-card ve-card-danger',
  success: 've-card ve-card-success',
  warning: 've-card ve-card-warning',
};

export function VECard({
  tone = 'default',
  interactive = false,
  className = '',
  children,
  ...props
}: VECardProps) {
  return (
    <div
      className={[
        toneClass[tone],
        interactive ? 've-card-interactive' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
