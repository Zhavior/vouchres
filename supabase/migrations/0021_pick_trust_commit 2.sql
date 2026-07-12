-- Trust ledger commit window: private wins → auto-lock after trust_lock_at.
-- Idempotent; safe to re-run.

alter table public.picks
  add column if not exists committed_at timestamptz;

alter table public.picks
  add column if not exists trust_lock_at timestamptz;

create index if not exists picks_trust_lock_at_idx
  on public.picks(trust_lock_at)
  where trust_lock_at is not null and locked_at is null;

-- Extend pick_visibility for subscriber-only slips (if enum exists).
do $$
begin
  alter type public.pick_visibility add value if not exists 'subscriber';
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
