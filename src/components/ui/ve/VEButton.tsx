import type { ButtonHTMLAttributes, ReactNode } from 'react';

type VEButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type VEButtonSize = 'sm' | 'md' | 'lg';

type VEButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: VEButtonVariant;
  size?: VEButtonSize;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
};

const variantClass: Record<VEButtonVariant, string> = {
  primary: 've-btn ve-btn-primary',
  secondary: 've-btn ve-btn-secondary',
  ghost: 've-btn ve-btn-ghost',
  danger: 've-btn ve-btn-danger',
  success: 've-btn ve-btn-success',
};

const sizeClass: Record<VEButtonSize, string> = {
  sm: 've-btn-sm',
  md: 've-btn-md',
  lg: 've-btn-lg',
};

export function VEButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  children,
  ...props
}: VEButtonProps) {
  return (
    <button
      className={[
        variantClass[variant],
        sizeClass[size],
        fullWidth ? 've-btn-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {leftIcon ? <span className="ve-btn-icon">{leftIcon}</span> : null}
      <span>{children}</span>
      {rightIcon ? <span className="ve-btn-icon">{rightIcon}</span> : null}
    </button>
  );
}
