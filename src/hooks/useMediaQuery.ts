/**
 * Subscribe to a CSS media query from React.
 *
 * Use this instead of rendering both layouts and hiding one with `lg:hidden`.
 * A hidden branch is still constructed, mounted and its images requested — on a
 * board of heavy player cards that doubles the work for a layout nobody sees.
 */

import { useCallback, useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      // Belt and braces: some embedded/emulated viewports resize without ever
      // firing the MediaQueryList change event. `resize` re-reads the snapshot,
      // and an unchanged boolean costs nothing — React bails out of the render.
      window.addEventListener('resize', onChange);
      return () => {
        list.removeEventListener('change', onChange);
        window.removeEventListener('resize', onChange);
      };
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  }, [query]);

  // The server has no viewport; it renders the mobile branch and the client
  // corrects on hydration.
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
