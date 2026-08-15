import { describe, expect, it } from 'vitest';
import {
  CARD_BOARD_INNER_OVERSCAN,
  CARD_BOARD_PAGE_OVERSCAN,
  isConstrainedOverflowStyle,
  isOverflowScrollerStyle,
  measureScrollMargin,
  pickCardBoardScroller,
  pickFallbackPageScroller,
} from '../src/features/hr-max/resolveCardBoardScroller';

function el(id: string): HTMLElement {
  return { id } as HTMLElement;
}

describe('resolveCardBoardScroller', () => {
  it('keeps inner overscan smaller than page overscan', () => {
    expect(CARD_BOARD_INNER_OVERSCAN).toBe(4);
    expect(CARD_BOARD_PAGE_OVERSCAN).toBe(16);
    expect(CARD_BOARD_PAGE_OVERSCAN).toBeGreaterThan(CARD_BOARD_INNER_OVERSCAN);
  });

  it('treats overflow + max-height as a constrained pane', () => {
    expect(isConstrainedOverflowStyle({ overflowY: 'scroll', maxHeight: '100dvh' })).toBe(true);
    expect(isConstrainedOverflowStyle({ overflowY: 'auto', maxHeight: '800px' })).toBe(true);
    expect(isConstrainedOverflowStyle({ overflowY: 'scroll', maxHeight: 'none' })).toBe(false);
    expect(isConstrainedOverflowStyle({ overflowY: 'visible', maxHeight: '100dvh' })).toBe(false);
  });

  it('picks the inner column when page scroll is off', () => {
    const inner = el('inner');
    const feedRoot = el('slot');
    expect(
      pickCardBoardScroller({
        pageScroll: false,
        inner,
        feedRoot,
        feedRootConstrained: true,
        documentElement: el('html'),
        body: el('body'),
        bodyOverflowY: 'scroll',
        documentOverflowY: 'hidden',
      }),
    ).toBe(inner);
  });

  it('picks a constrained feed pane on desktop', () => {
    const inner = el('inner');
    const feedRoot = el('slot');
    expect(
      pickCardBoardScroller({
        pageScroll: true,
        inner,
        feedRoot,
        feedRootConstrained: true,
        documentElement: el('html'),
        body: el('body'),
        bodyOverflowY: 'hidden',
        documentOverflowY: 'hidden',
      }),
    ).toBe(feedRoot);
  });

  it('falls back to body when the feed pane is growing', () => {
    const inner = el('inner');
    const feedRoot = el('slot');
    const body = el('body');
    expect(
      pickCardBoardScroller({
        pageScroll: true,
        inner,
        feedRoot,
        feedRootConstrained: false,
        documentElement: el('html'),
        body,
        bodyOverflowY: 'scroll',
        documentOverflowY: 'visible',
      }),
    ).toBe(body);
  });

  it('falls back to documentElement when body is not a scroller', () => {
    const documentElement = el('html');
    expect(
      pickFallbackPageScroller({
        documentElement,
        body: el('body'),
        bodyOverflowY: 'visible',
        documentOverflowY: 'scroll',
      }),
    ).toBe(documentElement);
    expect(isOverflowScrollerStyle('scroll')).toBe(true);
    expect(isOverflowScrollerStyle('visible')).toBe(false);
  });

  it('measures list offset inside the scroller including current scrollTop', () => {
    const list = {
      getBoundingClientRect: () => ({ top: 120 }),
    };
    const scroller = {
      getBoundingClientRect: () => ({ top: 40 }),
      scrollTop: 200,
    };
    expect(measureScrollMargin(list, scroller)).toBe(280);
  });
});
