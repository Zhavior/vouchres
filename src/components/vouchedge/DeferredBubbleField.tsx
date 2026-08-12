import {
  lazy,
  Suspense,
  useEffect,
  useState,
  type ComponentProps,
} from 'react';
import type { BubbleField as BubbleFieldType } from './ParticleFields';

type DeferredBubbleFieldProps = ComponentProps<typeof BubbleFieldType>;

const LazyBubbleField = lazy(async () => {
  const module = await import('./ParticleFields');
  return { default: module.BubbleField };
});

/**
 * Loads and mounts BubbleField after the browser gets its first opportunity
 * to become idle.
 *
 * Unlike a static import, the ParticleFields implementation now lives behind
 * a real dynamic-import boundary and does not need to execute with the
 * initial route module.
 */
export function DeferredBubbleField(props: DeferredBubbleFieldProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(
        () => setMounted(true),
        { timeout: 1200 },
      );

      return () => window.cancelIdleCallback(id);
    }

    const id = window.setTimeout(() => setMounted(true), 250);
    return () => window.clearTimeout(id);
  }, []);

  if (!mounted) return null;

  return (
    <Suspense fallback={null}>
      <LazyBubbleField {...props} />
    </Suspense>
  );
}
