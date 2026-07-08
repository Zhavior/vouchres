import type { ReactNode } from 'react';

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

type VEWidgetProps = {
  children: ReactNode;
  className?: string;
};

export function VEWidget({ children, className }: VEWidgetProps) {
  return (
    <section className={cx('rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl', className)}>
      {children}
    </section>
  );
}
