create table if not exists public.player_vouches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sport text not null default 'mlb',
  player_id text not null,
  player_name text not null,
  team text,
  opponent text,
  game_pk text,
  context_date date not null,
  source_page text,
  created_at timestamptz not null default now()
);

create unique index if not exists player_vouches_unique_user_player_day
  on public.player_vouches (user_id, sport, player_id, context_date);

create index if not exists player_vouches_date_sport_idx
  on public.player_vouches (context_date, sport, created_at desc);

create index if not exists player_vouches_player_day_idx
  on public.player_vouches (player_id, context_date);

alter table public.player_vouches enable row level security;

drop policy if exists "player_vouches_read" on public.player_vouches;
create policy "player_vouches_read"
  on public.player_vouches
  for select
  to authenticated
  using (true);

drop policy if exists "player_vouches_insert_self" on public.player_vouches;
create policy "player_vouches_insert_self"
  on public.player_vouches
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "player_vouches_delete_self" on public.player_vouches;
create policy "player_vouches_delete_self"
  on public.player_vouches
  for delete
  to authenticated
  using (auth.uid() = user_id);
