import type { ReactNode } from 'react';

type VEStateProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  /** Legacy tone token — prefer className on children. */
  tone?: string;
  icon?: ReactNode;
};

export function VEState({ title, description, children, icon }: VEStateProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-white">
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
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
