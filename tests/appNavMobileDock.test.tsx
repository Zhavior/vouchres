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
  it('uses labeled tabs, equal-width layout, safe-area spacing, and Judges as a primary destination', () => {
    const onNavigate = vi.fn();
    const { container } = render(<AppNav activeSection="today" onNavigate={onNavigate} />);
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
    expect(container.querySelector('[aria-label="Go to Judges"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Go to Vouch Board"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Go to Today"]')).not.toBeNull();
    expect(container.textContent).toContain('Judges');
    expect(container.textContent).toContain('Home');
    expect(container.textContent).toContain('Menu');
    expect(container.querySelectorAll('.ve-edge-island-trigger')).toHaveLength(0);

    fireEvent.click(container.querySelector('[aria-label="Go to Home Feed"]') as HTMLElement);
    fireEvent.click(container.querySelector('[aria-label="Go to Judges"]') as HTMLElement);
    fireEvent.click(container.querySelector('[aria-label="Go to Vouch Board"]') as HTMLElement);
    fireEvent.click(container.querySelector('[aria-label="Go to Today"]') as HTMLElement);
    expect(onNavigate).toHaveBeenNthCalledWith(1, 'feed');
    expect(onNavigate).toHaveBeenNthCalledWith(2, 'judge_home');
    expect(onNavigate).toHaveBeenNthCalledWith(3, 'board');
    expect(onNavigate).toHaveBeenNthCalledWith(4, 'today');

    const feedCss = readFileSync(resolve(process.cwd(), 'src/styles/legacy/feed.css'), 'utf8');
    expect(feedCss).toContain('padding-bottom: calc(5.5rem + env(safe-area-inset-bottom, 0px)) !important;');
  });
});
