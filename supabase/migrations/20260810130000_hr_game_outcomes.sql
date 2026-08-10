-- =========================================================
-- HR Game Outcomes (HR-M1, Batch 1 — training labels)
-- =========================================================
-- The label side of the HR historical dataset. Snapshots
-- (hr_feature_snapshots) record what was known before first pitch; this table
-- records what actually happened. They join on (game_pk, player_id).
--
-- Outcomes are the recoverable half of the pair: the free MLB Stats API will
-- return a completed boxscore for a past game indefinitely, so this table can
-- always be rebuilt. Snapshots cannot. That asymmetry is why capture came
-- first and backfill comes second.
--
-- graded_leg_results is NOT a label source. It only contains players somebody
-- placed a bet on, which is exactly the selection bias a model must not learn.
-- This table stores the full slate — every batter who came to the plate,
-- whether or not anyone had an interest in them.
--
-- ---------------------------------------------------------
-- LABEL DEFINITION (FROZEN — do not revise in place)
-- ---------------------------------------------------------
--   1. A row exists ONLY for a batter with >= 1 plate appearance.
--   2. A player who did not bat produces NO ROW. Never a zero. Zero-filling
--      non-participants would teach a model that bench players are safe
--      unders, which is a statement about roster construction, not about
--      hitting home runs.
--   3. hr_flag = (home_runs >= 1). Multi-homer games are still one row, with
--      home_runs carrying the count.
--   4. A game is ingested only once it reaches a played-to-completion final
--      state. Postponed, cancelled, forfeited, and mid-suspension games are
--      NOT final for this purpose; a suspended game is ingested when it
--      resumes and completes, not before.
--   5. Doubleheaders are distinct game_pk values and are stored as separate
--      rows. Two games on one date for one player is normal here.
--
-- ---------------------------------------------------------
-- Append-only by construction
-- ---------------------------------------------------------
--   - no updated_at column
--   - RLS enabled with zero policies (service-role writes only)
--   - no UPDATE or DELETE path; a re-run is an ON CONFLICT DO NOTHING no-op
--
-- Written by scripts/backfillHrOutcomes.ts (range backfill) and
-- server/cron/hrOutcomeIngest.ts (nightly). Both share the same builder.
-- =========================================================

create table if not exists public.hr_game_outcomes (
  game_pk            text not null,
  player_id          text not null,
  game_date          date not null,
  -- >= 1 is the label definition itself, enforced by the database rather than
  -- by the caller: a zero-PA row is not a valid outcome, it is a bug.
  plate_appearances  int  not null check (plate_appearances >= 1),
  home_runs          int  not null check (home_runs >= 0),
  hr_flag            boolean not null,
  -- Official starting spot (1-9) from the boxscore. Null for substitutes and
  -- pinch hitters — their spot in the order is not the spot they were
  -- projected into, so it is left null rather than guessed.
  batting_order      smallint,
  team_id            text not null,
  opponent_team_id   text not null,
  game_state         text not null,
  source             text not null default 'mlb_statsapi',
  ingested_at        timestamptz not null default now(),
  primary key (game_pk, player_id)
);

comment on table public.hr_game_outcomes is
  'Append-only HR training labels, one row per batter-game with >= 1 plate appearance. Never updated or deleted. Full slate, not bet-driven.';
comment on column public.hr_game_outcomes.plate_appearances is
  'Always >= 1. A player who did not bat produces no row at all — never a zero row.';
comment on column public.hr_game_outcomes.hr_flag is
  'home_runs >= 1. The binary training label.';
comment on column public.hr_game_outcomes.game_state is
  'MLB detailedState at ingest. Only played-to-completion final states are ingested.';
comment on column public.hr_game_outcomes.batting_order is
  'Official starter spot 1-9. Null for substitutes — not inferred from the batters[] array index.';

-- Date sweeps: backfill verification, per-slate counts, time-split validation.
create index if not exists hr_game_outcomes_game_date_idx
  on public.hr_game_outcomes (game_date);

-- Per-player history in date order — the shape every rolling-form feature and
-- time-split boundary needs.
create index if not exists hr_game_outcomes_player_date_idx
  on public.hr_game_outcomes (player_id, game_date);

-- =========================================================
-- Row-Level Security
-- =========================================================
alter table public.hr_game_outcomes enable row level security;

-- No policies at all, matching hr_feature_snapshots. Service-role only: this
-- is raw model input, not user-facing, and there is deliberately no INSERT,
-- UPDATE, or DELETE policy. Append-only immutability is enforced by the
-- database rather than by convention.

-- Explicit rather than relying on schema-level default privileges, so the
-- table's access story lives with the table.
grant select, insert on public.hr_game_outcomes to service_role;

-- =========================================================
-- Training eligibility (completes rule 4)
-- =========================================================
-- hr_feature_snapshots recorded four eligibility rules but could only express
-- three; rule 4 ("a matching row exists in hr_game_outcomes") needs this
-- table. This view is that join, and it is the only supported way to assemble
-- a training set.
--
-- security_invoker = true is load-bearing. A Postgres view runs with its
-- owner's privileges by default, which would let the view hand out rows from
-- two RLS-protected, policy-free tables to anon and authenticated. With
-- security_invoker the caller's own RLS applies — meaning nobody but the
-- service role can read it, which is the same posture as the base tables.
create or replace view public.hr_training_eligible_snapshots
  with (security_invoker = true)
as
select s.*, o.hr_flag, o.plate_appearances, o.home_runs
from public.hr_feature_snapshots s
join public.hr_game_outcomes o
  on o.game_pk = s.game_pk and o.player_id = s.player_id
where s.is_point_in_time
  and s.lineup_status <> 'unknown'
  and s.opposing_pitcher_id is not null;

comment on view public.hr_training_eligible_snapshots is
  'Snapshots meeting all four training eligibility rules, joined to their labels. Rules 1-3 are snapshot-side predicates; rule 4 is this join. security_invoker so base-table RLS still applies.';
