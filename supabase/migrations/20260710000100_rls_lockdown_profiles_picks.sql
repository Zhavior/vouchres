-- =========================================================
-- 20260710000100_rls_lockdown_profiles_picks.sql
--
-- SECURITY: close self-escalation and record-forgery via the anon/authenticated
-- Supabase client (browser). These tables were world-writable by their owner
-- with NO column protection, so from the browser console a logged-in user could:
--
--   * UPDATE profiles SET tier='seller_pro'   → self-grant paid access (free)
--   * UPDATE profiles SET is_staff=true        → self-grant staff/admin powers
--   * UPDATE profiles SET trust_score=100      → inflate own trust score
--   * UPDATE picks   SET status='won'          → forge a winning pick record
--   * INSERT picks   (..., status='won')       → fabricate a won pick from scratch
--       (picks_insert_self only checked user_id, not status)
--   * write pick_legs for their own picks      → tamper leg grades
--
-- Every LEGITIMATE write to these tables already goes through the backend,
-- which uses the service-role client (server/middleware/auth.ts supabaseAdmin)
-- and BYPASSES RLS entirely. The frontend never writes profiles/picks/pick_legs
-- via the anon client (verified: zero .from('profiles'|'picks'|'pick_legs')
-- .update/.insert/.delete calls in src/). So removing these permissive policies
-- changes nothing for real users and only closes the attack surface.
--
-- Reads are unaffected: profiles_read_public, picks_read_public_or_own, and
-- pick_legs_read_public_or_own remain in place.
--
-- Idempotent and safe to re-run.
-- =========================================================

-- profiles: was owner-updatable with no column guard. Drop it — profiles are
-- written server-side only (signup, tier change via Stripe webhook, staff
-- grant), all via service role.
drop policy if exists "profiles_update_self" on public.profiles;
-- Also drop any owner-insert policy if one exists (profile rows are created by
-- the auth trigger / server, never by the browser).
drop policy if exists "profiles_insert_self" on public.profiles;

-- picks: was owner insert/update-able. Grading and creation are server-side
-- only (POST /api/picks, the grading cron) — all via service role. Drop the
-- owner write policies so the browser cannot forge or edit graded records.
drop policy if exists "picks_update_self" on public.picks;
drop policy if exists "picks_insert_self" on public.picks;

-- pick_legs: "pick_legs_write_self" was FOR ALL (insert/update/delete) gated
-- only on pick ownership — same forgery surface at the leg level. Drop it.
-- SELECT is preserved by pick_legs_read_public_or_own (migration 0010).
drop policy if exists "pick_legs_write_self" on public.pick_legs;

-- Defense-in-depth: with RLS enabled and no INSERT/UPDATE/DELETE policy, the
-- anon and authenticated roles are default-denied on writes to these tables.
-- (The service-role key used by the backend bypasses RLS, so backend writes
-- continue to work.) No GRANT changes needed — RLS is the gate.
