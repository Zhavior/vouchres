export interface MlbPlayerStats {
  playerId: string;
  seasonHr: number;
  gamesPlayed: number;
  atBats: number;
}

export class MlbStatsProvider {
  /**
   * Stub for fetching player stats from the MLB API.
   * This handles the external HTTP request, normalization into internal format, and error handling.
   */
  public async getPlayerStats(playerId: string): Promise<MlbPlayerStats> {
    // TODO: Implement actual MLB Stats API HTTP call
    // For now, return a mock normalized response
    return {
      playerId,
      seasonHr: 24,
      gamesPlayed: 110,
      atBats: 420
    };
  }
}
