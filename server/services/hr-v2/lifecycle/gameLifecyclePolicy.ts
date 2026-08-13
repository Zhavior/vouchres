import { GameLifecycle } from '../../../../src/features/hr-v2/domain/game';

/**
 * Determines when data should be considered stale based on the game's lifecycle state.
 */
export class LifecyclePolicy {
  
  /**
   * Returns the TTL in milliseconds for intelligence data given the current game lifecycle.
   */
  public static getTtlForLifecycle(lifecycle: GameLifecycle): number {
    switch (lifecycle) {
      case 'scheduled':
        // Updates infrequent before lineups
        return 60 * 60 * 1000; // 1 hour
      case 'lineup_pending':
      case 'pregame':
      case 'warmup':
        // High volatility right before first pitch
        return 5 * 60 * 1000; // 5 minutes
      case 'live':
        // Real-time (caching should be very short)
        return 30 * 1000; // 30 seconds
      case 'delayed':
      case 'suspended':
        // Wait for resumptions, don't ping heavily
        return 15 * 60 * 1000; // 15 minutes
      case 'postponed':
      case 'final':
      case 'cancelled':
        // Terminal or dead states, data won't change
        return 24 * 60 * 60 * 1000; // 24 hours
      default:
        return 60 * 60 * 1000; // default 1 hour
    }
  }

  /**
   * Determines if weather data needs an out-of-band refresh regardless of TTL.
   * e.g., if game transitions to 'delayed'
   */
  public static requiresEmergencyWeatherRefresh(previousLifecycle: GameLifecycle, newLifecycle: GameLifecycle): boolean {
    return previousLifecycle !== 'delayed' && newLifecycle === 'delayed';
  }
}
