-- User-facing parlay hide/remove support.
-- This is intentionally separate from picks.status.
-- picks.status='void' is reserved for official sportsbook/no-action outcomes only.

alter table if exists public.picks
  add column if not exists user_hidden_at timestamptz;

comment on column public.picks.user_hidden_at is
  'User-facing hide/remove timestamp. Does not affect sportsbook grading status, ledger truth, or official void semantics.';

create index if not exists idx_picks_user_parlays_visible
  on public.picks (user_id, created_at desc)
  where leg_type = 'parlay'
    and user_hidden_at is null;
