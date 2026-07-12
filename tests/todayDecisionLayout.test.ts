import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  new URL('../src/components/TodayDashboard.tsx', import.meta.url),
  'utf8',
);

describe('Today decision-first layout', () => {
  it('leads with attention and data status instead of a feature directory', () => {
    expect(source).toContain('What needs your attention today');
    expect(source).toContain('verify its data status');
    expect(source).toContain('Browse all specialist tools');
  });

  it('limits primary actions to research, live context, and tracking', () => {
    expect(source).toContain('label="Review HR Board" section="hr_board"');
    expect(source).toContain('label="Open Live Games" section="live_games"');
    expect(source).toContain('label="Open ParlayOS" section="live_parlays"');
    expect(source).not.toContain('label="Open ParlayOS" section="build"');
  });

  it('uses the shared touch-safe control contract', () => {
    expect(source).toContain('z8-control inline-flex items-center');
  });
});
