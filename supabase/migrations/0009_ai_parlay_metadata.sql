-- =========================================================
-- 0009_ai_parlay_metadata.sql
--
-- Optional metadata for AI/manual saved parlays. Idempotent.
-- =========================================================

alter table public.picks add column if not exists title text;
alter table public.picks add column if not exists risk_tier text;
alter table public.picks add column if not exists game_date date;

create index if not exists picks_source_idx on public.picks(source);
create index if not exists picks_game_date_idx on public.picks(game_date);

