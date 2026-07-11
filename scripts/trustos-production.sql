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

-- 0021: trust ledger commit window (private wins → auto-lock)
alter table public.picks
  add column if not exists committed_at timestamptz;

alter table public.picks
  add column if not exists trust_lock_at timestamptz;

create index if not exists picks_trust_lock_at_idx
  on public.picks(trust_lock_at)
  where trust_lock_at is not null and locked_at is null;

do $$
begin
  alter type public.pick_visibility add value if not exists 'subscriber';
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- 0022: Social graph (follow / tail / subscribe + parlay tails)
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

-- 0024: Following hub — status notes, stories, direct messages
create table if not exists public.user_status_notes (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 120),
  emoji text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_status_notes_expires_idx
  on public.user_status_notes(expires_at desc);

create table if not exists public.user_stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'text' check (kind in ('text', 'image')),
  body text,
  media_url text,
  background text not null default '#0f172a',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists user_stories_user_expires_idx
  on public.user_stories(user_id, expires_at desc);

create table if not exists public.story_views (
  story_id uuid not null references public.user_stories(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

create table if not exists public.dm_conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dm_participants (
  conversation_id uuid not null references public.dm_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists dm_participants_user_idx
  on public.dm_participants(user_id, joined_at desc);

create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.dm_conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists dm_messages_conversation_idx
  on public.dm_messages(conversation_id, created_at desc);

alter table public.user_status_notes enable row level security;
alter table public.user_stories enable row level security;
alter table public.story_views enable row level security;
alter table public.dm_conversations enable row level security;
alter table public.dm_participants enable row level security;
alter table public.dm_messages enable row level security;

drop policy if exists "user_status_notes_read_all" on public.user_status_notes;
create policy "user_status_notes_read_all"
  on public.user_status_notes for select using (true);

drop policy if exists "user_stories_read_all" on public.user_stories;
create policy "user_stories_read_all"
  on public.user_stories for select using (true);

drop policy if exists "story_views_read_all" on public.story_views;
create policy "story_views_read_all"
  on public.story_views for select using (true);

drop policy if exists "dm_participants_read_own" on public.dm_participants;
create policy "dm_participants_read_own"
  on public.dm_participants for select using (auth.uid() = user_id);

drop policy if exists "dm_messages_read_participant" on public.dm_messages;
create policy "dm_messages_read_participant"
  on public.dm_messages for select
  using (
    exists (
      select 1 from public.dm_participants p
      where p.conversation_id = dm_messages.conversation_id
        and p.user_id = auth.uid()
    )
  );

-- 0025: Lock reason (trust ledger vs feed share)
alter table public.picks
  add column if not exists lock_reason text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'picks_lock_reason_check'
  ) then
    alter table public.picks
      add constraint picks_lock_reason_check
      check (lock_reason is null or lock_reason in ('trust_ledger', 'feed_share'));
  end if;
end $$;

update public.picks
set lock_reason = 'trust_ledger'
where locked_at is not null
  and committed_at is not null
  and lock_reason is null;

update public.picks
set lock_reason = 'feed_share'
where locked_at is not null
  and lock_reason is null;
