import type { ReactNode } from 'react';

type VEStateProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function VEState({ title, description, children }: VEStateProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-white">
      <div className="text-xl font-black uppercase tracking-tight">{title}</div>
      {description && (
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/50">
          {description}
        </p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
