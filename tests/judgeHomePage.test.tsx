// @vitest-environment happy-dom

import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/hooks/queries/useAiJudgeLeaderboard', () => ({
  useAiJudgeLeaderboard: () => ({
    data: {
      status: 'ready',
      date: '2026-07-18',
      candidateCount: 2,
      leaderboard: [
        {
          id: 'data_scout',
          displayName: 'Data Scout',
          tagline: 'Clean math.',
          specialty: 'Math-first',
          winRate: 0.62,
          trustScore: 71,
          record: { won: 8, lost: 5, pushed: 0 },
          topPicks: [{ playerName: 'Example Hitter', reason: 'Clean barrel + park.' }],
        },
      ],
    },
    isLoading: false,
    isError: false,
    dataUpdatedAt: Date.now(),
    refetch: vi.fn(),
    isFetching: false,
  }),
}));

import JudgeHomePage from '../src/pages/JudgeHomePage';

function renderPage(navigateSection = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <JudgeHomePage navigateSection={navigateSection} />
    </QueryClientProvider>,
  );
}

describe('JudgeHomePage', () => {
  it('renders four judges, live stats, and navigation actions', () => {
    const navigateSection = vi.fn();
    renderPage(navigateSection);

    expect(screen.getByRole('heading', { name: 'Judge Home' })).toBeTruthy();
    expect(screen.getAllByText('Data Scout').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('tablist', { name: /select judge/i }).textContent).toMatch(/DS/);
    expect(screen.getByRole('tablist', { name: /select judge/i }).textContent).toMatch(/PH/);
    expect(screen.getByRole('tablist', { name: /select judge/i }).textContent).toMatch(/MR/);
    expect(screen.getByRole('tablist', { name: /select judge/i }).textContent).toMatch(/RA/);
    expect(screen.getAllByText('62%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Example Hitter')).toBeTruthy();
    expect(screen.getByText(/not a sportsbook/i)).toBeTruthy();
    expect(screen.getByText(/board leader|trust leader/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /hr board/i }));
    expect(navigateSection).toHaveBeenCalledWith('hr_board');
  });
});
