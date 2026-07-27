import type { ReactNode } from 'react';

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

type VEGridProps = {
  children: ReactNode;
  className?: string;
};

export function VEGrid({ children, className }: VEGridProps) {
  return (
    <div className={cx('grid gap-4 md:grid-cols-2 xl:grid-cols-4', className)}>
      {children}
    </div>
  );
}
