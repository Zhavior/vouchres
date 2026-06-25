/**
 * Data Provider — the interface between the HR engine and real MLB data sources.
 *
 * In production, this fetches from Statcast / FanGraphs / MLB Stats API.
 * In dev/test, this returns mock data (see mockData.ts).
 *
 * The engine never calls this directly — it just consumes HrEngineInputs.
 * Your pages/services call the provider to build inputs, then pass them
 * to calculateHrPrediction().
 *
 * Pattern:
 *   const inputs = await dataProvider.getHrEngineInputs(playerId, gameId);
 *   const prediction = calculateHrPrediction(inputs);
 */

import { HrEngineInputs } from "./types";

export interface HrDataProvider {
  /** Get all data needed to predict a hitter's HR probability for a specific game. */
  getHrEngineInputs(playerId: string, gameId: string): Promise<HrEngineInputs>;

  /** Get all hitters playing in a game (for HR Board). */
  getHittersForGame(gameId: string): Promise<string[]>;

  /** Get today's games. */
  getTodaysGames(): Promise<GameInfo[]>;

  /** Get pitcher data for a game. */
  getPitcherForGame(gameId: string): Promise<PitcherInfo>;
}

export interface GameInfo {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  startTime: Date;
  parkHrFactor: number;
  weather: {
    temperatureF: number;
    windMph: number;
    windDirection: "out" | "in" | "cross" | "neutral";
    precipitation: boolean;
  };
  homePitcher: PitcherInfo;
  awayPitcher: PitcherInfo;
}

export interface PitcherInfo {
  pitcherId: string;
  name: string;
  throws: "L" | "R";
  expectedInnings: number;
}

/**
 * Real data provider — uses Statcast + MLB Stats API.
 *
 * Implementation notes:
 *
 * 1. Statcast data (Barrel%, Hard-Hit%, xSLG by pitch type):
 *    - Source: baseballsavant.mlb.com (free, no API key)
 *    - Endpoint: /api/player/{playerId}/statcast
 *    - Filter by date range for "last 7 days" / "last 15 days"
 *    - Cache: 1 hour TTL (data updates daily, not real-time)
 *
 * 2. FanGraphs data (ISO, HR/FB, splits):
 *    - Source: fangraphs.com (scraping allowed for non-commercial use)
 *    - Or use the FanGraphs API (paid)
 *    - Alternative: statmuse.com, baseball-reference.com
 *
 * 3. MLB Stats API (game info, lineups, weather):
 *    - Source: statsapi.mlb.com (free, no key)
 *    - Endpoints:
 *        /api/v1/schedule?sportId=1&date=YYYY-MM-DD
 *        /api/v1/game/{gamePk}/boxscore
 *        /api/v1/game/{gamePk}/content (weather)
 *    - Lineups: confirmed 30-60 min before first pitch
 *
 * 4. Park factors:
 *    - Source: FanGraphs park factors (updated annually)
 *    - Or hardcoded in constants (with yearly update)
 *
 * 5. Weather:
 *    - Source: openweathermap.org (free tier)
 *    - Or MLB Stats API game content
 *
 * For beta, you can start with just MLB Stats API + Statcast and approximate
 * the rest with sensible defaults. Add FanGraphs later for full coverage.
 */
export class RealDataProvider implements HrDataProvider {
  constructor(
    private readonly options: {
      statcastBaseUrl?: string;
      mlbApiBaseUrl?: string;
      cache?: Cache;
    } = {}
  ) {}

