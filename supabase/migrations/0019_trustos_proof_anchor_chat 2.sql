-- TrustOS L3: immutable proof hash at lock time + subscriber club chat.

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
