// @vitest-environment happy-dom

import { fireEvent, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

const openMobileDrawer = vi.hoisted(() => vi.fn());

vi.mock('../src/stores/navUiStore', () => ({
  useNavUiStore: (selector: (state: { openMobileDrawer: () => void }) => unknown) => selector({ openMobileDrawer }),
}));

vi.mock('../src/lib/routePreload', () => ({ preloadSection: vi.fn() }));

import { AppNav } from '../src/app/AppNav';

describe('AppNav Instagram-style mobile dock', () => {
  it('uses compact icons, equal-width tabs, safe-area spacing, and a visible active state', () => {
    const onNavigate = vi.fn();
    const { container } = render(<AppNav activeSection="today" onNavigate={onNavigate} />);
    const dock = container.querySelector<HTMLElement>('nav[aria-label="Mobile app navigation"]');
    const buttons = [...container.querySelectorAll<HTMLButtonElement>('button')];

    // The dock is a centered floating pill now, not a full-width bottom bar.
    // Safe-area spacing moved from the ve-safe-bottom utility into the inline
    // bottom calc — still asserted, so the notch clearance can't be dropped.
    expect(dock?.className).toContain('fixed');
    expect(dock?.className).toContain('-translate-x-1/2');
    expect(dock?.className).toContain('env(safe-area-inset-bottom)');
    expect(dock?.className).toContain('md:hidden');
    expect(container.querySelector('.grid-cols-4')).not.toBeNull();
    expect(buttons).toHaveLength(4);
    expect(buttons.every((button) => button.className.includes('ve-touch-target'))).toBe(true);
    expect(buttons[0]?.getAttribute('aria-current')).toBe('page');
    expect(container.querySelector('[aria-label="Go to Today"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Go to Research"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Go to Track Record"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Open navigation menu and account"]')).not.toBeNull();
    expect(container.querySelectorAll('.ve-edge-island-trigger')).toHaveLength(0);

    fireEvent.click(container.querySelector('[aria-label="Go to Today"]') as HTMLElement);
    fireEvent.click(container.querySelector('[aria-label="Go to Research"]') as HTMLElement);
    fireEvent.click(container.querySelector('[aria-label="Go to Track Record"]') as HTMLElement);
    expect(onNavigate).toHaveBeenNthCalledWith(1, 'today');
    expect(onNavigate).toHaveBeenNthCalledWith(2, 'hr_board');
    expect(onNavigate).toHaveBeenNthCalledWith(3, 'results');

    const feedCss = readFileSync(resolve(process.cwd(), 'src/styles/legacy/feed.css'), 'utf8');
    expect(feedCss).toContain('padding-bottom: calc(5rem + env(safe-area-inset-bottom, 0px)) !important;');
  });
});
