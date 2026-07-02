-- 0014_graded_leg_results.sql
-- Reusable exact-leg grading cache. One event_key can settle many user pick_legs.

create table if not exists public.graded_leg_results (
  event_key text primary key,
  sport text not null default 'mlb',
  game_id text,
  player_id text,
  market_code text,
  stat_target numeric,
  comparator text,
  actual_value numeric,
  status text not null check (status in ('won', 'lost', 'push')),
  note text,
  source_provider text,
  graded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_graded_leg_results_game_player_market
  on public.graded_leg_results (game_id, player_id, market_code);

create index if not exists idx_graded_leg_results_status
  on public.graded_leg_results (status);

alter table public.graded_leg_results enable row level security;

drop policy if exists "service role manages graded leg results" on public.graded_leg_results;

create policy "service role manages graded leg results"
  on public.graded_leg_results
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
