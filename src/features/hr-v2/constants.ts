/**
 * Vouch Edge HR Intelligence v2 — Shared Feature Constants
 */

/**
 * HR Index Tier Score Thresholds
 */
export const TIER_VERY_HIGH_MIN = 85;
export const TIER_HIGH_MIN = 70;
export const TIER_MODERATE_MIN = 60;

/**
 * Filter Slider Boundaries
 */
export const SLIDER_MIN_SCORE = 50;
export const SLIDER_MAX_SCORE = 90;
export const DEFAULT_MIN_SCORE = 60;

/**
 * Timing & Interval Constants (Milliseconds)
 */
export const SEARCH_DEBOUNCE_MS = 250;
export const NOW_TICK_INTERVAL_MS = 5000;
export const UPDATED_BADGE_DURATION_MS = 4000;

/**
 * Sorting & Ranking Boundary Constants
 */
export const SORT_DIFF_EPSILON = 0.00001;
export const UNRANKED_FALLBACK = 9999;

/**
 * Network & Retry Policy Constants
 */
export const MAX_RETRY_ATTEMPTS = 2;

/**
 * Roster Fetch & Timeout Constants
 */
export const ROSTER_FETCH_TIMEOUT_MS = 6000;

/**
 * Scoring Model Constants — Confirmed Starters (confirmed_lineup basis)
 * Slot-aware score descends from CONFIRMED_STARTER_SLOT_BONUS_BASE as batting order increases.
 * Batting slot 1 → highest score, slot 9 → lowest (but still above any roster_baseline score).
 */
export const CONFIRMED_STARTER_SLOT_BONUS_BASE = 68;
export const CONFIRMED_STARTER_SLOT_STEP = 2;
export const CONFIRMED_STARTER_MIN = 60;
export const CONFIRMED_STARTER_MAX = 94;

/**
 * Scoring Model Constants — Roster Baseline (roster_baseline basis)
 * Players on the active roster but NOT in a confirmed lineup get a clearly lower,
 * clearly labeled score range. This range MUST NOT overlap with confirmed_lineup scores.
 * SCORE_BASELINE_MAX must always be < CONFIRMED_STARTER_MIN.
 */
export const SCORE_BASELINE_MIN = 52;
export const SCORE_BASELINE_MAX = 59; // Strict ceiling — always below CONFIRMED_STARTER_MIN (60)

/**
 * Odds / Price Formula Constants
 */
export const ODDS_PRICE_BASE = 240;
export const ODDS_PRICE_SLOT_MULTIPLIER = 15;
export const ODDS_PRICE_STEP = 12;
