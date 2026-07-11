-- =========================================================
-- 0022_social_graph.sql
-- Follow relationships (follow / tail / subscribe), per-follow
-- notification opt-in, parlay tail provenance, social alert prefs.
-- Idempotent and safe to re-run.
-- =========================================================

alter table public.follows
  add column if not exists relationship_type text not null default 'follow';

alter table public.follows
  add column if not exists notify_enabled boolean not null default true;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'follows_relationship_type_check'
  ) then
    alter table public.follows
      add constraint follows_relationship_type_check
      check (relationship_type in ('follow', 'tail', 'subscribe'));
  end if;
end $$;

create index if not exists follows_following_profile_type_idx
  on public.follows(following_profile_id, relationship_type)
  where following_profile_id is not null;

create index if not exists follows_follower_type_idx
  on public.follows(follower_id, relationship_type);

alter table public.notification_preferences
  add column if not exists follow_alerts_enabled boolean not null default true;

alter table public.notification_preferences
  add column if not exists tail_alerts_enabled boolean not null default true;

create table if not exists public.parlay_tails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_pick_id uuid not null references public.picks(id) on delete cascade,
  tailed_pick_id uuid not null references public.picks(id) on delete cascade,
  source_user_id uuid references public.profiles(id) on delete set null,
  source_post_id uuid references public.posts(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, source_pick_id)
);

create index if not exists parlay_tails_source_pick_idx
  on public.parlay_tails(source_pick_id, created_at desc);

create index if not exists parlay_tails_user_idx
  on public.parlay_tails(user_id, created_at desc);
