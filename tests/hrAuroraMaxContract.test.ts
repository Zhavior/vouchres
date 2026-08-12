import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Home Run Intelligence Aurora Max contract', () => {
  it('keeps the core board immediate while deferring Pro-only modules safely', () => {
    const page = readFileSync('src/features/hr/pages/HomeRunIntelligencePageZ8.tsx', 'utf8');
    const header = readFileSync('src/features/hr/components/Header/HrHeader.tsx', 'utf8');

    expect(page).toContain('<HrHeader');
    expect(page).toContain('hr-aurora-max');
    expect(page).toContain('lazyWithRetry');
    expect(page).toContain('<Suspense');
    expect(page).toContain('const loadHrCommandCenter');
    expect(page).toContain('const loadWorkspaceRenderer');
    expect(page).toContain('const loadHrTopSignalPanel');
    expect(page).toContain('const loadMostVouchedPanel');
    expect(page).toContain('const loadHrSpreadsheet');
    expect(page).toContain('const loadHrPlayerProfile');
    expect(page).toContain('const loadHrSignalField');
    expect(page).toContain("import { HrBoard } from '../components/Columns/HrBoard'");
    expect(page).not.toContain("import { HrCommandCenter } from '../components/CommandCenter/HrCommandCenter'");
    expect(page).not.toContain("import WorkspaceRenderer from '../components/workspace/WorkspaceRenderer'");
    expect(page).not.toContain('auroraTokens');
    expect(page).not.toContain('deck-reveal');
    expect(header).toContain('Every bat that can leave the yard');
    expect(header).not.toContain('auroraTokens');
  });

  it('keeps bulk HR images low-priority and reserves eager loading for focused research', () => {
    const files = [
      'src/features/hr/components/Columns/HrBoard.tsx',
      'src/features/hr/components/Spotlight/HrSpotlightDeck.tsx',
      'src/features/hr/components/Standard/HrSignalGrid.tsx',
      'src/features/hr/components/Table/HrSpreadsheet.tsx',
      'src/features/hr/components/workspace/views/EdgeDeskView.tsx',
      'src/features/hr/components/workspace/views/SlateStacksView.tsx',
      'src/features/hr/components/workspace/views/ProjectionMatrixView.tsx',
      'src/features/hr/components/workspace/views/MatchupExtremesView.tsx',
    ].map((file) => readFileSync(file, 'utf8'));

    for (const source of files) {
      expect(source).not.toContain('priority');
    }

    const playerHeadshot = readFileSync('src/components/parlays/PlayerHeadshot.tsx', 'utf8');
    const drawer = readFileSync('src/features/hr/components/Drawer/HrPlayerDrawer.tsx', 'utf8');

    expect(playerHeadshot).toContain('priority = false');
    expect(drawer).toContain('fetchPriority="high"');
  });

  it('enforces sharp mobile workspaces and shared Pro Lab atmosphere', () => {
    const styles = readFileSync('src/features/hr/hr-aurora-max.css', 'utf8');
    const matchupShell = readFileSync('src/features/matchup/MatchupPageShell.tsx', 'utf8');
    const playerLab = readFileSync('src/pages/pro/PlayerEdgeLabPageZ8.tsx', 'utf8');
    const graphs = readFileSync('src/pages/pro/ProGraphsLabPageZ8.tsx', 'utf8');

    expect(styles).toContain('border-radius: 0 !important');
    expect(styles).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(styles).not.toContain(":is(article, section, header, nav, aside, [role='dialog'])");
    expect(styles).toContain('.aurora-max-ranked-workspace');
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
