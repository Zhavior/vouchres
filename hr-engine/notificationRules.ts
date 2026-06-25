/**
 * Notification Rules Engine (Section 20)
 *
 * Generates notifications based on math changes, not spam.
 *
 * Triggers:
 *   - HR Score jumps above 80 (or drops below 60)
 *   - Lineup confirms a top HR candidate
 *   - Weather shifts to wind-out (or in)
 *   - Pitcher change creates HR boost (or removes one)
 *   - Vulnerable bullpen enters
 *   - User's saved pick gets riskier
 *   - Parlay leg becomes inactive (lineup not confirmed, player scratched)
 */

import { HrPrediction, HrNotification, NotificationType } from "./types";
import { NOTIFICATION_THRESHOLDS } from "./constants";

/**
 * Compare two predictions for the same player and emit any notifications
 * that should fire based on the change.
 *
 * Usage (run on every prediction refresh):
 *   const notifications = comparePredictions(oldPrediction, newPrediction, savedPickIds);
 */
export function comparePredictions(
  before: HrPrediction | null,
  after: HrPrediction,
  options: {
    isSavedPick?: boolean;
    isParlayLeg?: boolean;
  } = {}
): HrNotification[] {
  const notifications: HrNotification[] = [];
  const { isSavedPick = false, isParlayLeg = false } = options;

  // 1. HR Score boost alert (crosses 80 threshold going up)
  if (
    before &&
    before.hrScore < NOTIFICATION_THRESHOLDS.hrScoreBoost &&
    after.hrScore >= NOTIFICATION_THRESHOLDS.hrScoreBoost &&
    after.hrScore - before.hrScore >= NOTIFICATION_THRESHOLDS.minScoreDelta
  ) {
    notifications.push({
      id: `notif-${after.playerId}-${Date.now()}-boost`,
      type: "hr_boost",
      title: "🚀 HR Boost Alert",
      body: `${after.playerName} moved from ${before.hrScore.toFixed(0)} → ${after.hrScore.toFixed(0)} after ${describeChange(before, after)}.`,
      playerId: after.playerId,
      gameId: after.gameId,
      scoreBefore: before.hrScore,
      scoreAfter: after.hrScore,
      createdAt: new Date().toISOString(),
      severity: "info",
    });
  }

  // 2. HR Score drop alert (crosses 60 going down)
  if (
    before &&
    before.hrScore >= NOTIFICATION_THRESHOLDS.hrScoreDrop &&
    after.hrScore < NOTIFICATION_THRESHOLDS.hrScoreDrop &&
    before.hrScore - after.hrScore >= NOTIFICATION_THRESHOLDS.minScoreDelta
  ) {
    notifications.push({
      id: `notif-${after.playerId}-${Date.now()}-drop`,
      type: "pick_risk",
      title: "⚠️ Risk Alert",
      body: `${after.playerName} dropped from ${before.hrScore.toFixed(0)} → ${after.hrScore.toFixed(0)} due to ${describeChange(before, after)}.`,
      playerId: after.playerId,
      gameId: after.gameId,
      scoreBefore: before.hrScore,
      scoreAfter: after.hrScore,
      createdAt: new Date().toISOString(),
      severity: "warning",
    });
  }

  // 3. Lineup confirmed alert
  if (
    before &&
    !before.lineupScore.confirmed &&
    after.lineupScore.confirmed &&
    after.lineupScore.lineupSpot !== null &&
    after.lineupScore.lineupSpot <= 4
  ) {
    notifications.push({
      id: `notif-${after.playerId}-${Date.now()}-lineup`,
      type: "lineup_confirmed",
      title: "✅ Lineup Confirmed",
      body: `${after.playerName} confirmed batting ${ordinal(after.lineupScore.lineupSpot)}. Score: ${after.hrScore.toFixed(0)}/100.`,
      playerId: after.playerId,
      gameId: after.gameId,
      scoreBefore: before?.hrScore,
      scoreAfter: after.hrScore,
      createdAt: new Date().toISOString(),
      severity: "info",
    });
  }

  // 4. Weather shift alert (wind direction or major temp change)
  if (before && before.gameId === after.gameId) {
    const windBefore = before.parkWeatherScore.windMph * (before.parkWeatherScore.windDirection === "in" ? -1 : 1);
    const windAfter = after.parkWeatherScore.windMph * (after.parkWeatherScore.windDirection === "in" ? -1 : 1);
    const windDelta = windAfter - windBefore;

    if (Math.abs(windDelta) >= NOTIFICATION_THRESHOLDS.windShiftMph) {
      const direction = windDelta > 0 ? "out" : "in";
      notifications.push({
        id: `notif-${after.playerId}-${Date.now()}-weather`,
        type: "weather_shift",
        title: direction === "out" ? "🌬️ Wind-Out Boost" : "⚠️ Wind-In Suppression",
        body: `Wind shifted ${Math.abs(windDelta).toFixed(0)} mph ${direction} for ${after.team} vs ${after.opponent}. ${after.playerName} score: ${after.hrScore.toFixed(0)}/100.`,
        playerId: after.playerId,
        gameId: after.gameId,
        scoreBefore: before.hrScore,
        scoreAfter: after.hrScore,
        createdAt: new Date().toISOString(),
        severity: direction === "out" ? "info" : "warning",
      });
    }
  }

  // 5. Pitcher change alert
  if (before && before.pitcherName !== after.pitcherName) {
    notifications.push({
      id: `notif-${after.playerId}-${Date.now()}-pitcher`,
      type: "pitcher_change",
      title: "🔄 Pitcher Change",
      body: `Opposing pitcher for ${after.playerName} changed from ${before.pitcherName} to ${after.pitcherName}. Score: ${before.hrScore.toFixed(0)} → ${after.hrScore.toFixed(0)}.`,
      playerId: after.playerId,
      gameId: after.gameId,
      scoreBefore: before.hrScore,
      scoreAfter: after.hrScore,
      createdAt: new Date().toISOString(),
      severity: "info",
    });
  }

  // 6. Parlay leg became inactive
  if (isParlayLeg && before?.lineupScore.confirmed && !after.lineupScore.confirmed) {
    notifications.push({
      id: `notif-${after.playerId}-${Date.now()}-parlay-inactive`,
      type: "parlay_inactive",
      title: "🚨 Parlay Leg Inactive",
      body: `${after.playerName} is no longer in the confirmed lineup. Your parlay leg is at risk.`,
      playerId: after.playerId,
      gameId: after.gameId,
      scoreBefore: before.hrScore,
      scoreAfter: after.hrScore,
      createdAt: new Date().toISOString(),
      severity: "critical",
    });
  }

  // 7. Saved pick risk alert (saved pick dropped significantly)
  if (isSavedPick && before && before.hrScore - after.hrScore >= 10) {
    notifications.push({
      id: `notif-${after.playerId}-${Date.now()}-saved-risk`,
      type: "pick_risk",
      title: "⚠️ Saved Pick Risk",
      body: `Your saved pick ${after.playerName} dropped ${before.hrScore.toFixed(0)} → ${after.hrScore.toFixed(0)}. ${describeChange(before, after)}.`,
      playerId: after.playerId,
      gameId: after.gameId,
      scoreBefore: before.hrScore,
      scoreAfter: after.hrScore,
      createdAt: new Date().toISOString(),
      severity: "warning",
    });
  }

  return notifications;
}

