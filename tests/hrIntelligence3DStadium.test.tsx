/**
 * @vitest-environment happy-dom
 */
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HrStadium3DView } from '../src/features/hr-v2/components/HrStadium3DView';
import { ChunkA } from '../src/features/hr-v2/api/contracts';
import * as parlayContract from '../src/lib/parlays/parlayAddContract';

const mockItems: ChunkA[] = [
  {
    playerId: 'p_judge',
    identity: {
      id: 'p_judge',
      mlbId: '592450',
      name: 'Aaron Judge',
      teamId: 'NYY',
      teamAbbreviation: 'NYY',
      handedness: 'R',
    },
    opponentTeamId: 'BOS',
    opposingPitcherId: 'p_sale',
    opposingPitcherName: 'Chris Sale',
    opposingPitcherHandedness: 'L',
    gameTime: '2026-08-15T19:05:00Z',
    gameState: {
      gameId: 'g_nyy_bos',
      lifecycle: 'live',
      gameTime: '2026-08-15T19:05:00Z',
      homeTeamId: 'NYY',
      awayTeamId: 'BOS',
      stadiumId: 's_yankee',
      inning: 3,
      inningHalf: 'top',
      scoreDifferential: 0,
      outs: 1,
      runnersOnBase: 1,
    },
    score: {
      hrIndex: 94,
      confidence: { level: 'very_high', score: 0.95, reasons: ['Elite power', 'Favorable park'] },
      primaryRecommendation: 'Laser trajectory to right-center',
      provenance: {
        generatedAt: '2026-08-15T12:00:00Z',
        versions: { scorer: '1.0', weather: '1.0', matchup: '1.0' },
        freshness: { batter: 'now', pitcher: 'now', weather: 'now', odds: 'now' },
      },
    },
    statcastSummary: {
      xSLG: 0.65,
      barrelRate: 0.22,
      parkFactor: 112,
    },
    lineupStatus: 'confirmed_starter',
    rank: 1,
    odds: {
      price: 240,
      impliedProbability: 0.294,
      provider: 'DraftKings',
      updatedAt: '2026-08-15T12:00:00Z',
    },
    updatedAt: '2026-08-15T12:00:00Z',
  },
  {
    playerId: 'p_ohtani',
    identity: {
      id: 'p_ohtani',
      mlbId: '660271',
      name: 'Shohei Ohtani',
      teamId: 'LAD',
      teamAbbreviation: 'LAD',
      handedness: 'L',
    },
    opponentTeamId: 'SF',
    opposingPitcherId: 'p_webb',
    opposingPitcherName: 'Logan Webb',
    opposingPitcherHandedness: 'R',
    gameTime: '2026-08-15T22:10:00Z',
    gameState: {
      gameId: 'g_lad_sf',
      lifecycle: 'scheduled',
      gameTime: '2026-08-15T22:10:00Z',
      homeTeamId: 'LAD',
      awayTeamId: 'SF',
      stadiumId: 's_dodger',
      inning: 0,
      inningHalf: 'top',
      scoreDifferential: 0,
      outs: 0,
      runnersOnBase: 0,
    },
    score: {
      hrIndex: 88,
      confidence: { level: 'very_high', score: 0.9, reasons: ['Elite exit velo'] },
      primaryRecommendation: 'Power surge match',
      provenance: {
        generatedAt: '2026-08-15T12:00:00Z',
        versions: { scorer: '1.0', weather: '1.0', matchup: '1.0' },
        freshness: { batter: 'now', pitcher: 'now', weather: 'now', odds: 'now' },
      },
    },
    statcastSummary: {
      xSLG: 0.58,
      barrelRate: 0.19,
      parkFactor: 104,
    },
    lineupStatus: 'confirmed_starter',
    rank: 2,
    odds: {
      price: 310,
      impliedProbability: 0.244,
      provider: 'FanDuel',
      updatedAt: '2026-08-15T12:00:00Z',
    },
    updatedAt: '2026-08-15T12:00:00Z',
  },
];

describe('HrStadium3DView — 3D Stadium & Trajectory Arena', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders 3D canvas stage, title badge, and trajectory count', () => {
    render(<HrStadium3DView items={mockItems} />);

    expect(screen.getByText(/3D Stadium & Trajectory Arena/i)).toBeTruthy();
    expect(screen.getByText(/\(2 trajectories\)/i)).toBeTruthy();
  });

  it('renders all 4 camera preset buttons and allows switching angles', () => {
    render(<HrStadium3DView items={mockItems} />);

    const flyoverBtn = screen.getByRole('button', { name: /Flyover \(3D\)/i });
    const plateBtn = screen.getByRole('button', { name: /Behind Plate/i });
    const outfieldBtn = screen.getByRole('button', { name: /Outfield/i });
    const pressboxBtn = screen.getByRole('button', { name: /Press Box/i });

    expect(flyoverBtn).toBeTruthy();
    expect(plateBtn).toBeTruthy();
    expect(outfieldBtn).toBeTruthy();
    expect(pressboxBtn).toBeTruthy();

    // Click Behind Plate preset
    fireEvent.click(plateBtn);
    expect(plateBtn.className).toContain('text-vouch-cyan');

    // Click Outfield preset
    fireEvent.click(outfieldBtn);
    expect(outfieldBtn.className).toContain('text-vouch-cyan');
  });

  it('displays the interactive Holographic Dossier for the selected player with Statcast physics', () => {
    render(<HrStadium3DView items={mockItems} />);

    // Initial selected player is Aaron Judge (present in dossier header and trajectory shelf)
    expect(screen.getAllByText(/Aaron Judge/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/94 HRPI/i)).toBeTruthy();
    expect(screen.getByText(/vs/i)).toBeTruthy();
    expect(screen.getByText(/Chris Sale/i)).toBeTruthy();

    // Statcast metrics
    expect(screen.getByText(/LAUNCH/i)).toBeTruthy();
    expect(screen.getByText(/DISTANCE/i)).toBeTruthy();
    expect(screen.getByText(/EDGE/i)).toBeTruthy();
  });

  it('switches the spotlighted player when a trajectory button is clicked', () => {
    render(<HrStadium3DView items={mockItems} />);

    // Find and click Ohtani button in the trajectory shelf
    const ohtaniBtns = screen.getAllByRole('button').filter((btn) => btn.textContent?.includes('Shohei Ohtani'));
    expect(ohtaniBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(ohtaniBtns[0]);

    expect(screen.getByText(/88 HRPI/i)).toBeTruthy();
    expect(screen.getByText(/Logan Webb/i)).toBeTruthy();
  });

  it('invokes openParlayAdd when Quick Add to Slip button is clicked', () => {
    const openParlaySpy = vi.spyOn(parlayContract, 'openParlayAdd').mockImplementation(() => {});

    render(<HrStadium3DView items={mockItems} />);

    const quickAddBtn = screen.getByRole('button', { name: /Quick Add to Slip/i });
    fireEvent.click(quickAddBtn);

    expect(openParlaySpy).toHaveBeenCalledOnce();
    expect(openParlaySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        player: expect.objectContaining({
          name: 'Aaron Judge',
          team: 'NYY',
        }),
        source: 'hr_intelligence',
        dataStatus: 'official',
      })
    );
  });
});
