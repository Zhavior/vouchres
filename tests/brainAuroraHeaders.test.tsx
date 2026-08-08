// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LiveGamesHeader } from '../src/components/live/LiveGamesHeader';
import { HrHeader } from '../src/features/hr/components/Header/HrHeader';

describe('Brain-style Aurora headers', () => {
  it('renders HR slate truth and keeps Pro Mode interactive', () => {
    const onToggleProMode = vi.fn();

    const { container } = render(
      <HrHeader
        mode="confirmed"
        date="2026-08-08"
        isToday
        onDateChange={vi.fn()}
        gameCount={12}
        hasGames
        freshness="fresh"
        lastUpdatedLabel="2m ago"
        confirmedCount={31}
        previewCount={14}
        isProMode={false}
        onToggleProMode={onToggleProMode}
      />,
    );

    expect(container.querySelector('.deck-hero')).toBeTruthy();
    expect(screen.getByText(/Every bat that can leave the yard/i)).toBeTruthy();
    expect(screen.getByText('12 games')).toBeTruthy();
    expect(screen.getByText('31 official')).toBeTruthy();
    expect(screen.getByText('14 projected')).toBeTruthy();

    fireEvent.click(screen.getByRole('switch', { name: /Pro mode: Off/i }));
    expect(onToggleProMode).toHaveBeenCalledOnce();
  });

  it('renders live feed truth and keeps game filters interactive', () => {
    const onFilterChange = vi.fn();

    const { container } = render(
      <LiveGamesHeader
        onRefresh={vi.fn()}
        isSyncing={false}
        feedState="reconnecting"
        feedNote="Backend reconnecting..."
        lastSyncLabel="10:42 AM"
        totalCount={9}
        liveCount={3}
        upcomingCount={4}
        finalCount={2}
        filterTab="all"
        onFilterChange={onFilterChange}
      />,
    );

    expect(container.querySelector('.deck-hero')).toBeTruthy();
    expect(screen.getByText(/The whole slate/i)).toBeTruthy();
    expect(screen.getAllByText('Reconnecting').length).toBeGreaterThan(0);
    expect(screen.getByText('3 in play')).toBeTruthy();
    expect(screen.getByText('4 scheduled')).toBeTruthy();
    expect(screen.getByText('2 complete')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Live now 3/i }));
    expect(onFilterChange).toHaveBeenCalledWith('live');
  });
});
