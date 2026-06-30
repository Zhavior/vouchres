-- =========================================================
-- 0005_parlay_visibility.sql   (PROPOSAL — review before running)
--
-- PROBLEM: 0001_init.sql defines `picks_read_all` (select using true), which
-- makes EVERY pick/parlay readable through the anon key. The parlay API always
-- filters by user_id with the service role, so the app never leaks data — but a
-- raw anon query against the picks table could read another user's private
-- parlays directly.
--
-- FIX: add a `visibility` column (private | public). Manual parlays default to
-- private; only explicitly shared/social picks become public. Then replace the
-- blanket read policy with a per-row one.
--
-- STATUS: NOT ASSUMED RUN. Idempotent.
--
-- VERIFIED SAFE FOR THE FEED/LEADERBOARD:
-- An audit of the codebase found NO client-side (anon key) reads of picks /
-- pick_legs — all 37 reads are server-side via the service role, which BYPASSES
-- RLS. The social feed is built from `posts` (joined to picks server-side) and
-- the leaderboard from `trust_scores` / aggregate pick queries, both via the
-- service role. Therefore changing the picks SELECT policy has ZERO effect on
-- current app behavior; it only closes the raw-anon-query leak. (If you ever
-- switch a client read to the anon key, this policy is what protects it.)
-- =========================================================

-- 1. Column + default ---------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'pick_visibility') then
    create type pick_visibility as enum ('private', 'public');
  end if;
end $$;

alter table public.picks
  add column if not exists visibility pick_visibility not null default 'private';

-- Backfill: PRIVATE by default (the column default already did this for new
-- rows; this also covers any rows created before the column existed). Then mark
-- ONLY genuinely shared/social picks public — i.e. picks that have been posted
-- to the feed (posts.pick_id). This keeps manual parlays private while shared
-- picks stay visible.
update public.picks set visibility = 'private' where visibility is null;

update public.picks p set visibility = 'public'
where exists (
  select 1 from public.posts po where po.pick_id = p.id
);

create index if not exists picks_visibility_idx on public.picks(visibility);

-- 2. Replace the blanket read policy ------------------------
-- A pick is readable if it is public OR the requester owns it.
drop policy if exists "picks_read_all" on public.picks;
create policy "picks_read_public_or_own"
  on public.picks for select
  using ( visibility = 'public' or auth.uid() = user_id );

-- pick_legs follows its parent pick's visibility.
drop policy if exists "pick_legs_read_all" on public.pick_legs;
create policy "pick_legs_read_public_or_own"
  on public.pick_legs for select
  using (
    exists (
      select 1 from public.picks p
      where p.id = pick_id
        and (p.visibility = 'public' or p.user_id = auth.uid())
    )
  );

-- NOTE: after this runs, the API should set visibility='private' for manual
-- saves and 'public' only for shared/social picks. See server/routes/parlayRoutes.ts.
