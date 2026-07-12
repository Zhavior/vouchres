alter table public.brain_decisions
  drop constraint brain_decisions_market_check;

alter table public.brain_decisions
  add constraint brain_decisions_market_check
  check (market in ('home_run', 'pitcher_strikeouts', 'stolen_base'));
