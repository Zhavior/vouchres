-- =========================================================
-- Resolution Engine Infrastructure
-- =========================================================
-- This migration creates the infrastructure for the constitutional
-- Resolution Engine, which applies governance-published contracts
-- to official data sources and writes outcomes to the Trust Ledger.
--
-- See: constitution/ARCHITECTURE.md

-- =========================================================
-- Resolution Contracts (governance-published, versioned rules)
-- =========================================================
create table if not exists public.resolution_contracts (
  id uuid primary key default gen_random_uuid(),
  
  -- Contract identification
  market_type text not null check (char_length(market_type) between 1 and 64),
  version text not null check (char_length(version) between 1 and 32),
  
  -- Contract content (JSON schema for rules)
  contract_schema jsonb not null default '{}'::jsonb,
  
  -- Governance metadata
  published_at timestamptz not null default now(),
  published_by text not null default 'governance', -- governance role identifier
  effective_from timestamptz not null default now(),
  is_retroactive boolean not null default false,
  
  -- Status
  is_active boolean not null default true,
  deprecated_at timestamptz,
  deprecation_reason text,
  
  -- Amendment log reference
  amendment_log_id uuid,
  
  -- Constraints
  unique (market_type, version),
  check (is_active = false or deprecated_at is null)
);

create index resolution_contracts_market_idx on public.resolution_contracts(market_type, is_active);
create index resolution_contracts_effective_idx on public.resolution_contracts(effective_from desc);

-- =========================================================
-- Resolution Outcomes (Layer 1 events from Resolution Engine)
-- =========================================================
-- Note: These are written to trust_ledger_events, but we maintain
-- a separate table for Resolution Engine telemetry and SLA tracking.

