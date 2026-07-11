-- Pick edit audit trail for TrustOS version history.
-- Idempotent; safe to re-run.

create table if not exists public.pick_audit_log (
  id          uuid primary key default gen_random_uuid(),
  pick_id     uuid not null references public.picks(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  action      text not null,
  field_changes jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists pick_audit_log_pick_id_created_idx
  on public.pick_audit_log(pick_id, created_at desc);

alter table public.pick_audit_log enable row level security;

drop policy if exists "pick_audit_log_read_own" on public.pick_audit_log;
create policy "pick_audit_log_read_own"
  on public.pick_audit_log for select
  using (auth.uid() = user_id);

drop policy if exists "pick_audit_log_insert_own" on public.pick_audit_log;
create policy "pick_audit_log_insert_own"
  on public.pick_audit_log for insert
  with check (auth.uid() = user_id);
