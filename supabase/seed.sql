-- VouchEdge seed data — for development and testing only.
-- DO NOT run this against your production database.
--
-- Usage:
--   supabase db seed  (runs this file after migrations)
--
-- Or manually:
--   psql $DATABASE_URL < supabase/seed.sql
--
-- What this seeds:
--   - 3 demo user profiles (clearly marked is_demo = true)
--   - 6 demo posts (2 from each demo user, mix of text + pick-attached)
--   - 5 demo capper picks (one per capper from schema.sql seeds)
--   - 3 graded picks (so the leaderboard isn't completely empty in dev)
--   - Some likes + comments on the demo posts
--
-- All seeded data has is_demo = true so production can filter it out
-- or wipe it with: DELETE FROM <table> WHERE is_demo = true;

-- =========================================================
-- Demo user profiles
-- =========================================================
-- Note: these profiles don't have corresponding auth.users rows
-- (auth.users can't be seeded via SQL easily). For local dev, create
-- real auth users via the Supabase dashboard or CLI, then update
-- these profile rows to match the auth.users IDs.
--
-- For testing without auth, use the service-role key to act as these users.

INSERT INTO public.profiles (id, username, display_name, bio, tier, is_demo, age_confirmed_at, jurisdiction_confirmed_at, jurisdiction)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'demo_alice', 'Alice (Demo)', 'Demo user for development. Not a real person.', 'free', true, now(), now(), 'US-NV'),
  ('00000000-0000-0000-0000-000000000002', 'demo_bob', 'Bob (Demo)', 'Demo user for development. Not a real person.', 'gold', true, now(), now(), 'US-NV'),
  ('00000000-0000-0000-0000-000000000003', 'demo_carol', 'Carol (Demo)', 'Demo user for development. Not a real person.', 'free', true, now(), now(), 'US-NJ')
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- Demo capper picks (one per capper, with realistic data)
-- =========================================================
INSERT INTO public.picks (
  capper_id, leg_type, sport, event_id, market, selection,
  odds_decimal, stake_units, confidence,
  judge_quality, judge_risk, judge_bias, judge_trust, judge_verdict,
  explanation, is_demo, status
) VALUES
  (
    'professor', 'single', 'mlb', '745812',
    'Total bases', 'Aaron Judge total bases lean vs Reid Detmers',
    1.85, 1.0, 78.0,
    82.0, 65.0, 88.0, 78.0, 'back',
    'Judge has .348 ISO vs LHP last 30 days. Detmers allowing 1.2 HR/9. Lower-variance angle on a strong HR spot.',
    true, 'pending'
  ),
  (
    'hr-hunter', 'single', 'mlb', '745812',
    'Anytime HR', 'Aaron Judge anytime HR vs Reid Detmers',
    3.20, 1.0, 71.0,
    78.0, 58.0, 82.0, 72.0, 'back',
    'Top of the HR target board. Judge 7 HR in last 15 games vs LHP.',
    true, 'pending'
  ),
  (
    'sharp-syndicate', 'single', 'mlb', '745811',
    'Total bases (value)', 'Yankees total bases — market under-pricing vs Patrick Sandoval',
    2.10, 1.0, 62.0,
    70.0, 60.0, 75.0, 65.0, 'caution',
    'Line moved 8% toward under. Sharp money on the over but variance is real.',
    true, 'pending'
  ),
  (
    'sneaky-dog', 'single', 'mlb', '745815',
    'Anytime HR (sneaky)', 'Rays sneaky HR vs Cole Ragans',
    4.50, 0.5, 44.0,
    55.0, 35.0, 60.0, 48.0, 'caution',
    'Ragans K rate high but Rays stack has been hot. Long-shot play.',
    true, 'pending'
  ),
  (
    'parlay-demon', 'parlay', 'mlb', '745812',
    '2-leg parlay', 'Aaron Judge HR | Yankees over 3.5 runs',
    6.50, 0.5, 58.0,
    72.0, 45.0, 70.0, 60.0, 'caution',
    'Correlated parlay — if Judge goes deep, runs likely cash too. High variance, small stake.',
    true, 'pending'
  )
ON CONFLICT (id) DO NOTHING;

-- Parlay legs for the parlay-demon pick above
-- (assumes the pick ID is deterministic; in practice, query for it)
INSERT INTO public.pick_legs (pick_id, leg_index, event_id, market, selection, odds_decimal, status)
SELECT id, 0, '745812', 'hr', 'Aaron Judge HR', 3.20, 'pending'
FROM public.picks WHERE capper_id = 'parlay-demon' AND market = '2-leg parlay' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.pick_legs (pick_id, leg_index, event_id, market, selection, odds_decimal, status)
SELECT id, 1, '745812', 'run', 'Yankees over 3.5 runs', 2.03, 'pending'
FROM public.picks WHERE capper_id = 'parlay-demon' AND market = '2-leg parlay' LIMIT 1
ON CONFLICT DO NOTHING;

-- =========================================================
-- Graded demo picks (so leaderboard shows something in dev)
-- =========================================================
INSERT INTO public.picks (
  capper_id, leg_type, sport, event_id, market, selection,
  odds_decimal, stake_units, confidence,
  judge_quality, judge_risk, judge_bias, judge_trust, judge_verdict,
  explanation, is_demo, status, graded_at, settled_units, learning_note
) VALUES
  -- Professor: 2 wins, 1 loss
  (
    'professor', 'single', 'mlb', '745700', 'Total bases', 'Mike Trout total bases vs LHP',
    1.90, 1.0, 75.0, 80.0, 60.0, 85.0, 75.0, 'back',
    'Trout .380 OBP vs LHP. Lean under-priced.', true, 'won', now() - interval '5 days', 0.90,
    'Won at 1.90 odds.'
  ),
  (
    'professor', 'single', 'mlb', '745690', 'Total bases', 'Yordan Alvarez total bases',
    1.75, 1.0, 72.0, 78.0, 58.0, 82.0, 73.0, 'back',
    'Alvarez power spike last 10 games.', true, 'won', now() - interval '4 days', 0.75,
    'Won at 1.75 odds.'
  ),
  (
    'professor', 'single', 'mlb', '745680', 'Total bases', 'Mookie Betts total bases',
    1.85, 1.0, 70.0, 75.0, 55.0, 80.0, 70.0, 'caution',
    'Betts slumping but matchup favorable.', true, 'lost', now() - interval '3 days', -1.00,
    'Lost at 1.85 odds.'
  ),
  -- HR Hunter: 1 win, 1 loss
  (
    'hr-hunter', 'single', 'mlb', '745700', 'Anytime HR', 'Pete Alonso HR',
    3.40, 1.0, 70.0, 75.0, 55.0, 80.0, 70.0, 'back',
    'Alonso 3 HR in last 7 games.', true, 'won', now() - interval '5 days', 2.40,
    'Won at 3.40 odds.'
  ),
  (
    'hr-hunter', 'single', 'mlb', '745690', 'Anytime HR', 'Kyle Schwarber HR',
    3.10, 1.0, 68.0, 72.0, 52.0, 78.0, 68.0, 'back',
    'Schwarber high variance.', true, 'lost', now() - interval '4 days', -1.00,
    'Lost at 3.10 odds.'
  )
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- Update trust scores based on graded picks above
-- =========================================================
INSERT INTO public.trust_scores (subject_type, subject_id, scope, score, total_picks, won_picks, lost_picks, pushed_picks, net_units, window_start, window_end)
SELECT
  'capper',
  capper_id,
  'overall',
  -- Compute score: win% weighted + ROI weighted, dampened for small samples
  CASE
    WHEN COUNT(*) FILTER (WHERE status IN ('won','lost','push')) >= 20 THEN
      -- Full weight
      50 + 30 * (COUNT(*) FILTER (WHERE status = 'won')::float / NULLIF(COUNT(*) FILTER (WHERE status IN ('won','lost','push')), 0) - 0.5)
        + 20 * LEAST(1, GREATEST(-1, SUM(settled_units) / NULLIF(COUNT(*) FILTER (WHERE status IN ('won','lost','push')), 0) * 5))
    ELSE
      -- Damp toward 50
      50 + 0.05 * (
        30 * (COUNT(*) FILTER (WHERE status = 'won')::float / NULLIF(COUNT(*) FILTER (WHERE status IN ('won','lost','push')), 0) - 0.5)
        + 20 * LEAST(1, GREATEST(-1, SUM(settled_units) / NULLIF(COUNT(*) FILTER (WHERE status IN ('won','lost','push')), 0) * 5))
      )
  END,
  COUNT(*) FILTER (WHERE status IN ('won','lost','push')),
  COUNT(*) FILTER (WHERE status = 'won'),
  COUNT(*) FILTER (WHERE status = 'lost'),
  COUNT(*) FILTER (WHERE status = 'push'),
  COALESCE(SUM(settled_units), 0),
  now() - interval '30 days',
  now()
FROM public.picks
WHERE capper_id IS NOT NULL AND status IN ('won','lost','push')
GROUP BY capper_id
ON CONFLICT (subject_type, subject_id, scope) DO UPDATE SET
  score = EXCLUDED.score,
  total_picks = EXCLUDED.total_picks,
  won_picks = EXCLUDED.won_picks,
  lost_picks = EXCLUDED.lost_picks,
  pushed_picks = EXCLUDED.pushed_picks,
  net_units = EXCLUDED.net_units,
  window_start = EXCLUDED.window_start,
  window_end = EXCLUDED.window_end,
  updated_at = now();

-- =========================================================
-- Demo posts (for the home feed)
-- =========================================================
INSERT INTO public.posts (author_id, body, is_demo, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Just posted my first pick on VouchEdge. Loving the judge panel feedback — the bias check caught me leaning too hard on a hunch.', true, now() - interval '2 hours'),
  ('00000000-0000-0000-0000-000000000001', 'Anyone else tracking the Yankees/Rays series? Judge has been unreal vs LHP this month.', true, now() - interval '6 hours'),
  ('00000000-0000-0000-0000-000000000002', 'Upgraded to Gold — the unlimited AI explanations are a game-changer for research.', true, now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000002', 'Hot take: the parlay demon agent is underrated. Yeah high variance, but the correlation warnings actually help me size my stakes.', true, now() - interval '1 day 4 hours'),
  ('00000000-0000-0000-0000-000000000003', 'New to MLB player props. The HR edge engine is super helpful — feels like having a research assistant.', true, now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000003', 'Reminder: this is research, not betting advice. Manage your bankroll, folks.', true, now() - interval '2 days 2 hours')
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- Demo likes + comments
-- =========================================================
INSERT INTO public.post_likes (post_id, profile_id)
SELECT p.id, '00000000-0000-0000-0000-000000000002'
FROM public.posts p
WHERE p.author_id = '00000000-0000-0000-0000-000000000001' AND p.body LIKE 'Just posted%'
ON CONFLICT DO NOTHING;

INSERT INTO public.post_likes (post_id, profile_id)
SELECT p.id, '00000000-0000-0000-0000-000000000003'
FROM public.posts p
WHERE p.author_id = '00000000-0000-0000-0000-000000000001' AND p.body LIKE 'Just posted%'
ON CONFLICT DO NOTHING;

INSERT INTO public.post_comments (post_id, author_id, body)
SELECT p.id, '00000000-0000-0000-0000-000000000002', 'Welcome! The judge panel is what sold me on this app.'
FROM public.posts p
WHERE p.author_id = '00000000-0000-0000-0000-000000000001' AND p.body LIKE 'Just posted%'
ON CONFLICT DO NOTHING;

INSERT INTO public.post_comments (post_id, author_id, body)
SELECT p.id, '00000000-0000-0000-0000-000000000001', '100%. The bias judge has saved me from a few bad plays.'
FROM public.posts p
WHERE p.author_id = '00000000-0000-0000-0000-000000000003' AND p.body LIKE 'Reminder:%'
ON CONFLICT DO NOTHING;

-- =========================================================
-- Demo follows (so the feed has content for the demo users)
-- =========================================================
INSERT INTO public.follows (follower_id, following_capper_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM public.cappers
ON CONFLICT DO NOTHING;

INSERT INTO public.follows (follower_id, following_capper_id)
SELECT '00000000-0000-0000-0000-000000000002', id FROM public.cappers
ON CONFLICT DO NOTHING;

INSERT INTO public.follows (follower_id, following_capper_id)
SELECT '00000000-0000-0000-0000-000000000003', id FROM public.cappers
WHERE id IN ('professor', 'hr-hunter')
ON CONFLICT DO NOTHING;

-- =========================================================
-- Demo beta signups (for testing the admin UI)
-- =========================================================
INSERT INTO public.beta_signups (email, state, created_at)
VALUES
  ('waitlist1@example.com', 'waitlist', now() - interval '3 days'),
  ('waitlist2@example.com', 'waitlist', now() - interval '2 days'),
  ('waitlist3@example.com', 'waitlist', now() - interval '1 day'),
  ('invited1@example.com', 'invited', now() - interval '1 day'),
  ('invited2@example.com', 'invited', now() - interval '12 hours')
ON CONFLICT (email) DO NOTHING;

-- Set invite codes for the invited ones
UPDATE public.beta_signups
SET invite_code = 'VE-TESTCODE1', invited_at = now() - interval '1 day'
WHERE email = 'invited1@example.com' AND invite_code IS NULL;

UPDATE public.beta_signups
SET invite_code = 'VE-TESTCODE2', invited_at = now() - interval '12 hours'
WHERE email = 'invited2@example.com' AND invite_code IS NULL;

-- =========================================================
-- Wipe script (run to clear all demo data)
-- =========================================================
-- DELETE FROM public.post_comments WHERE author_id LIKE '00000000-0000-0000-0000-0000000000%';
-- DELETE FROM public.post_likes WHERE profile_id LIKE '00000000-0000-0000-0000-0000000000%';
-- DELETE FROM public.posts WHERE author_id LIKE '00000000-0000-0000-0000-0000000000%';
-- DELETE FROM public.picks WHERE is_demo = true;
-- DELETE FROM public.follows WHERE follower_id LIKE '00000000-0000-0000-0000-0000000000%';
-- DELETE FROM public.profiles WHERE id LIKE '00000000-0000-0000-0000-0000000000%';
-- DELETE FROM public.beta_signups WHERE email LIKE '%@example.com';
