import React from 'react';

type FadeInMountProps = {
  children: React.ReactNode;
  className?: string;
};

/** Route mount wrapper — no opacity animation (prevents black-screen stuck states).
 *  Shell/landing rule: never use initial={{ opacity: 0 }} on above-fold mounts;
 *  use initial={false} or transform-only initial (y/x/scale) instead. */
export function FadeInMount({ children, className }: FadeInMountProps) {
  if (!className) return <>{children}</>;
  return <div className={className}>{children}</div>;
}

export default FadeInMount;
