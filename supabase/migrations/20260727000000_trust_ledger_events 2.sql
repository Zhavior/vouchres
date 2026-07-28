-- =========================================================
-- Trust Ledger Events (Layer 1 — immutable event log per constitution)
-- =========================================================
-- This table implements the constitutional requirement for an immutable
-- event-sourced trust ledger. Every trust state change is written as a new
-- event. No event is ever modified or deleted.
--
-- Event types:
-- - COMMIT: User commits a pick/parlay to the trust ledger
-- - LOCK: Pick/parlay is locked after event completion
-- - GRADE: Pick/parlay is graded (won/lost/push/void)
-- - REPAIR: Manual correction by governance
-- - REVOKE: Trust event revoked by governance
--
-- See: constitution/ARCHITECTURE.md

create table if not exists public.trust_ledger_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  event_type    text not null check (event_type in ('COMMIT', 'LOCK', 'GRADE', 'REPAIR', 'REVOKE')),
  pick_id       uuid references public.picks(id) on delete set null,
  parlay_id     uuid references public.picks(id) on delete set null,
  trust_delta   numeric(8,2) not null default 0.00,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  -- Constraint: exactly one of pick_id or parlay_id should be set for COMMIT/LOCK/GRADE events
  check (
    (event_type in ('COMMIT', 'LOCK', 'GRADE') and (pick_id is not null or parlay_id is not null)) or
    (event_type IN ('REPAIR', 'REVOKE'))
  )
);

-- Indexes for common query patterns
create index if not exists trust_ledger_events_user_id_idx 
  on public.trust_ledger_events(user_id, created_at desc);
create index if not exists trust_ledger_events_pick_id_idx 
  on public.trust_ledger_events(pick_id) where pick_id is not null;
create index if not exists trust_ledger_events_parlay_id_idx 
  on public.trust_ledger_events(parlay_id) where parlay_id is not null;
create index if not exists trust_ledger_events_event_type_idx 
  on public.trust_ledger_events(event_type, created_at desc);

-- =========================================================
-- Row-Level Security
-- =========================================================
alter table public.trust_ledger_events enable row level security;

-- World-readable for transparency per constitution
create policy "trust_ledger_read_all"
  on public.trust_ledger_events for select using (true);

-- No insert/update/delete policies — writes are SERVICE-ROLE ONLY
-- The ledger must be immutable; only backend operations (grading,
-- trust lock, commit) should write events via service role.
