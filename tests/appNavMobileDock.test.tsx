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
    const { container } = render(<AppNav activeSection="brain_picks" onNavigate={onNavigate} />);
    const dock = container.querySelector<HTMLElement>('nav[aria-label="Mobile app navigation"]');
    const buttons = [...container.querySelectorAll<HTMLButtonElement>('button')];

    expect(dock?.className).toContain('fixed inset-x-0 bottom-0');
    expect(dock?.className).toContain('ve-safe-bottom');
    expect(dock?.className).toContain('md:hidden');
    expect(container.querySelector('.grid-cols-5')).not.toBeNull();
    expect(buttons).toHaveLength(5);
    expect(buttons.every((button) => button.className.includes('ve-touch-target'))).toBe(true);
    expect(buttons[3]?.getAttribute('aria-current')).toBe('page');
    expect(container.querySelector('[aria-label="Go to Home Feed"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Go to Vouch Board"]')).not.toBeNull();
    expect(container.querySelectorAll('.ve-edge-island-trigger')).toHaveLength(0);

    fireEvent.click(container.querySelector('[aria-label="Go to Home Feed"]') as HTMLElement);
    fireEvent.click(container.querySelector('[aria-label="Go to Vouch Board"]') as HTMLElement);
    expect(onNavigate).toHaveBeenNthCalledWith(1, 'feed');
    expect(onNavigate).toHaveBeenNthCalledWith(2, 'board');

    const feedCss = readFileSync(resolve(process.cwd(), 'src/styles/legacy/feed.css'), 'utf8');
    expect(feedCss).toContain('padding-bottom: calc(5rem + env(safe-area-inset-bottom, 0px)) !important;');
  });
});