/**
 * Generate a notification when a vulnerable bullpen enters the game.
 */
export function bullpenAlertNotification(
  playerName: string,
  gameId: string,
  bullpenHr9: number
): HrNotification {
  return {
    id: `notif-bullpen-${gameId}-${Date.now()}`,
    type: "bullpen_alert",
    title: "🔥 Bullpen Alert",
    body: `Vulnerable bullpen entering for ${playerName}'s game. Bullpen HR/9: ${bullpenHr9.toFixed(2)}. Late-game HR opportunity boosted.`,
    gameId,
    createdAt: new Date().toISOString(),
    severity: "info",
  };
}

function describeChange(before: HrPrediction, after: HrPrediction): string {
  const changes: string[] = [];
  if (before.lineupScore.confirmed !== after.lineupScore.confirmed) {
    changes.push(after.lineupScore.confirmed ? "lineup confirmation" : "lineup uncertainty");
  }
  if (before.parkWeatherScore.windDirection !== after.parkWeatherScore.windDirection) {
    changes.push(`wind shift to ${after.parkWeatherScore.windDirection}`);
  }
  if (Math.abs(before.parkWeatherScore.temperatureF - after.parkWeatherScore.temperatureF) >= 10) {
    changes.push(`temperature change to ${after.parkWeatherScore.temperatureF}°F`);
  }
  if (before.pitcherName !== after.pitcherName) {
    changes.push("pitcher change");
  }
  if (before.barrelFormScore.trend !== after.barrelFormScore.trend) {
    changes.push(`form trend shift to ${after.barrelFormScore.trend}`);
  }

  if (changes.length === 0) return "model refresh";
  if (changes.length === 1) return changes[0];
  return changes.slice(0, -1).join(", ") + " and " + changes[changes.length - 1];
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
