// @vitest-environment happy-dom
import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HrToolbar, type HrSourceMode, type HrViewMode } from '../src/features/hr/components/Toolbar/HrToolbar';
import type { HrRiskTier } from '../src/features/hr/components/Cards/HrPlayerCard';

function ToolbarHarness() {
  const [sourceMode, setSourceMode] = useState<HrSourceMode>('confirmed');
  const [viewMode, setViewMode] = useState<HrViewMode>('cards');
  const [activeTiers, setActiveTiers] = useState<HrRiskTier[]>([
    'elite',
    'strong',
    'watch',
    'sleeper',
  ]);

  const toggleTier = (tier: HrRiskTier) => {
    setActiveTiers((current) =>
      current.includes(tier)
        ? current.filter((item) => item !== tier)
        : [...current, tier],
    );
  };

  return (
    <div data-testid="stacking-context">
      <HrToolbar
        searchValue=""
        onSearchChange={() => undefined}
        sourceMode={sourceMode}
        onSourceModeChange={setSourceMode}
        activeTiers={activeTiers}
        onToggleTier={toggleTier}
        visibleCount={sourceMode === 'confirmed' ? 9 : 350}
        rows={[]}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        confirmedCount={9}
        previewCount={350}
      />
    </div>
  );
}

describe('Home Run Intelligence toolbar interactions', () => {
  it('portals the mobile filter sheet above panel stacking contexts and keeps its controls interactive', () => {
    render(<ToolbarHarness />);

    const tableButton = screen.getByTitle('Table View');
    fireEvent.click(tableButton);
    expect(tableButton.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Open filters' }));

    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    const containingPanel = screen.getByTestId('stacking-context');
    expect(dialog.parentElement).toBe(document.body);
    expect(containingPanel.contains(dialog)).toBe(false);

    const previewButton = within(dialog).getByRole('button', { name: 'Preview 350' });
    fireEvent.click(previewButton);
    expect(previewButton.getAttribute('aria-pressed')).toBe('true');

    const eliteButton = within(dialog).getByRole('button', { name: 'Elite' });
    fireEvent.click(eliteButton);
    expect(eliteButton.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(within(dialog).getByRole('button', { name: /Apply & Show 350 players/i }));
    expect(screen.queryByRole('dialog', { name: 'Filters' })).toBeNull();
  });
});
