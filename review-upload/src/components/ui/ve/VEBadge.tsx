import type { ReactNode } from 'react';

type VEBadgeProps = {
  children: ReactNode;
  className?: string;
  /** Legacy tone token — prefer className for styling. */
  tone?: string;
  style?: React.CSSProperties;
};

export function VEBadge({ children, className = '' }: VEBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-cyan-300 ${className}`}>
      {children}
    </span>
  );
}
