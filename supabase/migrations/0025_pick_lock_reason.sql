-- 0025: Distinguish why a pick was locked (trust ledger vs feed share).
-- Idempotent; safe to re-run.

alter table public.picks
  add column if not exists lock_reason text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'picks_lock_reason_check'
  ) then
    alter table public.picks
      add constraint picks_lock_reason_check
      check (lock_reason is null or lock_reason in ('trust_ledger', 'feed_share'));
  end if;
end $$;

-- Backfill: trust-ledger locks usually have committed_at set before lock.
update public.picks
set lock_reason = 'trust_ledger'
where locked_at is not null
  and committed_at is not null
  and lock_reason is null;

-- Remaining locked picks without commit → feed share path.
update public.picks
set lock_reason = 'feed_share'
where locked_at is not null
  and lock_reason is null;
