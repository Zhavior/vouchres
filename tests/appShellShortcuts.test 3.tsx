// @vitest-environment happy-dom

import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { useAppShellShortcuts } from '../src/app/useAppShellShortcuts';
import { isNavItemActive } from '../src/app/appNavModel';
import type { FeatureConfig } from '../src/lib/featureConfig';

/**
 * Ported from sidebarKeybindsAndActiveState.test.tsx, which rendered the
 * deleted FeedSidebar. The rail owned these bindings only because it was the
 * component that happened to always be mounted; the behaviour now lives in
 * useAppShellShortcuts, so the tests bind to the hook rather than to whichever
 * component currently renders navigation.
 */

const FEATURES = [
  { id: 'today', label: 'Today' },
  { id: 'hr_board', label: 'HR Board' },
  { id: 'live_games', label: 'Live Games' },
  { id: 'results', label: 'Results' },
] as unknown as FeatureConfig[];

function Harness({
  onNavigate,
  activeSection = 'today',
  onOpenCmdK,
}: {
  onNavigate: (id: string) => void;
  activeSection?: string;
  onOpenCmdK?: () => void;
}) {
  useAppShellShortcuts({ activeSection, features: FEATURES, onNavigate, onOpenCmdK });
  return <input data-testid="text-field" />;
}

describe('app shell keyboard shortcuts', () => {
  it('maps number keys 1-9 to the corresponding route tab', () => {
    const onNavigate = vi.fn();
    render(<Harness onNavigate={onNavigate} />);

    fireEvent.keyDown(window, { key: '1' });
    expect(onNavigate).toHaveBeenLastCalledWith('today');

    fireEvent.keyDown(window, { key: '2' });
    expect(onNavigate).toHaveBeenLastCalledWith('hr_board');

    fireEvent.keyDown(window, { key: '3' });
    expect(onNavigate).toHaveBeenLastCalledWith('live_games');

    fireEvent.keyDown(window, { key: '4' });
    expect(onNavigate).toHaveBeenLastCalledWith('results');
  });

  it('ignores a number beyond the available route tabs', () => {
    const onNavigate = vi.fn();
    render(<Harness onNavigate={onNavigate} />);

    fireEvent.keyDown(window, { key: '9' });
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('routes s to settings and p to profile', () => {
    const onNavigate = vi.fn();
    render(<Harness onNavigate={onNavigate} />);

    fireEvent.keyDown(window, { key: 's' });
    expect(onNavigate).toHaveBeenLastCalledWith('settings');

    fireEvent.keyDown(window, { key: 'p' });
    expect(onNavigate).toHaveBeenLastCalledWith('profile');
  });

  it('cycles forward and backward through route tabs with ] and [', () => {
    const onNavigate = vi.fn();
    render(<Harness onNavigate={onNavigate} activeSection="today" />);

    // Forward from the first tab.
    fireEvent.keyDown(window, { key: ']' });
    expect(onNavigate).toHaveBeenLastCalledWith('hr_board');

    // Backward from the first tab wraps to the last.
    fireEvent.keyDown(window, { key: '[' });
    expect(onNavigate).toHaveBeenLastCalledWith('results');
  });

  it('does not fire shortcuts while typing in a text field', () => {
    const onNavigate = vi.fn();
    const { getByTestId } = render(<Harness onNavigate={onNavigate} />);
    const input = getByTestId('text-field');

    fireEvent.keyDown(input, { key: '1' });
    fireEvent.keyDown(input, { key: '2' });
    fireEvent.keyDown(input, { key: 's' });
    fireEvent.keyDown(input, { key: 'p' });
    fireEvent.keyDown(input, { key: ']' });

    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('leaves browser shortcuts alone', () => {
    const onNavigate = vi.fn();
    render(<Harness onNavigate={onNavigate} />);

    fireEvent.keyDown(window, { key: 'r', metaKey: true });
    fireEvent.keyDown(window, { key: 't', metaKey: true });
    expect(onNavigate).not.toHaveBeenCalled();
  });
});

describe('shortcut discoverability', () => {
  // Same file-contract idiom the Aurora Max and focused-beta guards use.
  // useAppShellShortcuts binds 1-9, so the tabs must announce those bindings;
  // exposing them only through `title` makes them visual-only. The old
  // FeedSidebar set aria-keyshortcuts and that was lost in the top-bar move.
  it('route tabs announce their number binding to assistive tech', () => {
    const source = readFileSync(join(__dirname, '..', 'src', 'app', 'AppTopBar.tsx'), 'utf8');
    expect(source).toContain('aria-keyshortcuts={shortcut}');
  });
});

describe('active section highlighting', () => {
  it('marks only the matching nav item active', () => {
    expect(isNavItemActive('today', 'today')).toBe(true);
    expect(isNavItemActive('today', 'hr_board')).toBe(false);
    expect(isNavItemActive('today', 'results')).toBe(false);
  });

  it('marks nothing active on a section that is not a nav item', () => {
    const active = FEATURES.filter((f) => isNavItemActive('parlay_proof', f.id));
    expect(active).toEqual([]);
  });
});
