import { describe, it, expect } from 'vitest';
import {
  calculateTDPI,
  determineTier,
  MOCK_TOUCHDOWN_PLAYERS,
  INITIAL_NFL_TICKER_GAMES,
  SLATE_TELEMETRY_SNAPSHOT,
} from '../src/features/nfl-touchdown/data/mockTouchdownData';
import type { TouchdownPlayer, PlayerTier } from '../src/types/touchdown';

describe('TD NEXT Touchdown Telemetry Engine', () => {
  describe('TDPI Telemetry Formula', () => {
    it('calculates expected TDPI for Derrick Henry', () => {
      const henryScore = calculateTDPI({
        rzTouchShare: 81.2,
        inside10Touches: 14,
        oppRzDefRank: 29,
        impliedTeamTotal: 28.5,
        goalLineSnapPercent: 92,
      });

      expect(henryScore).toBeGreaterThanOrEqual(85);
      expect(henryScore).toBeLessThanOrEqual(95);
      expect(determineTier(henryScore)).toBe('ELITE');
    });

    it('classifies tiers accurately based on TDPI thresholds', () => {
      expect(determineTier(88.4)).toBe('ELITE');
      expect(determineTier(80.0)).toBe('ELITE');
      expect(determineTier(79.9)).toBe('STRONG');
      expect(determineTier(65.0)).toBe('STRONG');
      expect(determineTier(64.9)).toBe('VALUE');
      expect(determineTier(50.0)).toBe('VALUE');
      expect(determineTier(49.9)).toBe('SLEEPER');
      expect(determineTier(35.0)).toBe('SLEEPER');
    });

    it('bounds metrics between 0 and 100 properly', () => {
      const minScore = calculateTDPI({
        rzTouchShare: 0,
        inside10Touches: 0,
        oppRzDefRank: 1,
        impliedTeamTotal: 10,
        goalLineSnapPercent: 0,
      });
      expect(minScore).toBeGreaterThanOrEqual(0);
      expect(minScore).toBeLessThan(30);

      const maxScore = calculateTDPI({
        rzTouchShare: 100,
        inside10Touches: 20,
        oppRzDefRank: 32,
        impliedTeamTotal: 35,
        goalLineSnapPercent: 100,
      });
      expect(maxScore).toBeCloseTo(100, 0);
    });
  });

  describe('Mock Slate Integrity', () => {
    it('contains players distributed across all 4 tiers', () => {
      const tiersCount: Record<PlayerTier, number> = {
        ELITE: 0,
        STRONG: 0,
        VALUE: 0,
        SLEEPER: 0,
      };

      for (const player of MOCK_TOUCHDOWN_PLAYERS) {
        tiersCount[player.tier]++;
      }

      expect(tiersCount.ELITE).toBeGreaterThanOrEqual(2);
      expect(tiersCount.STRONG).toBeGreaterThanOrEqual(2);
      expect(tiersCount.VALUE).toBeGreaterThanOrEqual(2);
      expect(tiersCount.SLEEPER).toBeGreaterThanOrEqual(2);
    });

    it('contains Derrick Henry as the top Slate Alpha player', () => {
      const sorted = [...MOCK_TOUCHDOWN_PLAYERS].sort((a, b) => b.tdpiScore - a.tdpiScore);
      expect(sorted[0].name).toBe('Derrick Henry');
      expect(sorted[0].tdpiScore).toBe(88.4);
      expect(sorted[0].tier).toBe('ELITE');
    });

    it('includes active live red zone games in the ticker', () => {
      const liveRedZoneGames = INITIAL_NFL_TICKER_GAMES.filter((g) => g.isRedZoneActive);
      expect(liveRedZoneGames.length).toBeGreaterThanOrEqual(1);
      expect(liveRedZoneGames.some((g) => g.redZoneTeam === 'SF')).toBe(true);
    });

    it('matches slate telemetry aggregates', () => {
      expect(SLATE_TELEMETRY_SNAPSHOT.totalGames).toBe(16);
      expect(SLATE_TELEMETRY_SNAPSHOT.avgRedZoneEff).toBe(58.4);
      expect(SLATE_TELEMETRY_SNAPSHOT.systemAlpha).toBe(88.4);
      expect(SLATE_TELEMETRY_SNAPSHOT.maxMismatchMatchup.label).toBe('BAL @ MIN');
    });
  });
});
