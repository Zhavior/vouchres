import React from 'react';

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

type FadeInMountProps = {
  children: React.ReactNode;
  className?: string;
};

/** Soft fade-in for lazy-loaded route/content mounts. Respects prefers-reduced-motion via CSS. */
export function FadeInMount({ children, className }: FadeInMountProps) {
  return <div className={cx('lazy-mount-fade', className)}>{children}</div>;
}

export default FadeInMount;
