-- Direct messages between two users. All access stays behind server routes
-- using the service-role client; browser roles receive no direct table
-- privileges. Participant checks are enforced in the service layer.

create table if not exists public.message_conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  last_message_preview text not null default ''
    check (char_length(last_message_preview) <= 500)
);

create table if not exists public.message_conversation_participants (
  conversation_id uuid not null references public.message_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  unread_count int not null default 0 check (unread_count >= 0),
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists message_conversation_participants_user_idx
  on public.message_conversation_participants(user_id);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.message_conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists direct_messages_conversation_created_at_idx
  on public.direct_messages(conversation_id, created_at desc);

alter table public.message_conversations enable row level security;
alter table public.message_conversation_participants enable row level security;
alter table public.direct_messages enable row level security;

revoke all on table public.message_conversations from anon, authenticated;
revoke all on table public.message_conversation_participants from anon, authenticated;
revoke all on table public.direct_messages from anon, authenticated;

comment on table public.message_conversations is
  'Direct-message conversations between exactly two users. Server-enforced participant access only.';
comment on table public.direct_messages is
  'Individual direct messages. Read/write is gated by conversation participant checks in the service layer, not client RLS.';

-- Atomic unread-count bump for every participant except the sender, avoiding
-- a read-then-write race when two messages land close together.
create function public.increment_message_unread_count(
  p_conversation_id uuid,
  p_exclude_user_id uuid
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.message_conversation_participants
  set unread_count = unread_count + 1
  where conversation_id = p_conversation_id
    and user_id <> p_exclude_user_id;
$$;

revoke all on function public.increment_message_unread_count(uuid, uuid) from anon, authenticated;
grant execute on function public.increment_message_unread_count(uuid, uuid) to service_role;
