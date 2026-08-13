// @vitest-environment happy-dom
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/features/hr/hooks/useHrBoardViewModel', () => ({
  useHrBoardViewModel: vi.fn(),
}));

vi.mock('../src/features/hr/hooks/useProMode', () => ({
  useProMode: () => [false, vi.fn()],
}));

vi.mock('../src/hooks/queries/usePlayerVouchLayer', () => ({
  usePlayerVouchSummary: () => ({ data: [] }),
  usePlayerVouchLeaderboard: () => ({ data: [] }),
  useTogglePlayerVouch: () => ({ mutate: vi.fn(), variables: null }),
}));

vi.mock('../src/features/hr/hooks/useHrResearch', () => ({
  useHrResearch: () => ({ research: null, loading: false, error: null }),
}));

import HrIntelligenceV2Page from '../src/features/hr-intelligence-v2/HrIntelligenceV2Page';
import { useHrBoardViewModel } from '../src/features/hr/hooks/useHrBoardViewModel';

const mockedVm = vi.mocked(useHrBoardViewModel);

function readV2Sources(): string {
  const dir = 'src/features/hr-intelligence-v2';
  return readdirSync(dir)
    .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))
    .map((file) => readFileSync(join(dir, file), 'utf8'))
    .join('\n');
}

describe('HR Intelligence V2 loading', () => {
  it('does not split HR into lazy route chunks', () => {
    const router = readFileSync('src/components/routing/MainViewRouter.tsx', 'utf8');
    const preload = readFileSync('src/lib/routePreload.ts', 'utf8');
    const v2 = readV2Sources();

    expect(router).toContain("import HrIntelligenceV2Page from '../../features/hr-intelligence-v2/HrIntelligenceV2Page'");
    expect(router).not.toContain('lazyWithRetry(routeModules.hrBoard)');
    expect(router).toContain('return <HrIntelligenceV2Page onSectionChange={navigateSection} />');
    expect(preload).toContain("hr_board: () => Promise.resolve()");
    expect(v2).not.toContain('lazyWithRetry');
    expect(v2).not.toMatch(/\blazy\(/);
    expect(v2).not.toMatch(/import\(/);
  });

  it('renders the Field Desk without Pro chunk placeholders', () => {
    mockedVm.mockReturnValue({
      buckets: { Elite: [], Strong: [], Watch: [], Sleepers: [] },
      rows: [],
      researchRows: [],
      slate: {
        gameCount: 1,
        generatedAt: null,
        loadedAt: null,
        freshness: 'fresh',
        dataQuality: null,
        warnings: [],
        truthMessage: null,
        note: null,
        disclaimer: null,
        hasGames: true,
      },
      stats: { total: 0, elite: 0, strong: 0, watch: 0, sleepers: 0 },
      selectedPlayer: null,
      loading: true,
      syncing: false,
      error: null,
      refreshError: null,
      connection: { isLastGood: false },
      lastUpdated: null,
      mode: 'confirmed',
      viewMode: 'cards',
      search: '',
      selectedTiers: ['Elite', 'Strong', 'Watch', 'Sleepers'],
      modeCounts: { confirmed: 0, curated: 0, all: 0 },
      autoSwitchedToPreview: false,
      setMode: vi.fn(),
      setViewMode: vi.fn(),
      setSearch: vi.fn(),
      setSelectedPlayer: vi.fn(),
      onToggleTier: vi.fn(),
      refresh: vi.fn(),
      date: '2026-08-08',
      setDate: vi.fn(),
      isToday: true,
      getHrResult: vi.fn(),
      hrResultsLoading: false,
    } as never);

    render(<HrIntelligenceV2Page />);

    expect(screen.getByRole('heading', { name: /HR Intelligence/i })).toBeTruthy();
    expect(screen.getByTestId('hr-intelligence-v2')).toBeTruthy();
    expect(screen.queryByRole('status', { name: /Loading (Pro|top|most|signal)/i })).toBeNull();
  });
});
