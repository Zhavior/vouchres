-- =========================================================
-- 0004_grading_logs.sql
--
-- Audit trail for every grading decision. Lets us prove a result was derived
-- from real game data (never invented) and debug mis-grades.
--
-- STATUS: NOT ASSUMED RUN. Apply manually. Idempotent.
-- The grade-due route writes here best-effort (a missing table is swallowed),
-- so this is an UPGRADE, not a hard dependency.
-- =========================================================

create table if not exists public.grading_logs (
  id          uuid primary key default gen_random_uuid(),
  pick_id     uuid references public.picks(id) on delete cascade,
  -- Outcome we wrote (or would have written). Mirrors pick_status + 'skipped'.
  status      text not null,
  -- Why: 'graded' | 'pending_no_data' | 'pending_not_final' | 'error' ...
  reason      text,
  -- Optional snapshot of the evidence used (box score ids, leg outcomes).
  evidence    jsonb,
  source      text not null default 'grade-due',
  created_at  timestamptz not null default now()
);

create index if not exists grading_logs_pick_id_idx   on public.grading_logs(pick_id);
create index if not exists grading_logs_created_idx    on public.grading_logs(created_at desc);

-- RLS: world-readable (proof/transparency, like picks), writable only by the
-- service role (the grader). No anon/authenticated write path.
alter table public.grading_logs enable row level security;

drop policy if exists "grading_logs_read_all" on public.grading_logs;
create policy "grading_logs_read_all"
  on public.grading_logs for select
  using (true);

-- No insert/update/delete policy → only the service role (which bypasses RLS)
-- can write. This is intentional: clients must never author grading records.
