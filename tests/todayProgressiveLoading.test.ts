import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const shell = readFileSync(
  new URL('../src/features/today-next/components/TodayNextShell.tsx', import.meta.url),
  'utf8',
);
const homeModel = readFileSync(
  new URL('../src/features/today-next/hooks/useTodayNextHome.ts', import.meta.url),
  'utf8',
);
const router = readFileSync(
  new URL('../src/components/routing/MainViewRouter.tsx', import.meta.url),
  'utf8',
);

describe('Today progressive loading architecture', () => {
  it('mounts the command desk without a page-blocking data skeleton', () => {
    expect(shell).not.toContain('if (isLoading) return <TodayNextSkeleton />');
    expect(shell).toContain('SHELL READY · SYNCING');
    expect(shell).toContain('Background source sync');
  });

  it('treats the report and HR board as independent sources', () => {
    expect(homeModel).toContain('const reportLoading = reportQuery.isLoading && !report');
    expect(homeModel).toContain('const hrBoardLoading = hrBoardQuery.loading && !hrBoard');
    expect(homeModel).toContain('const isLoading = reportLoading && hrBoardLoading');
    expect(homeModel).toContain('useSourceDeadline(hrBoardLoading, 8_000)');
    expect(homeModel).toContain('Promise.allSettled');
  });

  it('routes Today to the replacement page and removes the old page module', () => {
    expect(router).toContain("import('../../features/today-next/pages/TodayCommandPage')");
    expect(router).not.toContain("import('../../features/today-next/pages/TodayNextPage')");
  });
});
