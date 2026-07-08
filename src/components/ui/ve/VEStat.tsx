import type { ReactNode } from 'react';

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

type VEStatProps = {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
};

export function VEStat({ label, value, hint, className }: VEStatProps) {
  return (
    <div className={cx('rounded-xl border border-white/10 bg-black/20 p-3', className)}>
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-white">
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-zinc-500">{hint}</div> : null}
    </div>
  );
}
