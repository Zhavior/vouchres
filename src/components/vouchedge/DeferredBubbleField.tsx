import { useEffect, useState, type ComponentProps } from 'react';
import { BubbleField } from './ParticleFields';

type DeferredBubbleFieldProps = ComponentProps<typeof BubbleField>;

/** Mount BubbleField after first paint / idle — keeps route switches snappy. */
export function DeferredBubbleField(props: DeferredBubbleFieldProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const ric = window.requestIdleCallback;
    if (ric) {
      const id = ric(() => setMounted(true), { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  if (!mounted) return null;
  return <BubbleField {...props} />;
}
