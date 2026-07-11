-- =========================================================
-- 0024_following_hub_social.sql
-- Status notes (MSN/Discord-style), 24h stories, direct messages.
-- Idempotent and safe to re-run.
-- =========================================================

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
