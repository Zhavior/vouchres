alter table public.profiles
  add column if not exists capper_settings jsonb not null default '{}'::jsonb;
