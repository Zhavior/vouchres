// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EdgeIslandShell } from '../src/components/edgeIsland/EdgeIslandShell';

describe('EdgeIslandShell', () => {
  it('renders Edge Island chrome with live sync state', () => {
    render(
      <EdgeIslandShell profile={{ displayName: 'Alex Rivera' } as any} isLoggedIn updatedAt="2026-07-09T12:00:00Z">
        <div data-testid="edge-child">Board content</div>
      </EdgeIslandShell>,
    );

    expect(screen.getByText(/The Edge Island/i)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Morning board,\s*Alex/i);
    expect(screen.getByText(/^Live$/i)).toBeTruthy();
    expect(screen.getByTestId('edge-child')).toBeTruthy();
  });

  it('shows public preview mode when logged out', () => {
    render(
      <EdgeIslandShell isLoggedIn={false} updatedAt={null}>
        <span>Teaser</span>
      </EdgeIslandShell>,
    );

    expect(screen.getByText(/Morning edge board preview/i)).toBeTruthy();
    expect(screen.getByText(/^Preview$/i)).toBeTruthy();
    expect(screen.getByText(/Waiting for sync/i)).toBeTruthy();
  });
});
