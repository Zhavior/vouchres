import type { ReactNode } from 'react';

type VECardProps = {
  children: ReactNode;
  className?: string;
  strong?: boolean;
};

export function VECard({ children, className = '', strong = false }: VECardProps) {
  return (
    <div className={`${strong ? 've-card-strong' : 've-card'} p-6 ${className}`}>
      {children}
    </div>
  );
}
