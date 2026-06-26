-- VouchEdge Beta Schema
-- Target: Supabase Postgres 15+
-- Run: supabase db push  (after `supabase link --project-ref <ref>`)
--
-- Design notes:
--  * All timestamp columns are timestamptz UTC.
--  * RLS is enabled on every user-owned table. Policies use auth.uid().
--  * Stripe customer/sub data is mirrored here from webhooks (not source of truth —
--    Stripe is source of truth; this is a cache for fast entitlement checks).
--  * trust_scores are persisted per (subject_type, subject_id, scope) so we can
--    rank cappers AND users from the same table.

-- =========================================================
-- Extensions
-- =========================================================
create extension if not exists "pgcrypto";

-- =========================================================
-- enums
-- =========================================================
create type subscription_tier as enum ('free', 'gold', 'seller_pro');
create type pick_status      as enum ('pending', 'won', 'lost', 'push', 'void', 'graded_error');
create type pick_leg_type    as enum ('single', 'parlay');
create type subject_type     as enum ('user', 'capper');
create type trust_scope      as enum ('overall', 'mlb', 'nfl', 'nba'); -- future-proof
create type beta_state       as enum ('waitlist', 'invited', 'active', 'churned');

-- =========================================================
-- profiles (1:1 with auth.users)
-- =========================================================
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text unique not null check (char_length(username) between 3 and 24),
  display_name    text not null default '',
  avatar_url      text,
  bio             text default '' not null,
  tier            subscription_tier not null default 'free',
  -- Stripe linkage
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  -- Trust snapshot (denormalized for fast UI reads; updated by trigger)
  trust_score     numeric(4,2) not null default 50.00 check (trust_score between 0 and 100),
  total_picks     int not null default 0,
  won_picks       int not null default 0,
  lost_picks      int not null default 0,
  pushed_picks    int not null default 0,
  net_units       numeric(8,2) not null default 0.00,
  -- Legal gates
  age_confirmed_at     timestamptz,
  jurisdiction_confirmed_at timestamptz,
  jurisdiction         text,  -- ISO-3166-2 (e.g. "US-NV")
  -- Moderation
  is_banned       boolean not null default false,
  is_staff        boolean not null default false,
  -- GDPR: account deletion scheduling (set by POST /api/privacy/delete-account)
  deletion_scheduled_at timestamptz,
  -- Demo flag — true for any account that is *not* a real user (seed cappers, etc.)
  is_demo         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index profiles_tier_idx           on public.profiles(tier);
create index profiles_stripe_customer_idx on public.profiles(stripe_customer_id);
create index profiles_username_lower_idx on public.profiles(lower(username));

