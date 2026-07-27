-- =========================================================
-- Trust Ledger Projections (Layer 2 — Calibration Metrics)
-- =========================================================
-- These tables and views project the immutable trust_ledger_events
-- into queryable calibration metrics per the constitutional architecture.
--
-- Layer 1: trust_ledger_events (immutable event log)
-- Layer 2: trust_projections (materialized metrics for calibration)
--
-- See: constitution/ARCHITECTURE.md

-- =========================================================
-- User Trust Projection (materialized trust score from ledger events)
-- =========================================================
create table if not exists public.trust_projections (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  
  -- Computed trust score (sum of all trust_delta from ledger events)
  trust_score numeric(10,2) not null default 0.00,
  
  -- Event counts for calibration
  commit_count int not null default 0,
  lock_count int not null default 0,
  grade_count int not null default 0,
  repair_count int not null default 0,
  revoke_count int not null default 0,
  
  -- Calibration metrics
  total_events int not null default 0,
  last_event_at timestamptz,
  last_event_type text,
  
  -- Computed win rate from graded events (where applicable)
  graded_wins int not null default 0,
  graded_losses int not null default 0,
  graded_pushes int not null default 0,
  graded_voids int not null default 0,
  win_rate numeric(5,2), -- percentage (0-100)
  
  updated_at timestamptz not null default now()
);

create index trust_projections_score_idx on public.trust_projections(trust_score desc);
create index trust_projections_updated_idx on public.trust_projections(updated_at desc);

-- =========================================================
-- Function: Recompute trust projection for a user
-- =========================================================
create or replace function public.recompute_trust_projection(p_user_id uuid)
returns void as $$
declare
  v_trust_score numeric(10,2);
  v_commit_count int;
  v_lock_count int;
  v_grade_count int;
  v_repair_count int;
  v_revoke_count int;
  v_total_events int;
  v_last_event_at timestamptz;
  v_last_event_type text;
  v_graded_wins int;
  v_graded_losses int;
  v_graded_pushes int;
  v_graded_voids int;
  v_win_rate numeric(5,2);
begin
  -- Sum trust deltas
  select coalesce(sum(trust_delta), 0.00)
  into v_trust_score
  from public.trust_ledger_events
  where user_id = p_user_id;
  
  -- Count events by type
  select 
    coalesce(sum(case when event_type = 'COMMIT' then 1 else 0 end), 0),
    coalesce(sum(case when event_type = 'LOCK' then 1 else 0 end), 0),
    coalesce(sum(case when event_type = 'GRADE' then 1 else 0 end), 0),
    coalesce(sum(case when event_type = 'REPAIR' then 1 else 0 end), 0),
    coalesce(sum(case when event_type = 'REVOKE' then 1 else 0 end), 0)
  into v_commit_count, v_lock_count, v_grade_count, v_repair_count, v_revoke_count
  from public.trust_ledger_events
  where user_id = p_user_id;
  
  -- Total events and last event
  select 
    count(*),
    max(created_at),
    (select event_type from public.trust_ledger_events 
     where user_id = p_user_id 
     order by created_at desc 
     limit 1)
  into v_total_events, v_last_event_at, v_last_event_type
  from public.trust_ledger_events
  where user_id = p_user_id;
  
  -- Grade outcomes from metadata
  select 
    coalesce(sum(case when metadata->>'outcome' = 'won' then 1 else 0 end), 0),
    coalesce(sum(case when metadata->>'outcome' = 'lost' then 1 else 0 end), 0),
    coalesce(sum(case when metadata->>'outcome' = 'push' then 1 else 0 end), 0),
    coalesce(sum(case when metadata->>'outcome' = 'void' then 1 else 0 end), 0)
  into v_graded_wins, v_graded_losses, v_graded_pushes, v_graded_voids
  from public.trust_ledger_events
  where user_id = p_user_id and event_type = 'GRADE';
  
  -- Compute win rate (graded events only)
  v_win_rate := case 
    when (v_graded_wins + v_graded_losses + v_graded_pushes) > 0 
    then round((v_graded_wins::numeric / (v_graded_wins + v_graded_losses + v_graded_pushes)) * 100, 2)
    else null
  end;
  
  -- Upsert projection
  insert into public.trust_projections (
    user_id, trust_score, commit_count, lock_count, grade_count,
    repair_count, revoke_count, total_events, last_event_at,
    last_event_type, graded_wins, graded_losses, graded_pushes,
    graded_voids, win_rate, updated_at
  ) values (
    p_user_id, v_trust_score, v_commit_count, v_lock_count, v_grade_count,
    v_repair_count, v_revoke_count, v_total_events, v_last_event_at,
    v_last_event_type, v_graded_wins, v_graded_losses, v_graded_pushes,
    v_graded_voids, v_win_rate, now()
  )
  on conflict (user_id) do update set
    trust_score = excluded.trust_score,
    commit_count = excluded.commit_count,
    lock_count = excluded.lock_count,
    grade_count = excluded.grade_count,
    repair_count = excluded.repair_count,
    revoke_count = excluded.revoke_count,
    total_events = excluded.total_events,
    last_event_at = excluded.last_event_at,
    last_event_type = excluded.last_event_type,
    graded_wins = excluded.graded_wins,
    graded_losses = excluded.graded_losses,
    graded_pushes = excluded.graded_pushes,
    graded_voids = excluded.graded_voids,
    win_rate = excluded.win_rate,
    updated_at = now();
end;
$$ language plpgsql security definer;

-- =========================================================
-- Trigger: Auto-recompute projection on ledger events insert
-- =========================================================
create or replace function public.trigger_trust_projection_update()
returns trigger as $$
begin
  perform public.recompute_trust_projection(NEW.user_id);
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trust_projection_update_trigger
  after insert on public.trust_ledger_events
  for each row execute function public.trigger_trust_projection_update();

-- =========================================================
-- Calibration Metrics View (system-wide trust health)
-- =========================================================
create or replace view public.trust_calibration_metrics as
select 
  count(*) as total_users_with_trust,
  avg(trust_score) as avg_trust_score,
  max(trust_score) as max_trust_score,
  min(trust_score) as min_trust_score,
  stddev(trust_score) as trust_score_stddev,
  sum(commit_count) as total_commits,
  sum(lock_count) as total_locks,
  sum(grade_count) as total_grades,
  sum(graded_wins) as total_graded_wins,
  sum(graded_losses) as total_graded_losses,
  avg(win_rate) as avg_win_rate
from public.trust_projections;

-- =========================================================
-- RLS Policies
-- =========================================================
alter table public.trust_projections enable row level security;

-- Trust projections are world-readable for transparency
create policy "trust_projections_read_all"
  on public.trust_projections for select using (true);

-- No insert/update policies — projections are computed from ledger events only

-- =========================================================
-- Backfill: Recompute projections for existing users
-- =================================================--------
-- Run this once after migration to populate projections for users
-- who already have ledger events:
--
-- do $$
-- declare
--   user_record record;
-- begin
--   for user_record in select distinct user_id from public.trust_ledger_events loop
--     perform public.recompute_trust_projection(user_record.user_id);
--   end loop;
-- end $$;
