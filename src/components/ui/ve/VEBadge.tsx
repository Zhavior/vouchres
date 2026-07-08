import type { HTMLAttributes, ReactNode } from 'react';

type VEBadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

type VEBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: VEBadgeTone;
  children: ReactNode;
};

const toneClass: Record<VEBadgeTone, string> = {
  neutral: 've-badge',
  info: 've-badge',
  success: 've-badge ve-badge-good',
  warning: 've-badge ve-badge-risk',
  danger: 've-badge ve-badge-danger',
};

export function VEBadge({
  tone = 'neutral',
  className = '',
  children,
  ...props
}: VEBadgeProps) {
  return (
    <span
      className={[toneClass[tone], className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </span>
  );
}
