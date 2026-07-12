create table public.brain_decisions (
  id uuid primary key default gen_random_uuid(),
  decision_key text not null unique,
  decision_date date not null,
  sport text not null check (sport in ('mlb', 'nba', 'nfl')),
  market text not null check (market in ('home_run', 'pitcher_strikeouts')),
  game_id text not null,
  player_id text not null,
  player_name text not null,
  team text not null,
  opponent text not null,
  engine_version text not null,
  rank smallint not null check (rank between 1 and 50),
  score smallint not null check (score between 0 and 100),
  confidence smallint not null check (confidence between 0 and 100),
  tier text not null,
  evidence_quality text not null check (evidence_quality in ('official', 'preview')),
  reasons jsonb not null default '[]'::jsonb check (jsonb_typeof(reasons) = 'array'),
  risks jsonb not null default '[]'::jsonb check (jsonb_typeof(risks) = 'array'),
  feature_snapshot jsonb not null check (jsonb_typeof(feature_snapshot) = 'object'),
  source_generated_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.brain_decision_outcomes (
  decision_id uuid primary key references public.brain_decisions(id) on delete restrict,
  result text not null check (result in ('hit', 'miss', 'void')),
  result_source text not null,
  settled_at timestamptz not null default now()
);

create index brain_decisions_date_market_idx
  on public.brain_decisions (decision_date desc, market, rank);

create function public.prevent_brain_decision_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'brain decisions are immutable';
end;
$$;

create trigger brain_decisions_immutable
before update or delete on public.brain_decisions
for each row execute function public.prevent_brain_decision_mutation();

alter table public.brain_decisions enable row level security;
alter table public.brain_decision_outcomes enable row level security;

revoke all on public.brain_decisions from anon, authenticated;
revoke all on public.brain_decision_outcomes from anon, authenticated;
grant all on public.brain_decisions to service_role;
grant all on public.brain_decision_outcomes to service_role;

comment on table public.brain_decisions is
  'Immutable server-authored pregame Brain recommendations. Never accept decision fields from clients.';
comment on table public.brain_decision_outcomes is
  'Server-settled official outcomes stored separately so the original decision remains immutable.';
