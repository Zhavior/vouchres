import type { HTMLAttributes, ReactNode } from 'react';
import { Z8_PANEL_PREMIUM, Z8_SURFACE } from '../../../theme/z8Tokens';

type VECardTone = 'default' | 'soft' | 'elevated' | 'strong';

type VECardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  tone?: VECardTone;
  interactive?: boolean;
};

const TONE_SHELL: Record<VECardTone, string> = {
  default: Z8_PANEL_PREMIUM,
  soft: `${Z8_SURFACE} rounded-2xl`,
  elevated: Z8_PANEL_PREMIUM,
  strong: 've-card-strong',
};

export function VECard({
  children,
  className = '',
  strong = false,
  tone,
  interactive = false,
  ...rest
}: VECardProps) {
  const shell = strong
    ? TONE_SHELL.strong
    : tone
      ? TONE_SHELL[tone]
      : 've-card';

  return (
    <div
      className={`${shell} p-6 ${interactive ? 'z8-interactive' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
