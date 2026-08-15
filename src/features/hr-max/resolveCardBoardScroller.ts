/**
 * Page-scroll attachment for HR Max Cards.
 * Do not use useWindowVirtualizer: desktop shell (≥1181px) hides window
 * overflow and scrolls #inner-view-slot (feed.css). Below that, body scrolls.
 */

export const CARD_BOARD_INNER_OVERSCAN = 4;
export const CARD_BOARD_PAGE_OVERSCAN = 16;

export function isConstrainedOverflowStyle(style: {
  overflowY: string;
  maxHeight: string;
}): boolean {
  const overflowY = style.overflowY;
  if (overflowY !== 'auto' && overflowY !== 'scroll') return false;
  return style.maxHeight !== '' && style.maxHeight !== 'none';
}

export function isConstrainedOverflowScroller(el: HTMLElement | null): boolean {
  if (!el) return false;
  const style = getComputedStyle(el);
  return isConstrainedOverflowStyle({
    overflowY: style.overflowY,
    maxHeight: style.maxHeight,
  });
}

export function isOverflowScrollerStyle(overflowY: string): boolean {
  return overflowY === 'auto' || overflowY === 'scroll';
}

export function pickFallbackPageScroller(input: {
  documentElement: HTMLElement | null;
  body: HTMLElement | null;
  bodyOverflowY: string;
  documentOverflowY: string;
}): HTMLElement | null {
  if (input.body && isOverflowScrollerStyle(input.bodyOverflowY)) return input.body;
  if (input.documentElement && isOverflowScrollerStyle(input.documentOverflowY)) {
    return input.documentElement;
  }
  return input.documentElement ?? input.body;
}

export function pickCardBoardScroller(input: {
  pageScroll: boolean;
  inner: HTMLElement | null;
  feedRoot: HTMLElement | null;
  feedRootConstrained: boolean;
  documentElement: HTMLElement | null;
  body: HTMLElement | null;
  bodyOverflowY: string;
  documentOverflowY: string;
}): HTMLElement | null {
  if (!input.pageScroll) return input.inner;
  if (input.feedRoot && input.feedRootConstrained) return input.feedRoot;
  return pickFallbackPageScroller({
    documentElement: input.documentElement,
    body: input.body,
    bodyOverflowY: input.bodyOverflowY,
    documentOverflowY: input.documentOverflowY,
  });
}

export function measureScrollMargin(
  list: { getBoundingClientRect: () => { top: number } },
  scroller: { getBoundingClientRect: () => { top: number }; scrollTop: number },
): number {
  return (
    list.getBoundingClientRect().top +
    scroller.scrollTop -
    scroller.getBoundingClientRect().top
  );
}

export function resolveLiveCardBoardScroller(input: {
  pageScroll: boolean;
  inner: HTMLElement | null;
  feedRoot: HTMLElement | null;
}): HTMLElement | null {
  if (typeof document === 'undefined') return input.pageScroll ? null : input.inner;
  const documentElement = document.documentElement;
  const body = document.body;
  return pickCardBoardScroller({
    pageScroll: input.pageScroll,
    inner: input.inner,
    feedRoot: input.feedRoot,
    feedRootConstrained: isConstrainedOverflowScroller(input.feedRoot),
    documentElement,
    body,
    bodyOverflowY: body ? getComputedStyle(body).overflowY : 'visible',
    documentOverflowY: documentElement
      ? getComputedStyle(documentElement).overflowY
      : 'visible',
  });
}
