-- =========================================================
-- HR Feature Snapshots (HR-M1 — point-in-time pregame capture)
-- =========================================================
-- Pregame feature vectors are the only irrecoverable asset in the HR
-- intelligence stack. Season-to-date statistics fetched after a game has
-- started already contain the outcome we are trying to predict, so a snapshot
-- that was not taken before first pitch can never be reconstructed honestly.
-- This table records what the pipeline knew, at the moment it knew it.
--
-- Append-only by construction:
--   - no updated_at column
--   - no UPDATE or DELETE policy (service-role writes only)
--   - corrections arrive as a new capture_seq, never as a revision
--
-- Written by server/cron/hrSnapshotCapture.ts. Read by nobody yet — the
-- training pipeline (HR-M4) is the first consumer.
--
-- TRAINING ELIGIBILITY (recorded now, enforced at training time):
--   1. is_point_in_time = true
--   2. lineup_status <> 'unknown'
--   3. opposing_pitcher_id is not null
--   4. a matching row exists in hr_game_outcomes
-- Rule 4 cannot be expressed until hr_game_outcomes lands (Batch 1); the
-- hr_training_eligible_snapshots view joining all four arrives with it.
-- Ineligible rows are still captured on purpose — knowing that a slate went
-- unconfirmed is itself data.

create table if not exists public.hr_feature_snapshots (
  snapshot_id            uuid        primary key default gen_random_uuid(),

  -- Slate + join keys. (game_pk, player_id) joins to hr_game_outcomes.
  slate_date             date        not null,
  game_pk                text        not null,
  player_id              text        not null,
  -- 1 for the first capture of a game. Reserved for a future capture-early /
  -- capture-late comparison; the current job only ever writes 1.
  capture_seq            smallint    not null default 1,

  -- Team identifiers, promoted out of JSON so slate reconstruction and
  -- home/away splits never require parsing the payload.
  team_id                text        not null,
  opponent_team_id       text        not null,
  home_team_id           text        not null,
  away_team_id           text        not null,

  -- Timing + point-in-time integrity.
  captured_at            timestamptz not null default now(),
  scheduled_first_pitch  timestamptz not null,
  -- When the board itself was computed. The pipeline caches its validated
  -- board for 5 minutes, so this can precede captured_at; storing it makes
  -- that staleness measurable instead of invisible.
  board_generated_at     timestamptz,
  -- Computed at write time from captured_at < scheduled_first_pitch. Never
  -- accepted from the caller. The capture job refuses to write post-first-pitch
  -- rows at all, so this should be true on every row; the column exists so a
  -- clock skew or a future backfill attempt is detectable rather than silent.
  is_point_in_time       boolean     not null,

  -- Eligibility-relevant fields, promoted for indexed filtering.
  lineup_status          text        not null
    check (lineup_status in ('confirmed', 'projected', 'projected_unconfirmed', 'bench', 'unknown')),
  batting_order          smallint,
  opposing_pitcher_id    text,
  venue                  text,

  -- Payload + provenance.
  features               jsonb       not null,
  -- Per-source fetch timestamps (schedule, lineup, stats, statcast). A snapshot
  -- written at 18:50 from a leaderboard fetched at 06:00 is stamped as such.
  source_as_of           jsonb       not null default '{}'::jsonb,
  -- Canonical key-sorted hash of features + versions. Replay verification.
  feature_hash           text        not null,
  pipeline_version       text        not null,
  feature_set_version    text        not null,

  constraint hr_feature_snapshots_unique
    unique (game_pk, player_id, capture_seq)
);

comment on table public.hr_feature_snapshots is
  'Append-only point-in-time pregame HR feature vectors. Never updated or deleted.';
comment on column public.hr_feature_snapshots.is_point_in_time is
  'Training eligibility rule 1. Computed at write from captured_at < scheduled_first_pitch.';
comment on column public.hr_feature_snapshots.lineup_status is
  'Training eligibility rule 2 requires this to be anything other than unknown.';
comment on column public.hr_feature_snapshots.opposing_pitcher_id is
  'Training eligibility rule 3 requires this to be non-null.';
comment on column public.hr_feature_snapshots.features is
  'Uncalibrated pipeline output and inputs. hrScore and estimatedHrProbability inside are legacy uncalibrated values and are NOT training labels.';

-- Slate sweeps (backfill verification, daily counts).
create index if not exists hr_feature_snapshots_slate_idx
  on public.hr_feature_snapshots (slate_date);

-- Join to outcomes.
create index if not exists hr_feature_snapshots_join_idx
  on public.hr_feature_snapshots (game_pk, player_id);

-- Training-set selection: eligibility rules 1-3. Rule 4 is applied by join.
create index if not exists hr_feature_snapshots_eligible_idx
  on public.hr_feature_snapshots (slate_date)
  where is_point_in_time
    and lineup_status <> 'unknown'
    and opposing_pitcher_id is not null;

-- =========================================================
-- Row-Level Security
-- =========================================================
alter table public.hr_feature_snapshots enable row level security;

-- No policies at all. This table is service-role only: not world-readable
-- (it is raw model input, not user-facing), and deliberately has no INSERT,
-- UPDATE, or DELETE policy. Append-only immutability is enforced by the
-- database rather than by convention -- there is no code path, authenticated
-- or anonymous, that can revise a captured snapshot.