  async getHrEngineInputs(playerId: string, gameId: string): Promise<HrEngineInputs> {
    // 1. Fetch game info (park factor, weather, opposing pitcher)
    const game = await this.fetchGameInfo(gameId);

    // 2. Fetch hitter season stats (Statcast)
    const hitterStats = await this.fetchHitterStats(playerId);

    // 3. Fetch hitter recent form (last 7 / last 15 days)
    const recentForm = await this.fetchHitterRecentForm(playerId);

    // 4. Fetch hitter pitch-type xSLG (Statcast)
    const pitchTypeStats = await this.fetchHitterPitchTypeStats(playerId);

    // 5. Fetch hitter handedness splits
    const splits = await this.fetchHitterSplits(playerId);

    // 6. Fetch opposing pitcher vulnerability stats
    const pitcherStats = await this.fetchPitcherStats(game.awayPitcher.pitcherId);

    // 7. Fetch opposing bullpen stats
    const bullpenStats = await this.fetchBullpenStats(game.homeTeam);

    // 8. Fetch confirmed lineup (if available)
    const lineup = await this.fetchLineup(gameId, playerId);

    // 9. Assemble the HrEngineInputs
    return {
      playerId,
      playerName: hitterStats.name,
      team: hitterStats.team,
      opponent: game.awayTeam,
      pitcherName: game.awayPitcher.name,
      gameId,

      expectedPA: this.estimateExpectedPA(lineup.spot ?? 5),
      contactRate: 1 - hitterStats.kRate,
      flyBallRate: hitterStats.flyBallRate,
      bbRate: hitterStats.bbRate,
      hitterHand: hitterStats.batSide,

      hitterPower: {
        iso: hitterStats.iso,
        barrelRate: hitterStats.barrelRate,
        hardHitRate: hitterStats.hardHitRate,
        hrFbRate: hitterStats.hrFbRate,
        isoPercentile: hitterStats.isoPercentile,
        barrelPercentile: hitterStats.barrelPercentile,
        hardHitPercentile: hitterStats.hardHitPercentile,
        hrFbPercentile: hitterStats.hrFbPercentile,
      },

      barrelForm: {
        seasonBarrelRate: hitterStats.barrelRate,
        last15BarrelRate: recentForm.last15BarrelRate,
        last7BarrelRate: recentForm.last7BarrelRate,
        last7HardHitRate: recentForm.last7HardHitRate,
        last15BattedBalls: recentForm.last15BattedBalls,
        last7BattedBalls: recentForm.last7BattedBalls,
      },

      pitcherVulnerability: {
        hr9: pitcherStats.hr9,
        barrelAllowed: pitcherStats.barrelAllowed,
        hardHitAllowed: pitcherStats.hardHitAllowed,
        fbAllowed: pitcherStats.fbAllowed,
        bbRate: pitcherStats.bbRate,
        middleMiddleRate: pitcherStats.middleMiddleRate,
        meatballRate: pitcherStats.meatballRate,
        hr9Percentile: pitcherStats.hr9Percentile,
        barrelAllowedPercentile: pitcherStats.barrelAllowedPercentile,
        hardHitAllowedPercentile: pitcherStats.hardHitAllowedPercentile,
        fbAllowedPercentile: pitcherStats.fbAllowedPercentile,
      },

      pitchMix: {
        pitcherFastballRate: pitcherStats.pitchMix.fastball,
        pitcherSliderRate: pitcherStats.pitchMix.slider,
        pitcherChangeupRate: pitcherStats.pitchMix.changeup,
        pitcherCurveballRate: pitcherStats.pitchMix.curveball,
        pitcherCutterRate: pitcherStats.pitchMix.cutter,
        pitcherSinkerRate: pitcherStats.pitchMix.sinker,
        hitterXslgVsFastball: pitchTypeStats.fastball,
        hitterXslgVsSlider: pitchTypeStats.slider,
        hitterXslgVsChangeup: pitchTypeStats.changeup,
        hitterXslgVsCurveball: pitchTypeStats.curveball,
        hitterXslgVsCutter: pitchTypeStats.cutter,
        hitterXslgVsSinker: pitchTypeStats.sinker,
      },

      handedness: {
        hitterIsoVsHand: splits.isoVsHand,
        hitterOverallIso: splits.overallIso,
        pitcherHrAllowedVsHand: pitcherStats.hrAllowedVsHand,
      },

      parkWeather: {
        parkHrFactor: game.parkHrFactor,
        temperatureF: game.weather.temperatureF,
        windMph: game.weather.windMph,
        windDirection: game.weather.windDirection,
        precipitation: game.weather.precipitation,
      },

      lineup: {
        lineupSpot: lineup.spot,
        lineupConfirmed: lineup.confirmed,
        pinchHitRisk: lineup.pinchHitRisk,
      },

      bullpen: {
        bullpenHr9: bullpenStats.hr9,
        bullpenBarrelAllowed: bullpenStats.barrelAllowed,
        bullpenFatigue: bullpenStats.fatigue,
        starterExpectedInnings: game.awayPitcher.expectedInnings,
      },

      strikeoutPenalty: {
        batterKRate: splits.kRateVsHand,
        pitcherKRate: pitcherStats.kRate,
      },

      confidence: {
        lineupConfirmed: lineup.confirmed,
        recentSampleSize: recentForm.last7BattedBalls < 10 ? "small" : recentForm.last15BattedBalls < 30 ? "medium" : "large",
        weatherUncertainty: game.weather.precipitation,
        pinchHitRisk: lineup.pinchHitRisk,
        injuryOrRestRisk: false, // would need an injury report source
        dataQuality: hitterStats.seasonBattedBalls >= 200 ? "full" : hitterStats.seasonBattedBalls >= 100 ? "partial" : "limited",
      },
    };
  }

  async getHittersForGame(gameId: string): Promise<string[]> {
    // Fetch lineups from MLB Stats API
    // Returns player IDs for all 18 starters (9 per team)
    throw new Error("Not implemented — wire to MLB Stats API");
  }

  async getTodaysGames(): Promise<GameInfo[]> {
    throw new Error("Not implemented — wire to MLB Stats API schedule endpoint");
  }

  async getPitcherForGame(gameId: string): Promise<PitcherInfo> {
    throw new Error("Not implemented");
  }

  // ===== Private fetch methods (implement these against real APIs) =====

  private async fetchGameInfo(gameId: string): Promise<GameInfo> {
    throw new Error("Implement: call MLB Stats API /api/v1/game/{gamePk}/content");
  }

  private async fetchHitterStats(playerId: string): Promise<any> {
    throw new Error("Implement: call Statcast or FanGraphs for season-long hitter stats");
  }

  private async fetchHitterRecentForm(playerId: string): Promise<any> {
    throw new Error("Implement: call Statcast for last-7 and last-15 day windows");
  }

  private async fetchHitterPitchTypeStats(playerId: string): Promise<any> {
    throw new Error("Implement: call Statcast for xSLG by pitch type");
  }

  private async fetchHitterSplits(playerId: string): Promise<any> {
    throw new Error("Implement: call FanGraphs for LHP/RHP splits");
  }

  private async fetchPitcherStats(pitcherId: string): Promise<any> {
    throw new Error("Implement: call Statcast for pitcher season stats");
  }

  private async fetchBullpenStats(teamAbbr: string): Promise<any> {
    throw new Error("Implement: aggregate bullpen stats from Statcast");
  }

  private async fetchLineup(gameId: string, playerId: string): Promise<any> {
    throw new Error("Implement: call MLB Stats API for confirmed lineups");
  }

  private estimateExpectedPA(lineupSpot: number): number {
    // Rough estimate based on lineup spot
    // Top of order: ~4.5 PA, bottom: ~3.5 PA
    return Math.max(3.2, 5.0 - (lineupSpot - 1) * 0.2);
  }
}
