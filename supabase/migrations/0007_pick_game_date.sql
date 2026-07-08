-- =========================================================
-- 0007_pick_game_date.sql
--
-- Optional game_date field for grading/reporting.
-- Idempotent and safe to run after existing picks/pick_legs tables exist.
-- =========================================================

alter table public.picks add column if not exists game_date date;
alter table public.pick_legs add column if not exists game_date date;

create index if not exists picks_game_date_idx on public.picks(game_date);
create index if not exists pick_legs_game_date_idx on public.pick_legs(game_date);

