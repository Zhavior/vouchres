-- Immutable incumbent/challenger predictions for the same MLB HR observation.
-- Outcomes remain sourced from hr_game_outcomes and are joined at evaluation time.
create table public.hr_paired_model_predictions (
  observation_key text primary key,
  slate_date date not null,
  game_pk text not null,
  player_id text not null,
  scheduled_first_pitch timestamptz not null,
  prediction_generated_at timestamptz not null,
  incumbent_probability numeric not null check (incumbent_probability >= 0 and incumbent_probability <= 1),
  incumbent_engine_version text not null,
  challenger_probability numeric not null check (challenger_probability >= 0 and challenger_probability <= 1),
  challenger_engine_version text not null,
  created_at timestamptz not null default now(),
  constraint hr_paired_model_predictions_identity_unique unique (slate_date, game_pk, player_id),
  constraint hr_paired_model_predictions_temporal_check check (prediction_generated_at < scheduled_first_pitch)
);

create index hr_paired_model_predictions_settlement_idx
  on public.hr_paired_model_predictions (slate_date, game_pk, player_id);

alter table public.hr_paired_model_predictions enable row level security;
revoke all on public.hr_paired_model_predictions from anon, authenticated;
grant all on public.hr_paired_model_predictions to service_role;

create function public.prevent_hr_paired_model_prediction_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'paired model predictions are immutable';
end;
$$;

create trigger hr_paired_model_predictions_immutable
before update or delete on public.hr_paired_model_predictions
for each row execute function public.prevent_hr_paired_model_prediction_mutation();

comment on table public.hr_paired_model_predictions is
  'Immutable report-only incumbent/challenger MLB HR predictions. Outcome truth is joined from hr_game_outcomes.';
