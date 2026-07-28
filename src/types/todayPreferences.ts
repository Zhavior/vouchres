export const TODAY_RESEARCH_INTERESTS = [
  'home_runs',
  'pitching_matchups',
  'lineup_status',
  'weather_park_factors',
  'player_form',
  'live_games',
  'active_slips',
  'results_accountability',
] as const;

export type TodayResearchInterest = (typeof TODAY_RESEARCH_INTERESTS)[number];

export const TODAY_IN_APP_ALERT_TYPES = [
  'favorite_team_game_state',
  'followed_player_lineup',
  'research_change',
  'tracked_result',
] as const;

export type TodayInAppAlertType = (typeof TODAY_IN_APP_ALERT_TYPES)[number];

export interface TodayFollowedPlayer {
  id: number;
  name: string;
}

export interface TodayPreferences {
  favoriteMlbTeamIds: number[];
  followedPlayers: TodayFollowedPlayer[];
  researchInterests: TodayResearchInterest[];
  inAppAlertTypes: TodayInAppAlertType[];
  updatedAt: string | null;
}

export type TodayPreferencesUpdate = Omit<TodayPreferences, 'updatedAt'>;
