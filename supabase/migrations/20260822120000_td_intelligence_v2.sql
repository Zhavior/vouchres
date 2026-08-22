begin;

create table if not exists public.nfl_td_board_snapshots (
  id uuid primary key default gen_random_uuid(),
  slate_date date not null,
  model_version text not null,
  provider text not null,
  provider_updated_at timestamptz,
  ingested_at timestamptz not null default now(),
  connection_state text not null check (connection_state in ('live', 'partial', 'stale', 'unavailable', 'not_configured')),
  data_quality text not null check (data_quality in ('source_backed', 'partial', 'unavailable')),
  payload jsonb not null,
  payload_sha256 text not null,
  unique (slate_date, model_version, provider, payload_sha256)
);

create index if not exists nfl_td_board_snapshots_slate_date_idx
  on public.nfl_td_board_snapshots (slate_date desc, ingested_at desc);

create table if not exists public.nfl_td_candidate_snapshots (
  id uuid primary key default gen_random_uuid(),
  board_snapshot_id uuid not null references public.nfl_td_board_snapshots(id) on delete cascade,
  provider_player_id text not null,
  player_name text not null,
  team text not null,
  opponent text not null,
  features jsonb not null,
  field_sources jsonb not null,
  model_score numeric,
  market_odds integer,
  created_at timestamptz not null default now(),
  unique (board_snapshot_id, provider_player_id)
);

create index if not exists nfl_td_candidate_snapshots_player_idx
  on public.nfl_td_candidate_snapshots (provider_player_id, created_at desc);

create table if not exists public.nfl_td_provider_receipts (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  endpoint text not null,
  request_date date not null,
  http_status integer,
  received_at timestamptz not null default now(),
  source_updated_at timestamptz,
  payload_sha256 text,
  record_count integer not null default 0,
  error_code text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.nfl_td_outcomes (
  id uuid primary key default gen_random_uuid(),
  slate_date date not null,
  game_id text not null,
  provider_player_id text not null,
  touchdowns integer not null check (touchdowns >= 0),
  source text not null,
  source_updated_at timestamptz,
  ingested_at timestamptz not null default now(),
  unique (slate_date, game_id, provider_player_id, source)
);

alter table public.nfl_td_board_snapshots enable row level security;
alter table public.nfl_td_candidate_snapshots enable row level security;
alter table public.nfl_td_provider_receipts enable row level security;
alter table public.nfl_td_outcomes enable row level security;

revoke all on public.nfl_td_board_snapshots from anon, authenticated;
revoke all on public.nfl_td_candidate_snapshots from anon, authenticated;
revoke all on public.nfl_td_provider_receipts from anon, authenticated;
revoke all on public.nfl_td_outcomes from anon, authenticated;

grant all on public.nfl_td_board_snapshots to service_role;
grant all on public.nfl_td_candidate_snapshots to service_role;
grant all on public.nfl_td_provider_receipts to service_role;
grant all on public.nfl_td_outcomes to service_role;

commit;
