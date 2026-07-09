import type { ButtonHTMLAttributes, ReactNode } from 'react';

type VEButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  leftIcon?: ReactNode;
};

export function VEButton({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  className = '',
  ...props
}: VEButtonProps) {
  const variantClass =
    variant === 'primary' ? 've-button-primary'
    : variant === 'secondary' ? 've-button-secondary'
    : variant === 'danger' ? 've-button-secondary border-red-500/40 text-red-300'
    : 've-button-secondary border-transparent bg-transparent hover:bg-white/5';
  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-5 py-3';
  return (
    <button
      className={`${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {leftIcon}
      {children}
    </button>
  );
}
