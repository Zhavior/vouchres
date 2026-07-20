-- Durable World Chat storage with server-owned access.

create table if not exists public.world_chat_channels (
  id text primary key,
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 200),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.world_chat_channels (id, name, description, is_default)
values (
  'world:lounge',
  'World Lounge',
  'Global community lounge for honest sports research.',
  true
)
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description,
  is_default = excluded.is_default;

create table if not exists public.world_chat_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status_line text not null default 'Researching edges' check (char_length(status_line) between 1 and 80),
  accent_color text not null default 'cyan' check (char_length(accent_color) between 1 and 24),
  tag text null check (tag is null or char_length(tag) between 1 and 32),
  updated_at timestamptz not null default now()
);

create table if not exists public.world_chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id text not null default 'world:lounge' references public.world_chat_channels(id) on delete restrict,
  author_id uuid not null references public.profiles(id) on delete cascade,
  reply_to_message_id uuid null references public.world_chat_messages(id) on delete set null,
  body text not null check (char_length(body) between 1 and 500),
  border_id text null check (border_id is null or char_length(border_id) <= 64),
  accent_color text not null default 'cyan' check (char_length(accent_color) between 1 and 24),
  status_line text not null default 'Researching edges' check (char_length(status_line) between 1 and 80),
  created_at timestamptz not null default now()
);

create table if not exists public.world_chat_custom_emojis (
  id text primary key,
  shortcode text not null unique check (char_length(shortcode) between 1 and 32),
  image_url text not null check (char_length(image_url) between 1 and 500),
  alt_text text not null check (char_length(alt_text) between 1 and 80),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.world_chat_message_reactions (
  message_id uuid not null references public.world_chat_messages(id) on delete cascade,
  emoji_id text not null references public.world_chat_custom_emojis(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (message_id, emoji_id, user_id)
);

create index if not exists world_chat_messages_created_idx
  on public.world_chat_messages(created_at desc);

create index if not exists world_chat_messages_author_idx
  on public.world_chat_messages(author_id, created_at desc);

create index if not exists world_chat_messages_channel_created_idx
  on public.world_chat_messages(channel_id, created_at desc);

create index if not exists world_chat_messages_reply_idx
  on public.world_chat_messages(reply_to_message_id);

create index if not exists world_chat_custom_emojis_sort_idx
  on public.world_chat_custom_emojis(sort_order asc, shortcode asc);

create index if not exists world_chat_message_reactions_message_idx
  on public.world_chat_message_reactions(message_id, emoji_id);

alter table public.world_chat_channels enable row level security;
alter table public.world_chat_profiles enable row level security;
alter table public.world_chat_messages enable row level security;
alter table public.world_chat_custom_emojis enable row level security;
alter table public.world_chat_message_reactions enable row level security;

revoke all on public.world_chat_channels from anon, authenticated;
revoke all on public.world_chat_profiles from anon, authenticated;
revoke all on public.world_chat_messages from anon, authenticated;
revoke all on public.world_chat_custom_emojis from anon, authenticated;
revoke all on public.world_chat_message_reactions from anon, authenticated;

grant select, insert, update, delete on public.world_chat_channels to service_role;
grant select, insert, update, delete on public.world_chat_profiles to service_role;
grant select, insert, update, delete on public.world_chat_messages to service_role;
grant select, insert, update, delete on public.world_chat_custom_emojis to service_role;
grant select, insert, update, delete on public.world_chat_message_reactions to service_role;

drop policy if exists "world_chat_channels_read_all" on public.world_chat_channels;
create policy "world_chat_channels_read_all"
  on public.world_chat_channels for select
  to authenticated
  using (true);

drop policy if exists "world_chat_profiles_select_self" on public.world_chat_profiles;
create policy "world_chat_profiles_select_self"
  on public.world_chat_profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "world_chat_profiles_insert_self" on public.world_chat_profiles;
create policy "world_chat_profiles_insert_self"
  on public.world_chat_profiles for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "world_chat_profiles_update_self" on public.world_chat_profiles;
create policy "world_chat_profiles_update_self"
  on public.world_chat_profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "world_chat_messages_read_all" on public.world_chat_messages;
create policy "world_chat_messages_read_all"
  on public.world_chat_messages for select
  to authenticated
  using (true);

drop policy if exists "world_chat_messages_insert_own" on public.world_chat_messages;
create policy "world_chat_messages_insert_own"
  on public.world_chat_messages for insert
  to authenticated
  with check ((select auth.uid()) = author_id);

drop policy if exists "world_chat_custom_emojis_read_all" on public.world_chat_custom_emojis;
create policy "world_chat_custom_emojis_read_all"
  on public.world_chat_custom_emojis for select
  to authenticated
  using (is_active = true);

drop policy if exists "world_chat_message_reactions_read_all" on public.world_chat_message_reactions;
create policy "world_chat_message_reactions_read_all"
  on public.world_chat_message_reactions for select
  to authenticated
  using (true);

drop policy if exists "world_chat_message_reactions_insert_own" on public.world_chat_message_reactions;
create policy "world_chat_message_reactions_insert_own"
  on public.world_chat_message_reactions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "world_chat_message_reactions_delete_own" on public.world_chat_message_reactions;
create policy "world_chat_message_reactions_delete_own"
  on public.world_chat_message_reactions for delete
  to authenticated
  using ((select auth.uid()) = user_id);
