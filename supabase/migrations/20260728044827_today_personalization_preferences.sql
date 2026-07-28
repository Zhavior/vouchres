-- Explicit, user-owned inputs for the authenticated Today experience.
-- These are preferences only; they must never be treated as predictions or
-- inferred engagement signals.
create table public.today_personalization_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  favorite_mlb_team_ids integer[] not null default '{}'::integer[],
  followed_mlb_player_ids integer[] not null default '{}'::integer[],
  followed_mlb_player_names text[] not null default '{}'::text[],
  research_interests text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint today_preferences_favorite_teams_limit
    check (cardinality(favorite_mlb_team_ids) <= 5),
  constraint today_preferences_favorite_teams_valid
    check (
      array_position(favorite_mlb_team_ids, null) is null
      and favorite_mlb_team_ids <@ array[
        108, 109, 110, 111, 112, 113, 114, 115, 116, 117,
        118, 119, 120, 121, 133, 134, 135, 136, 137, 138,
        139, 140, 141, 142, 143, 144, 145, 146, 147, 158
      ]::integer[]
    ),
  constraint today_preferences_followed_players_limit
    check (cardinality(followed_mlb_player_ids) <= 50),
  constraint today_preferences_followed_players_paired
    check (
      cardinality(followed_mlb_player_ids) = cardinality(followed_mlb_player_names)
      and array_position(followed_mlb_player_ids, null) is null
      and array_position(followed_mlb_player_names, null) is null
      and 0 < all(followed_mlb_player_ids)
      and '' < all(followed_mlb_player_names)
      and char_length(array_to_string(followed_mlb_player_names, '')) <= 4000
    ),
  constraint today_preferences_research_interests_limit
    check (cardinality(research_interests) <= 8),
  constraint today_preferences_research_interests_valid
    check (
      array_position(research_interests, null) is null
      and research_interests <@ array[
        'home_runs',
        'pitching_matchups',
        'lineup_status',
        'weather_park_factors',
        'player_form',
        'live_games',
        'active_slips',
        'results_accountability'
      ]::text[]
    )
);

create trigger today_personalization_preferences_touch_updated_at
  before update on public.today_personalization_preferences
  for each row execute function public.touch_updated_at();

alter table public.today_personalization_preferences enable row level security;

-- New public-schema entities are not auto-exposed in this project. Keep anon
-- closed, grant only the operations the authenticated preference client needs,
-- and let RLS enforce row ownership.
revoke all on public.today_personalization_preferences from anon, authenticated;
grant select, insert, update, delete on public.today_personalization_preferences to authenticated;
grant select, insert, update, delete on public.today_personalization_preferences to service_role;

drop policy if exists "today_personalization_preferences_select_own"
  on public.today_personalization_preferences;
create policy "today_personalization_preferences_select_own"
  on public.today_personalization_preferences for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "today_personalization_preferences_insert_own"
  on public.today_personalization_preferences;
create policy "today_personalization_preferences_insert_own"
  on public.today_personalization_preferences for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "today_personalization_preferences_update_own"
  on public.today_personalization_preferences;
create policy "today_personalization_preferences_update_own"
  on public.today_personalization_preferences for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "today_personalization_preferences_delete_own"
  on public.today_personalization_preferences;
create policy "today_personalization_preferences_delete_own"
  on public.today_personalization_preferences for delete
  to authenticated
  using ((select auth.uid()) = user_id);
