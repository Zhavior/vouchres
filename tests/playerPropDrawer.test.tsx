// @vitest-environment happy-dom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlayerPropDrawer } from '../src/components/parlay/os/PlayerPropDrawer';

const mockPlayer = {
  id: 656941,
  name: 'Kyle Schwarber',
  team: 'PHI',
  headshotUrl: 'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_48,q_auto:best/v1/people/656941/headshot/67/current',
  position: 'DH',
  handedness: 'LHB vs RHP',
  pitcherMatchup: 'Connor Prielipp (MIN)',
  venue: 'Truist Park',
  hrpiScore: 98,
  evScore: '+18.4%',
  exitVelocity: '116 mph',
  launchAngle: '28°',
  windVector: 'Wind 8mph Out',
};

describe('PlayerPropDrawer 10/10 Tactical Prop Intelligence Tray', () => {
  it('renders player identity, HRPI score, and telemetry strip', () => {
    const onOpenChange = vi.fn();
    const onAddToSlip = vi.fn();

    render(
      <PlayerPropDrawer
        isOpen={true}
        onOpenChange={onOpenChange}
        player={mockPlayer}
        onAddToSlip={onAddToSlip}
      />
    );

    expect(screen.getByText('Kyle Schwarber')).toBeTruthy();
    expect(screen.getByText('98')).toBeTruthy();
    expect(screen.getByText(/HRPI CORE/i)).toBeTruthy();
    expect(screen.getByText('116 mph')).toBeTruthy();
    expect(screen.getByText('+18.4%')).toBeTruthy();
    expect(screen.getByText('Wind 8mph Out')).toBeTruthy();
  });

  it('renders category tabs and switches markets when clicked', () => {
    const onOpenChange = vi.fn();
    const onAddToSlip = vi.fn();

    render(
      <PlayerPropDrawer
        isOpen={true}
        onOpenChange={onOpenChange}
        player={mockPlayer}
        onAddToSlip={onAddToSlip}
      />
    );

    // Initial HR category
    expect(screen.getByText('Anytime Home Run')).toBeTruthy();
    expect(screen.getByText('2+ Home Runs')).toBeTruthy();

    // Click Runs tab
    const runsTab = screen.getByText('Runs');
    fireEvent.click(runsTab);

    expect(screen.getByText('Over 0.5 Runs Scored')).toBeTruthy();
  });

  it('triggers onAddToSlip when clicking a prop card add button or primary CTA', () => {
    const onOpenChange = vi.fn();
    const onAddToSlip = vi.fn();

    render(
      <PlayerPropDrawer
        isOpen={true}
        onOpenChange={onOpenChange}
        player={mockPlayer}
        onAddToSlip={onAddToSlip}
      />
    );

    const primaryBtn = screen.getByRole('button', { name: /Add Top Edge/i });
    fireEvent.click(primaryBtn);

    expect(onAddToSlip).toHaveBeenCalledTimes(1);
    expect(onAddToSlip).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'hr-anytime',
        label: 'Anytime Home Run',
        consensusOdds: '+240',
      })
    );
  });

  it('triggers onAddToSlip when clicking an alternate line button', () => {
    const onOpenChange = vi.fn();
    const onAddToSlip = vi.fn();

    render(
      <PlayerPropDrawer
        isOpen={true}
        onOpenChange={onOpenChange}
        player={mockPlayer}
        onAddToSlip={onAddToSlip}
      />
    );

    const altLineBtn = screen.getByRole('button', { name: /O 1\.5 HR/i });
    fireEvent.click(altLineBtn);

    expect(onAddToSlip).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'alt-HR-1.5',
        consensusOdds: '+950',
      })
    );
  });

  it('triggers onOpenChange(false) when clicking close button', () => {
    const onOpenChange = vi.fn();
    const onAddToSlip = vi.fn();

    render(
      <PlayerPropDrawer
        isOpen={true}
        onOpenChange={onOpenChange}
        player={mockPlayer}
        onAddToSlip={onAddToSlip}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeBtn);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
