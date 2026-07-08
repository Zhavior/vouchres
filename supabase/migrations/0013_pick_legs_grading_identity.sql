-- 0007_pick_legs_grading_identity.sql
-- Upgrade pick_legs and atomic parlay RPC so every saved leg keeps its exact grading identity.

alter table public.pick_legs
  add column if not exists sport text,
  add column if not exists game_id text,
  add column if not exists team_id text,
  add column if not exists market_code text,
  add column if not exists event_key text,
  add column if not exists popularity_key text,
  add column if not exists stat_target numeric,
  add column if not exists comparator text,
  add column if not exists external_provider text;

create index if not exists idx_pick_legs_event_key
  on public.pick_legs (event_key);

create index if not exists idx_pick_legs_game_player_market
  on public.pick_legs (game_id, player_id, market_code);

create or replace function public.create_parlay_with_legs(
  p_user_id uuid,
  p_sport text,
  p_event_id text,
  p_market text,
  p_selection text,
  p_odds_decimal numeric,
  p_stake_units numeric,
  p_confidence numeric,
  p_explanation text,
  p_is_demo boolean,
  p_source text,
  p_client_ref text,
  p_legs jsonb
)
returns public.picks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pick public.picks;
  v_existing public.picks;
begin
  if p_user_id is null then
    raise exception 'create_parlay_with_legs: p_user_id is required'
      using errcode = 'check_violation';
  end if;

  if p_client_ref is not null then
    select * into v_existing
      from public.picks
     where user_id = p_user_id and client_ref = p_client_ref
     limit 1;

    if found then
      return v_existing;
    end if;
  end if;

  insert into public.picks (
    user_id, capper_id, leg_type, sport, event_id, market, selection,
    odds_decimal, stake_units, confidence, explanation, is_demo,
    source, client_ref, status
  ) values (
    p_user_id, null, 'parlay', coalesce(p_sport, 'mlb'), p_event_id, p_market, p_selection,
    p_odds_decimal, p_stake_units, p_confidence, p_explanation, coalesce(p_is_demo, false),
    p_source, p_client_ref, 'pending'
  )
  returning * into v_pick;

  insert into public.pick_legs (
    pick_id,
    leg_index,
    sport,
    event_id,
    game_id,
    team_id,
    market,
    market_code,
    selection,
    odds_decimal,
    status,
    player_id,
    event_key,
    popularity_key,
    stat_target,
    comparator,
    external_provider
  )
  select
    v_pick.id,
    (elem->>'leg_index')::int,
    coalesce(elem->>'sport', p_sport, 'mlb'),
    elem->>'event_id',
    coalesce(elem->>'game_id', elem->>'event_id'),
    nullif(elem->>'team_id', ''),
    coalesce(elem->>'market', 'prop'),
    nullif(elem->>'market_code', ''),
    coalesce(elem->>'selection', '—'),
    nullif(elem->>'odds_decimal', '')::numeric,
    'pending',
    nullif(elem->>'player_id', ''),
    nullif(elem->>'event_key', ''),
    nullif(elem->>'popularity_key', ''),
    nullif(elem->>'stat_target', '')::numeric,
    nullif(elem->>'comparator', ''),
    nullif(elem->>'external_provider', '')
  from pg_catalog.jsonb_array_elements(p_legs) as elem;

  return v_pick;

exception
  when unique_violation then
    select * into v_existing
      from public.picks
     where user_id = p_user_id and client_ref = p_client_ref
     limit 1;

    if found then
      return v_existing;
    end if;

    raise;
end;
$$;
