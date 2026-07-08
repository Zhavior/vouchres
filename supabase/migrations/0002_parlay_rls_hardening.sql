-- =========================================================
-- 0002_parlay_rls_hardening.sql
--
-- Parlay system RLS hardening.
--
-- STATUS: NOT ASSUMED RUN. Apply manually via
--   supabase db push        (local/dev)
--   or paste into the Supabase SQL editor (prod)
-- after reviewing. Everything here is idempotent (IF NOT EXISTS /
-- drop-then-create) so it is safe to re-run.
--
-- Context: picks + pick_legs already have RLS enabled in 0001_init.sql with:
--   picks_read_all       (select using true)        -- world-readable for social feed
--   picks_insert_self    (insert with check auth.uid() = user_id)
--   picks_update_self    (update using auth.uid() = user_id)
--   pick_legs_read_all   (select using true)
--   pick_legs_write_self (all  using pick ownership)
--
-- Gaps this migration closes:
--   1. No DELETE policy on picks — a user could not hard-delete their own
--      parlay through the anon key. (The app currently soft-deletes via UPDATE,
--      which is covered by picks_update_self, but a real DELETE policy is
--      needed for GDPR account deletion + future hard-delete UX.)
-- =========================================================

-- Ensure RLS stays enabled (no-op if already on).
alter table public.picks     enable row level security;
alter table public.pick_legs enable row level security;

-- picks: allow a user to delete ONLY their own picks/parlays.
drop policy if exists "picks_delete_self" on public.picks;
create policy "picks_delete_self"
  on public.picks for delete
  using (auth.uid() = user_id);

-- pick_legs already has an ALL policy (pick_legs_write_self) scoped to pick
-- ownership, which covers delete via cascade — no extra leg DELETE policy needed.
-- The ON DELETE CASCADE on pick_legs.pick_id removes legs when a parent pick
-- is deleted regardless of RLS.

-- =========================================================
-- NOTE (privacy, intentionally NOT changed here):
-- picks_read_all / pick_legs_read_all expose ALL picks publicly via the anon
-- key. This is by design for the social feed + leaderboard. The parlay API
-- routes (server/routes/parlayRoutes.ts) always use the service role and
-- filter by user_id, so the application never leaks cross-user parlays.
-- If parlays must become private, replace picks_read_all with a policy like:
--   using ( auth.uid() = user_id OR visibility = 'public' )
-- and add a `visibility` column — but that is a product decision, not a fix.
-- =========================================================
