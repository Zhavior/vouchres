import { useState, useEffect, useRef, MutableRefObject } from 'react';

/**
 * Progressive render hook – renders a slice of the `items` array and expands it
 * when a sentinel element near the bottom of the list enters the viewport.
 * This avoids loading very long tiers (e.g., SLEEPERS) into the DOM all at once.
 */
export function useProgressiveRender<T>(
  items: readonly T[],
  initial = 24,
  increment = 24,
): [T[], MutableRefObject<HTMLDivElement | null>] {
  const [count, setCount] = useState(initial);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setCount((prev) => Math.min(prev + increment, items.length));
          }
        });
      },
      {
        root: null,
        rootMargin: '400px', // pre‑load well ahead of viewport for fast trackpad scrollers
        threshold: 0,
      },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [items.length, increment]);

  const visibleItems = items.slice(0, count);
  return [visibleItems as T[], sentinelRef];
}
