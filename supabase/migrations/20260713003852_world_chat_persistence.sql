-- Durable World Chat. All access stays behind server routes using the
-- service-role client; browser roles receive no direct table privileges.

create table if not exists public.world_chat_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status_line text not null default 'Researching edges'
    check (char_length(status_line) <= 80),
  accent_color text not null default 'cyan'
    check (char_length(accent_color) <= 24),
  tag text
    check (char_length(tag) <= 32),
  updated_at timestamptz not null default now()
);

create table if not exists public.world_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 500),
  accent_color text not null default 'cyan'
    check (char_length(accent_color) <= 24),
  status_line text not null default 'Researching edges'
    check (char_length(status_line) <= 80),
  border_id text
    check (char_length(border_id) <= 64),
  created_at timestamptz not null default now()
);

create index if not exists world_chat_messages_created_at_idx
  on public.world_chat_messages(created_at desc);

create index if not exists world_chat_messages_user_created_at_idx
  on public.world_chat_messages(user_id, created_at desc);

alter table public.world_chat_profiles enable row level security;
alter table public.world_chat_messages enable row level security;

revoke all on table public.world_chat_profiles from anon, authenticated;
revoke all on table public.world_chat_messages from anon, authenticated;
