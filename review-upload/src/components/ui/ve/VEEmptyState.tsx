import type { ReactNode } from 'react';

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

type VEEmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function VEEmptyState({ title, description, action, className }: VEEmptyStateProps) {
  return (
    <div className={cx('flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-6 text-center', className)}>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm text-zinc-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
