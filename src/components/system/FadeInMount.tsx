import React from 'react';

type FadeInMountProps = {
  children: React.ReactNode;
  className?: string;
};

/** Route mount wrapper — no opacity animation (prevents black-screen stuck states). */
export function FadeInMount({ children, className }: FadeInMountProps) {
  if (!className) return <>{children}</>;
  return <div className={className}>{children}</div>;
}

export default FadeInMount;
