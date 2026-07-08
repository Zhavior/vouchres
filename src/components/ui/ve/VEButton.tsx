import type { ButtonHTMLAttributes, ReactNode } from 'react';

type VEButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
};

export function VEButton({
  children,
  variant = 'primary',
  className = '',
  ...props
}: VEButtonProps) {
  return (
    <button
      className={`${variant === 'primary' ? 've-button-primary' : 've-button-secondary'} px-5 py-3 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
