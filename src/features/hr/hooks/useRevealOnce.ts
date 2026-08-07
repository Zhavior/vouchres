/**
 * First-paint reveal, once per session.
 *
 * `.deck-reveal` is a CSS animation, so it replays every single time React
 * re-creates the node it sits on — flipping Pro Mode, switching workspaces, or
 * navigating away and back all made a whole block of the page fade up from
 * below again. That reads as the page re-loading in chunks when nothing was
 * actually re-fetched.
 *
 * Region ids are tracked at module scope, so the animation plays on the genuine
 * first paint and every later mount renders instantly, already in place.
 */

import { useState } from 'react';

const revealed = new Set<string>();

/** Returns `deck-reveal` the first time `id` is mounted this session, else ''. */
export function useRevealOnce(id: string): string {
  const [className] = useState(() => {
    if (revealed.has(id)) return '';
    revealed.add(id);
    return 'deck-reveal';
  });

  return className;
}

/** Test seam — lets a suite replay the first-paint animation. */
export function resetRevealOnce(): void {
  revealed.clear();
}
