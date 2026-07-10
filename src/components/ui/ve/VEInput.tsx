import type { InputHTMLAttributes } from 'react';

type VEInputProps = InputHTMLAttributes<HTMLInputElement> & {
  fullWidth?: boolean;
};

export function VEInput({
  fullWidth = true,
  className = '',
  ...props
}: VEInputProps) {
  return (
    <input
      className={[
        've-input',
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}
