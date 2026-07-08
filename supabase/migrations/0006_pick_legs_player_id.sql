-- =========================================================
-- 0006_pick_legs_player_id.sql
--
-- Persist the MLB player id per parlay leg so My Parlay Board can show real
-- player headshots after reload (not just for legs added in the live session).
--
-- STATUS: NOT ASSUMED RUN. Idempotent. The POST /api/me/parlays route degrades
-- gracefully if this is not applied yet (it retries leg inserts without
-- player_id, and the RPC simply ignores the field), so this is an UPGRADE,
-- not a hard dependency. With it unapplied, cards fall back to initials avatars.
-- =========================================================

-- 1. Column ---------------------------------------------------
-- Bare numeric MLB person id (text to stay flexible across sports). Nullable —
-- legs without a known player just show an initials avatar.
alter table public.pick_legs add column if not exists player_id text;

-- 2. Redefine the atomic create RPC to also carry player_id ---
-- Same body as 0003 plus player_id selected from the legs jsonb. CREATE OR
-- REPLACE keeps the existing signature, so grants/RLS are unaffected.
create or replace function public.create_parlay_with_legs(
  p_user_id      uuid,
  p_sport        text,
  p_event_id     text,
  p_market       text,
  p_selection    text,
  p_odds_decimal numeric,
  p_stake_units  numeric,
  p_confidence   numeric,
  p_explanation  text,
  p_is_demo      boolean,
  p_source       text,
  p_client_ref   text,
  p_legs         jsonb
) returns public.picks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pick     public.picks;
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

  insert into public.pick_legs (pick_id, leg_index, event_id, market, selection, odds_decimal, status, player_id)
  select
    v_pick.id,
    (elem->>'leg_index')::int,
    elem->>'event_id',
    coalesce(elem->>'market', 'prop'),
    coalesce(elem->>'selection', '—'),
    nullif(elem->>'odds_decimal', '')::numeric,
    'pending',
    nullif(elem->>'player_id', '')
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