create table if not exists public.resolution_outcomes (
  id uuid primary key default gen_random_uuid(),
  
  -- Reference to the decision being resolved
  ledger_event_id uuid not null references public.trust_ledger_events(id) on delete cascade,
  pick_id uuid references public.picks(id) on delete set null,
  parlay_id uuid references public.picks(id) on delete set null,
  
  -- Resolution metadata
  contract_id uuid not null references public.resolution_contracts(id),
  contract_version text not null,
  market_type text not null,
  
  -- Outcome
  outcome text not null check (outcome in ('CORRECT', 'INCORRECT', 'VOID', 'PUSH', 'UNRESOLVED')),
  outcome_reason text,
  
  -- Official data source
  official_source text not null,
  official_source_url text,
  official_data jsonb not null default '{}'::jsonb,
  
  -- SLA tracking
  event_completed_at timestamptz,
  resolution_started_at timestamptz,
  resolution_completed_at timestamptz,
  resolution_duration_ms int,
  
  -- Status
  sla_met boolean,
  sla_target_hours numeric(5,2) not null default 6.0,
  
  -- Metadata
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index resolution_outcomes_ledger_idx on public.resolution_outcomes(ledger_event_id);
create index resolution_outcomes_pick_idx on public.resolution_outcomes(pick_id) where pick_id is not null;
create index resolution_outcomes_parlay_idx on public.resolution_outcomes(parlay_id) where parlay_id is not null;
create index resolution_outcomes_contract_idx on public.resolution_outcomes(contract_id);
create index resolution_outcomes_sla_idx on public.resolution_outcomes(sla_met, resolution_completed_at desc);
create index resolution_outcomes_created_idx on public.resolution_outcomes(created_at desc);

-- =========================================================
-- Resolution SLA Metrics (system-wide performance)
-- =========================================================
create table if not exists public.resolution_sla_metrics (
  id uuid primary key default gen_random_uuid(),
  
  -- Time window
  window_start timestamptz not null,
  window_end timestamptz not null,
  
  -- SLA targets
  sla_target_hours numeric(5,2) not null default 6.0,
  sla_target_percentage numeric(5,2) not null default 95.0,
  
  -- Actual performance
  total_outcomes int not null default 0,
  sla_met_count int not null default 0,
  sla_missed_count int not null default 0,
  sla_percentage numeric(5,2),
  
  -- Resolution time statistics
  avg_resolution_hours numeric(10,2),
  p50_resolution_hours numeric(10,2),
  p95_resolution_hours numeric(10,2),
  max_resolution_hours numeric(10,2),
  
  -- Market breakdown
  market_breakdown jsonb not null default '{}'::jsonb,
  
  created_at timestamptz not null default now()
);

create index resolution_sla_metrics_window_idx on public.resolution_sla_metrics(window_start desc);

-- =========================================================
-- Function: Get active resolution contract for market
-- =========================================================
create or replace function public.get_active_resolution_contract(p_market_type text)
returns table (
  id uuid,
  version text,
  contract_schema jsonb,
  published_at timestamptz,
  effective_from timestamptz
) as $$
begin
  return query
  select 
    rc.id,
    rc.version,
    rc.contract_schema,
    rc.published_at,
    rc.effective_from
  from public.resolution_contracts rc
  where rc.market_type = p_market_type
    and rc.is_active = true
    and rc.effective_from <= now()
  order by rc.effective_from desc, rc.version desc
  limit 1;
end;
$$ language plpgsql security definer;

-- =========================================================
-- Function: Record resolution outcome
-- =========================================================
create or replace function public.record_resolution_outcome(
  p_ledger_event_id uuid,
  p_pick_id uuid,
  p_parlay_id uuid,
  p_contract_id uuid,
  p_contract_version text,
  p_market_type text,
  p_outcome text,
  p_outcome_reason text,
  p_official_source text,
  p_official_source_url text,
  p_official_data jsonb,
  p_event_completed_at timestamptz,
  p_sla_target_hours numeric default 6.0,
  p_metadata jsonb default '{}'::jsonb
) returns uuid as $$
declare
  v_resolution_started_at timestamptz;
  v_resolution_completed_at timestamptz;
  v_resolution_duration_ms int;
  v_sla_met boolean;
  v_outcome_id uuid;
begin
  v_resolution_started_at := now();
  v_resolution_completed_at := now();
  v_resolution_duration_ms := extract(epoch from (v_resolution_completed_at - v_resolution_started_at)) * 1000;
  
  -- Calculate SLA compliance
  v_sla_met := case 
    when p_event_completed_at is null then true
    when extract(epoch from (v_resolution_completed_at - p_event_completed_at)) / 3600 <= p_sla_target_hours 
    then true
    else false
  end;
  
  insert into public.resolution_outcomes (
    ledger_event_id, pick_id, parlay_id, contract_id, contract_version,
    market_type, outcome, outcome_reason, official_source, official_source_url,
    official_data, event_completed_at, resolution_started_at, resolution_completed_at,
    resolution_duration_ms, sla_met, sla_target_hours, metadata
  ) values (
    p_ledger_event_id, p_pick_id, p_parlay_id, p_contract_id, p_contract_version,
    p_market_type, p_outcome, p_outcome_reason, p_official_source, p_official_source_url,
    p_official_data, p_event_completed_at, v_resolution_started_at, v_resolution_completed_at,
    v_resolution_duration_ms, v_sla_met, p_sla_target_hours, p_metadata
  ) returning id into v_outcome_id;
  
  return v_outcome_id;
end;
$$ language plpgsql security definer;

-- =========================================================
-- Sample Resolution Contract: Home Run (HR)
-- =========================================================
-- This is an example of a governance-published contract.
-- In production, contracts are published by governance via a separate process.

insert into public.resolution_contracts (
  market_type,
  version,
  contract_schema,
  published_by,
  effective_from,
  is_active
) values (
  'HR',
  '1.0',
  '{
    "rules": [
      {
        "id": "hr_standard",
        "description": "Standard home run resolution",
        "conditions": {
          "event_type": "home_run",
          "official_source": "mlb_gameday"
        },
        "outcome": "CORRECT"
      },
      {
        "id": "hr_void_suspended",
        "description": "Void if game is suspended before HR",
        "conditions": {
          "event_type": "home_run",
          "game_status": "suspended",
          "inning_at_hr": null
        },
        "outcome": "VOID"
      },
      {
        "id": "hr_push_postponed",
        "description": "Push if game is postponed after HR",
        "conditions": {
          "event_type": "home_run",
          "game_status": "postponed",
          "inning_at_hr": "not null"
        },
        "outcome": "PUSH"
      }
    ],
    "official_sources": ["mlb_gameday", "stats_api"],
    "sla_hours": 6.0
  }'::jsonb,
  'governance',
  now(),
  true
) on conflict (market_type, version) do nothing;

-- =========================================================
-- RLS Policies
-- =========================================================
alter table public.resolution_contracts enable row level security;
alter table public.resolution_outcomes enable row level security;
alter table public.resolution_sla_metrics enable row level security;

-- Resolution contracts are world-readable (transparency)
create policy "resolution_contracts_read_all"
  on public.resolution_contracts for select using (true);

-- Resolution outcomes are world-readable (transparency)
create policy "resolution_outcomes_read_all"
  on public.resolution_outcomes for select using (true);

-- SLA metrics are world-readable (transparency)
create policy "resolution_sla_metrics_read_all"
  on public.resolution_sla_metrics for select using (true);

-- No insert/update policies for client — only Resolution Engine service role writes
