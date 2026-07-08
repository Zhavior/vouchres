-- Idempotent live sports events for parlay grading.
-- This prevents the same MLB HR/play event from grading the same leg twice.

create table if not exists public.parlay_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null,
  sport text not null default 'mlb',
  game_pk text not null,
  player_id text,
  player_name text,
  event_type text not null,
  inning integer,
  description text,
  occurred_at timestamptz,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists parlay_events_event_key_uidx
  on public.parlay_events (event_key);

create index if not exists parlay_events_game_player_idx
  on public.parlay_events (game_pk, player_id, event_type);

alter table public.parlay_events enable row level security;

drop policy if exists "service role manages parlay events" on public.parlay_events;

create policy "service role manages parlay events"
  on public.parlay_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
