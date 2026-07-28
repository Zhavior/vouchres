-- User-requested in-app change alerts for the authenticated Today briefing.
-- This stores explicit preferences only. It does not claim background push delivery.
alter table public.today_personalization_preferences
  add column in_app_alert_types text[] not null default '{}'::text[];

alter table public.today_personalization_preferences
  add constraint today_preferences_in_app_alert_types_limit
    check (cardinality(in_app_alert_types) <= 4),
  add constraint today_preferences_in_app_alert_types_valid
    check (
      array_position(in_app_alert_types, null) is null
      and in_app_alert_types <@ array[
        'favorite_team_game_state',
        'followed_player_lineup',
        'research_change',
        'tracked_result'
      ]::text[]
    );
