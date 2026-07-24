import { useEffect, useRef } from 'react';

type OverflowSnapshot = {
  body: string;
  documentElement: string;
};

const owners = new Set<symbol>();
let snapshot: OverflowSnapshot | null = null;

function restoreScrollStyles() {
  if (typeof document === 'undefined' || !snapshot) return;

  document.body.style.overflow = snapshot.body;
  document.documentElement.style.overflow = snapshot.documentElement;
  snapshot = null;
}

/**
 * Prevent document scrolling while at least one modal or drawer is open.
 * The first owner preserves existing inline styles; later owners only extend
 * the lock, so closing one overlay cannot unlock another one.
 */
export function acquireBodyScrollLock(owner: symbol): () => void {
  if (typeof document === 'undefined' || owners.has(owner)) return () => {};

  if (owners.size === 0) {
    snapshot = {
      body: document.body.style.overflow,
      documentElement: document.documentElement.style.overflow,
    };
  }

  owners.add(owner);
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';

  return () => {
    if (!owners.delete(owner) || owners.size > 0) return;
    restoreScrollStyles();
  };
}

export function useBodyScrollLock(isLocked: boolean) {
  const ownerRef = useRef<symbol | null>(null);

  if (!ownerRef.current) ownerRef.current = Symbol('body-scroll-lock');

  useEffect(() => {
    if (!isLocked || !ownerRef.current) return;
    return acquireBodyScrollLock(ownerRef.current);
  }, [isLocked]);
}

/** Test-only cleanup for isolated DOM test environments. */
export function resetBodyScrollLockForTests() {
  owners.clear();
  restoreScrollStyles();
}
