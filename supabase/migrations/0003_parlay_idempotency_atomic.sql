-- =========================================================
-- 0003_parlay_idempotency_atomic.sql
--
-- Atomic parlay creation + duplicate protection.
--
-- STATUS: NOT ASSUMED RUN. Apply manually (supabase db push or SQL editor).
-- All statements are idempotent (IF NOT EXISTS / CREATE OR REPLACE) and safe
-- to re-run. The POST /api/me/parlays route degrades gracefully if this has
-- not been applied yet (it falls back to a parent-insert + rollback path and
-- skips client_ref dedup), so applying this is an UPGRADE, not a hard
-- dependency.
-- =========================================================

-- 1. Columns -------------------------------------------------
-- client_ref: the frontend's local parlay id, used as an idempotency key so a
--             double-click Save cannot create two backend rows for one parlay.
-- source:     where the parlay came from (manual | scanner | ai_pick | edge_island).
alter table public.picks add column if not exists client_ref text;
alter table public.picks add column if not exists source     text;

-- One backend parlay per (user, client_ref). Partial index ignores null refs
-- (legacy rows / capper picks) so it does not block existing data.
create unique index if not exists picks_user_client_ref_uidx
  on public.picks(user_id, client_ref)
  where client_ref is not null and user_id is not null;

-- 2. Atomic create RPC --------------------------------------
-- Inserts the parent parlay pick AND all legs inside ONE transaction
-- (function body is atomic). If any leg insert fails, the whole thing rolls
-- back — no orphan parent pick. Idempotent on client_ref.
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
-- Empty search_path is the safest setting for a SECURITY DEFINER function:
-- it prevents a caller from shadowing unqualified objects via a mutable
-- search_path. Every object below is therefore schema-qualified
-- (public.* / pg_catalog.*).
set search_path = ''
as $$
declare
  v_pick     public.picks;
  v_existing public.picks;
begin
  -- Validate inputs. user_id is mandatory (a parlay must belong to a user);
  -- client_ref is optional (null = no idempotency key).
  if p_user_id is null then
    raise exception 'create_parlay_with_legs: p_user_id is required'
      using errcode = 'check_violation';
  end if;

  -- Idempotency: if this user already saved this client_ref, return it as-is.
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

  -- Insert legs from the jsonb array. If this throws, the function's implicit
  -- transaction rolls back the parent insert above too.
  insert into public.pick_legs (pick_id, leg_index, event_id, market, selection, odds_decimal, status)
  select
    v_pick.id,
    (elem->>'leg_index')::int,
    elem->>'event_id',
    coalesce(elem->>'market', 'prop'),
    coalesce(elem->>'selection', '—'),
    nullif(elem->>'odds_decimal', '')::numeric,
    'pending'
  from pg_catalog.jsonb_array_elements(p_legs) as elem;

  return v_pick;
exception
  when unique_violation then
    -- Race: another request inserted the same client_ref first. Return theirs.
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

-- Server-only: the API calls this with the service role. Lock it down so it
-- cannot be invoked by anon/authenticated clients directly (it is SECURITY
-- DEFINER and takes a user_id argument).
revoke all on function public.create_parlay_with_legs(
  uuid, text, text, text, text, numeric, numeric, numeric, text, boolean, text, text, jsonb
) from public;
revoke all on function public.create_parlay_with_legs(
  uuid, text, text, text, text, numeric, numeric, numeric, text, boolean, text, text, jsonb
) from anon, authenticated;
grant execute on function public.create_parlay_with_legs(
  uuid, text, text, text, text, numeric, numeric, numeric, text, boolean, text, text, jsonb
) to service_role;