-- =========================================================
-- beta_signups (the waitlist before auth exists)
-- =========================================================
create table public.beta_signups (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  state       beta_state not null default 'waitlist',
  invite_code text unique,
  invited_at  timestamptz,
  activated_user_id uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index beta_signups_state_idx on public.beta_signups(state);

-- =========================================================
-- cappers (server-defined personas — professor, hr-hunter, etc.)
-- =========================================================
create table public.cappers (
  id            text primary key,             -- 'professor', 'hr-hunter', ...
  display_name  text not null,
  tagline       text not null default '',
  persona       text not null default '',
  is_demo       boolean not null default true, -- cappers are agents, not real users
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- =========================================================
-- picks (the heart of the app)
-- =========================================================
create table public.picks (
  id            uuid primary key default gen_random_uuid(),
  -- Authorship: a pick is owned by EITHER a profile (user) OR a capper (agent)
  user_id       uuid references public.profiles(id) on delete cascade,
  capper_id     text references public.cappers(id) on delete cascade,
  -- Constraint: exactly one author
  check ( (user_id is not null and capper_id is null)
       or (user_id is null and capper_id is not null) ),
  -- Content
  leg_type      pick_leg_type not null default 'single',
  sport         text not null default 'mlb',
  event_id      text,                          -- statsapi gamePk
  market        text not null,                 -- 'hr' | 'rbi' | 'run' | 'parlay' ...
  selection     text not null,                 -- free-text description
  odds_decimal  numeric(6,3),
  stake_units   numeric(6,2),
  confidence    numeric(4,2) check (confidence between 0 and 100),
  -- Judge panel snapshot at creation time
  judge_quality numeric(4,2),
  judge_risk    numeric(4,2),
  judge_bias    numeric(4,2),
  judge_trust   numeric(4,2),
  judge_verdict text,                          -- 'back' | 'avoid' | 'caution'
  -- Lifecycle
  status        pick_status not null default 'pending',
  graded_at     timestamptz,
  settled_units numeric(8,2),
  -- Notes
  explanation   text,                          -- Gemini pick explanation
  learning_note text,                          -- post-grade learning note
  -- Provenance
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index picks_user_id_created_idx    on public.picks(user_id, created_at desc);
create index picks_capper_id_created_idx  on public.picks(capper_id, created_at desc);
create index picks_status_idx             on public.picks(status) where status = 'pending';
create index picks_event_id_idx           on public.picks(event_id);

-- =========================================================
-- pick_legs (for parlays)
-- =========================================================
create table public.pick_legs (
  id            uuid primary key default gen_random_uuid(),
  pick_id       uuid not null references public.picks(id) on delete cascade,
  leg_index     int not null check (leg_index >= 0),
  event_id      text,
  market        text not null,
  selection     text not null,
  odds_decimal  numeric(6,3),
  status        pick_status not null default 'pending',
  graded_at     timestamptz,
  unique (pick_id, leg_index)
);

create index pick_legs_pick_id_idx on public.pick_legs(pick_id);

-- =========================================================
-- trust_scores (per-subject, per-scope)
-- =========================================================
create table public.trust_scores (
  subject_type   subject_type not null,
  subject_id     text not null,                 -- profiles.id::text or cappers.id
  scope          trust_scope  not null default 'overall',
  score          numeric(4,2) not null default 50.00 check (score between 0 and 100),
  total_picks    int not null default 0,
  won_picks      int not null default 0,
  lost_picks     int not null default 0,
  pushed_picks   int not null default 0,
  net_units      numeric(8,2) not null default 0.00,
  -- Rolling 30-day snapshots for decay
  window_start   timestamptz not null default now(),
  window_end     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  primary key (subject_type, subject_id, scope)
);

create index trust_scores_score_idx on public.trust_scores(scope, score desc);

-- =========================================================
-- subscriptions (Stripe mirror — for fast tier lookups)
-- =========================================================
create table public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  profile_id               uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id       text not null,
  stripe_subscription_id   text unique not null,
  stripe_price_id          text not null,
  tier                     subscription_tier not null,
  status                   text not null,        -- 'active' | 'past_due' | 'canceled' | ...
  current_period_start     timestamptz not null,
  current_period_end       timestamptz not null,
  cancel_at_period_end     boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index subscriptions_profile_idx         on public.subscriptions(profile_id);
create index subscriptions_status_idx           on public.subscriptions(status);

-- =========================================================
-- posts (the social feed — replaces localStorage posts)
-- =========================================================
create table public.posts (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references public.profiles(id) on delete cascade,
  body          text not null default '',
  pick_id       uuid references public.picks(id) on delete set null,
  -- Engagement
  view_count    int not null default 0,
  -- Demo flag (any seed content)
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now()
);

create index posts_created_idx on public.posts(created_at desc);

create table public.post_likes (
  post_id     uuid not null references public.posts(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, profile_id)
);

create table public.post_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index post_comments_post_id_idx on public.post_comments(post_id, created_at);

-- =========================================================
-- follows (user-to-user and user-to-capper)
-- =========================================================
create table public.follows (
  follower_id   uuid not null references public.profiles(id) on delete cascade,
  -- Follows a profile OR a capper
  following_profile_id uuid references public.profiles(id) on delete cascade,
  following_capper_id  text references public.cappers(id) on delete cascade,
  check ( (following_profile_id is not null and following_capper_id is null)
       or (following_profile_id is null and following_capper_id is not null) ),
  created_at    timestamptz not null default now(),
  primary key (follower_id, following_profile_id, following_capper_id)
);

create index follows_follower_idx     on public.follows(follower_id);
create index follows_following_profile_idx on public.follows(following_profile_id);
create index follows_following_capper_idx  on public.follows(following_capper_id);

-- =========================================================
-- Triggers
-- =========================================================

-- Auto-create a profile row when a new auth.user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username',
             'user_' || substring(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Bump updated_at on every profile write
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger picks_touch
  before update on public.picks
  for each row execute function public.touch_updated_at();

create trigger subscriptions_touch
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();

-- =========================================================
-- Row-Level Security
-- =========================================================
alter table public.profiles        enable row level security;
alter table public.beta_signups    enable row level security;
alter table public.cappers         enable row level security;
alter table public.picks           enable row level security;
alter table public.pick_legs       enable row level security;
alter table public.trust_scores    enable row level security;
alter table public.subscriptions   enable row level security;
alter table public.posts           enable row level security;
alter table public.post_likes      enable row level security;
alter table public.post_comments   enable row level security;
alter table public.follows         enable row level security;

-- profiles: anyone can read public fields, only owner can write
create policy "profiles_read_public"
  on public.profiles for select
  using (true);

create policy "profiles_update_self"
  on public.profiles for update
  using (auth.uid() = id);

-- cappers: world-readable, only staff can write (server-side service role bypasses RLS)
create policy "cappers_read_all"
  on public.cappers for select
  using (true);

-- picks: world-readable (social feed needs this), only author can insert/update
create policy "picks_read_all"
  on public.picks for select
  using (true);

create policy "picks_insert_self"
  on public.picks for insert
  with check (auth.uid() = user_id);

create policy "picks_update_self"
  on public.picks for update
  using (auth.uid() = user_id);

-- pick_legs: world-readable, writable via pick ownership (RLS cascade)
create policy "pick_legs_read_all"
  on public.pick_legs for select
  using (true);

create policy "pick_legs_write_self"
  on public.pick_legs for all
  using (
    exists (
      select 1 from public.picks p
      where p.id = pick_id and p.user_id = auth.uid()
    )
  );

-- posts: world-readable, only author writes
create policy "posts_read_all"
  on public.posts for select using (true);

create policy "posts_insert_self"
  on public.posts for insert
  with check (auth.uid() = author_id);

create policy "posts_update_self"
  on public.posts for update
  using (auth.uid() = author_id);

create policy "posts_delete_self"
  on public.posts for delete
  using (auth.uid() = author_id);

-- post_likes: world-readable, only self can insert/delete own likes
create policy "likes_read_all"
  on public.post_likes for select using (true);

create policy "likes_insert_self"
  on public.post_likes for insert
  with check (auth.uid() = profile_id);

create policy "likes_delete_self"
  on public.post_likes for delete
  using (auth.uid() = profile_id);

-- post_comments
create policy "comments_read_all"
  on public.post_comments for select using (true);

create policy "comments_insert_self"
  on public.post_comments for insert
  with check (auth.uid() = author_id);

create policy "comments_delete_self"
  on public.post_comments for delete
  using (auth.uid() = author_id);

-- follows
create policy "follows_read_all"
  on public.follows for select using (true);

create policy "follows_insert_self"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "follows_delete_self"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- subscriptions: only the owner can read their own; writes come via service role
create policy "subscriptions_read_self"
  on public.subscriptions for select
  using (auth.uid() = profile_id);

-- trust_scores: world-readable
create policy "trust_read_all"
  on public.trust_scores for select using (true);

-- beta_signups: only staff (service role bypasses) can read; users insert their own email
create policy "beta_insert_self"
  on public.beta_signups for insert
  with check (true);  -- public waitlist signup

-- =========================================================
-- Seed cappers (DEMO cappers — flagged as is_demo = true)
-- =========================================================
insert into public.cappers (id, display_name, tagline, persona, is_demo) values
  ('professor',       'The Professor',       'Data-driven, no hype',          'Methodical, cites splits, never uses the word lock.', true),
  ('hr-hunter',       'HR Hunter',           'Home run edges only',           'Patient, only posts when hrEdge >= 0.15.', true),
  ('sharp-syndicate', 'Sharp Syndicate',     'Line movement first',           'Watches steam and reverse line movement.', true),
  ('sneaky-dog',      'Sneaky Dog',          'Underdogs or pass',             'Only +150 or longer.', true),
  ('parlay-demon',    'Parlay Demon',        'Same-game parlays',             'High variance, small stakes.', true)
on conflict (id) do nothing;

-- =========================================================
-- Initial trust score rows for cappers (zeroed — graded picks will roll them up)
-- =========================================================
insert into public.trust_scores (subject_type, subject_id, scope, score)
select 'capper', id, 'overall', 50.00 from public.cappers
on conflict (subject_type, subject_id, scope) do nothing;

-- =========================================================
-- daily_quotas — per-user, per-day, per-feature counter
-- Used by server/middleware/entitlements.ts to enforce free-tier limits
-- =========================================================
create table public.daily_quotas (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  quota_key  text not null,                      -- 'picks_per_day' | 'ai_explain' | 'ai_daily_report' | ...
  day        date not null,
  count      int not null default 0,
  primary key (profile_id, quota_key, day)
);

create index daily_quotas_day_idx on public.daily_quotas(day);

alter table public.daily_quotas enable row level security;

-- Users can read their own quota counts (for displaying "5 of 10 remaining")
create policy "quotas_read_self"
  on public.daily_quotas for select
  using (auth.uid() = profile_id);

-- Writes come via service role (the server increments after a successful op)
-- No insert/update/delete policy for client → RLS denies by default

-- =========================================================
-- RPC: increment_quota — atomic counter increment
-- Used by server/middleware/entitlements.ts after a quota-gated op succeeds
-- =========================================================
create or replace function public.increment_quota(
  p_profile_id uuid,
  p_quota_key  text,
  p_day        date
) returns void as $$
begin
  update public.daily_quotas
    set count = count + 1
    where profile_id = p_profile_id
      and quota_key = p_quota_key
      and day = p_day;

  -- If no row exists, the earlier upsert in entitlements.ts created one
  -- with count=1. This RPC handles the case where the upsert succeeded
  -- but we still need to increment (race-condition safety).
  if not found then
    insert into public.daily_quotas (profile_id, quota_key, day, count)
    values (p_profile_id, p_quota_key, p_day, 1)
    on conflict (profile_id, quota_key, day) do nothing;
  end if;
end;
$$ language plpgsql security definer;

-- =========================================================
-- RPC: increment_post_view — atomic view counter
-- Used by server/routes/postRoutes.ts on POST /api/posts/:id/view
-- =========================================================
create or replace function public.increment_post_view(p_post_id uuid)
returns void as $$
begin
  update public.posts
    set view_count = view_count + 1
    where id = p_post_id;
end;
$$ language plpgsql security definer;

-- =========================================================
-- RPC: get_user_quota — convenience function for clients
-- Returns the user's current count for a quota key today
-- =========================================================
create or replace function public.get_user_quota(
  p_profile_id uuid,
  p_quota_key  text
) returns int as $$
declare
  v_count int;
begin
  select count into v_count
    from public.daily_quotas
    where profile_id = p_profile_id
      and quota_key = p_quota_key
      and day = current_date;

  return coalesce(v_count, 0);
end;
$$ language plpgsql security definer;

-- =========================================================
-- RPC: anonymize_user_picks — used during account deletion
-- Keeps the pick record (for trust-score integrity) but removes
-- the user_id link and marks the pick as anonymous
-- =========================================================
create or replace function public.anonymize_user_picks(p_user_id uuid)
returns void as $$
begin
  update public.picks
    set user_id = null,
        learning_note = coalesce(learning_note, '') || ' [author account deleted]'
    where user_id = p_user_id;

  -- Update trust_scores for the (now-deleted) user — set to neutral
  delete from public.trust_scores
    where subject_type = 'user' and subject_id = p_user_id::text;
end;
$$ language plpgsql security definer;

-- =========================================================
-- GDPR: DSAR (Data Subject Access Request) export view
-- Returns all personal data for a user as a single JSON document
-- =========================================================
create or replace function public.export_user_data(p_user_id uuid)
returns json as $$
declare
  v_result json;
begin
  select json_build_object(
    'profile', (select to_json(p) from public.profiles p where id = p_user_id),
    'picks', (select coalesce(json_agg(t), '[]'::json) from (
      select * from public.picks where user_id = p_user_id order by created_at
    ) t),
    'posts', (select coalesce(json_agg(t), '[]'::json) from (
      select * from public.posts where author_id = p_user_id order by created_at
    ) t),
    'comments', (select coalesce(json_agg(t), '[]'::json) from (
      select * from public.post_comments where author_id = p_user_id order by created_at
    ) t),
    'likes', (select coalesce(json_agg(t), '[]'::json) from (
      select post_id, created_at from public.post_likes where profile_id = p_user_id order by created_at
    ) t),
    'follows', (select coalesce(json_agg(t), '[]'::json) from (
      select following_profile_id, following_capper_id, created_at
      from public.follows where follower_id = p_user_id order by created_at
    ) t),
    'followers', (select coalesce(json_agg(t), '[]'::json) from (
      select follower_id, created_at from public.follows
      where following_profile_id = p_user_id order by created_at
    ) t),
    'subscriptions', (select coalesce(json_agg(t), '[]'::json) from (
      select tier, status, current_period_start, current_period_end, created_at, updated_at
      from public.subscriptions where profile_id = p_user_id order by created_at
    ) t),
    'beta_signup', (select to_json(b) from public.beta_signups b
      where activated_user_id = p_user_id),
    'exported_at', now()
  ) into v_result;

  return v_result;
end;
$$ language plpgsql security definer;

