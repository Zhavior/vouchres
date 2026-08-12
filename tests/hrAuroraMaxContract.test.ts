import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Home Run Intelligence Aurora Max contract', () => {
  it('keeps the header while removing nested chunks and legacy Aurora tokens', () => {
    const page = readFileSync('src/features/hr/pages/HomeRunIntelligencePageZ8.tsx', 'utf8');
    const header = readFileSync('src/features/hr/components/Header/HrHeader.tsx', 'utf8');

    expect(page).toContain('<HrHeader');
    expect(page).toContain('hr-aurora-max');
    expect(page).not.toContain('lazy(');
    expect(page).not.toContain('<Suspense');
    expect(page).not.toContain('auroraTokens');
    expect(header).toContain('Every bat that can leave the yard');
    expect(header).not.toContain('auroraTokens');
  });

  it('enforces sharp mobile workspaces and shared Pro Lab atmosphere', () => {
    const styles = readFileSync('src/features/hr/hr-aurora-max.css', 'utf8');
    const matchupShell = readFileSync('src/features/matchup/MatchupPageShell.tsx', 'utf8');
    const playerLab = readFileSync('src/pages/pro/PlayerEdgeLabPageZ8.tsx', 'utf8');
    const graphs = readFileSync('src/pages/pro/ProGraphsLabPageZ8.tsx', 'utf8');

    expect(styles).toContain('border-radius: 0 !important');
    expect(styles).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(matchupShell).toContain('hr-pro-aurora-max');
    expect(playerLab).toContain('hr-pro-aurora-max');
    expect(graphs).toContain('hr-pro-aurora-max');
  });

  it('migrates every internal research workspace at the component boundary', () => {
    const files = [
      'OverviewView.tsx',
      'EdgeDeskView.tsx',
      'SlateStacksView.tsx',
      'ProjectionMatrixView.tsx',
      'MatchupExtremesView.tsx',
    ].map((file) => readFileSync(`src/features/hr/components/workspace/views/${file}`, 'utf8'));

    expect(files[0]).toContain('AuroraMaxRankedWorkspace');
    for (const source of files.slice(1)) {
      expect(source).toContain('AuroraMaxFallback');
      expect(source).toContain('aurora-max-ranked-workspace');
      expect(source).toContain('data-workspace=');
    }
  });
});
