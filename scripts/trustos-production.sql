-- TrustOS production migration bundle (0017–0020)
-- Paste into Supabase SQL Editor: https://supabase.com/dashboard/project/vuphtbnclefwovfoqyth/sql/new
-- Idempotent; safe to re-run.

-- 0017: pick audit log
create table if not exists public.pick_audit_log (
  id          uuid primary key default gen_random_uuid(),
  pick_id     uuid not null references public.picks(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  action      text not null,
  field_changes jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists pick_audit_log_pick_id_created_idx
  on public.pick_audit_log(pick_id, created_at desc);

alter table public.pick_audit_log enable row level security;

drop policy if exists "pick_audit_log_read_own" on public.pick_audit_log;
create policy "pick_audit_log_read_own"
  on public.pick_audit_log for select
  using (auth.uid() = user_id);

drop policy if exists "pick_audit_log_insert_own" on public.pick_audit_log;
create policy "pick_audit_log_insert_own"
  on public.pick_audit_log for insert
  with check (auth.uid() = user_id);

-- 0018: locked_at on feed share
alter table public.picks
  add column if not exists locked_at timestamptz;

update public.picks p
set locked_at = sub.first_post_at
from (
  select pick_id, min(created_at) as first_post_at
  from public.posts
  where pick_id is not null
  group by pick_id
) sub
where p.id = sub.pick_id
  and p.locked_at is null;

create index if not exists picks_locked_at_idx
  on public.picks(locked_at)
  where locked_at is not null;

-- 0019: proof_hash + subscriber chat
alter table public.picks
  add column if not exists proof_hash text;

create index if not exists picks_proof_hash_idx
  on public.picks(proof_hash)
  where proof_hash is not null;

create table if not exists public.subscriber_channel_messages (
  id                uuid primary key default gen_random_uuid(),
  channel_kind      text not null check (channel_kind in ('owner', 'capper', 'profile')),
  channel_target_id text not null,
  author_id         uuid not null references public.profiles(id) on delete cascade,
  body              text not null check (char_length(body) between 1 and 2000),
  created_at        timestamptz not null default now()
);

create index if not exists subscriber_channel_messages_channel_idx
  on public.subscriber_channel_messages (channel_kind, channel_target_id, created_at desc);

alter table public.subscriber_channel_messages enable row level security;

drop policy if exists "subscriber_channel_messages_read" on public.subscriber_channel_messages;
create policy "subscriber_channel_messages_read"
  on public.subscriber_channel_messages for select
  using (true);

drop policy if exists "subscriber_channel_messages_insert_own" on public.subscriber_channel_messages;
create policy "subscriber_channel_messages_insert_own"
  on public.subscriber_channel_messages for insert
  with check (auth.uid() = author_id);

-- 0020: OpenTimestamps proof blob
alter table public.picks
  add column if not exists ots_proof text;

alter table public.picks
  add column if not exists ots_stamped_at timestamptz;

create index if not exists picks_ots_stamped_at_idx
  on public.picks(ots_stamped_at)
  where ots_stamped_at is not null;

-- 0023: Threaded post comments + comment likes
alter table public.post_comments
  add column if not exists parent_id uuid references public.post_comments(id) on delete cascade;

alter table public.post_comments
  add column if not exists reply_to_user_id uuid references public.profiles(id) on delete set null;

create index if not exists post_comments_parent_idx
  on public.post_comments(post_id, parent_id, created_at);

create table if not exists public.comment_likes (
  comment_id uuid not null references public.post_comments(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, profile_id)
);

create index if not exists comment_likes_profile_idx
  on public.comment_likes(profile_id, created_at desc);

alter table public.comment_likes enable row level security;

drop policy if exists "comment_likes_read_all" on public.comment_likes;
create policy "comment_likes_read_all"
  on public.comment_likes for select using (true);

drop policy if exists "comment_likes_insert_self" on public.comment_likes;
create policy "comment_likes_insert_self"
  on public.comment_likes for insert
  with check (auth.uid() = profile_id);

drop policy if exists "comment_likes_delete_self" on public.comment_likes;
create policy "comment_likes_delete_self"
  on public.comment_likes for delete
  using (auth.uid() = profile_id);
