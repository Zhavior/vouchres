import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const cardboard = readFileSync(
  new URL('../src/features/hr-max/components/HrMaxCardBoard.tsx', import.meta.url),
  'utf8',
);
const deskCss = readFileSync(
  new URL('../src/features/hr-max/hr-max-desk.css', import.meta.url),
  'utf8',
);

describe('HrMaxCardBoard page-scroll windowing', () => {
  it('attaches to the feed pane helper instead of useWindowVirtualizer', () => {
    expect(cardboard).toContain('useFeedScrollRoot');
    expect(cardboard).toContain('resolveLiveCardBoardScroller');
    expect(cardboard).toContain('measureScrollMargin');
    expect(cardboard).toContain('CARD_BOARD_PAGE_OVERSCAN');
    expect(cardboard).toContain('useVirtualizer');
    expect(cardboard).not.toContain('useWindowVirtualizer');
  });

  it('keeps inner max-height only for the mobile scroller class', () => {
    expect(cardboard).toContain('hr-max-tier-column__scroller--inner');
    expect(cardboard).toContain('hr-max-tier-column__scroller--page');
    expect(cardboard).not.toContain('max-h-[calc(100vh-16rem)]');
    expect(deskCss).toContain('overflow-anchor: auto');
    expect(deskCss).toContain('.hr-max-tier-column__scroller--inner');
    expect(deskCss).toContain('max-height: calc(100vh - 16rem)');
    expect(deskCss).toContain('.hr-max-tier-column__head');
    expect(deskCss).toContain('position: sticky');
  });
});
