-- =========================================================
-- 20260723090000_phase2_durability.sql
--
-- Phase 2 durability:
--   1) Stripe webhook inbox stores verified payload and queues entitlement work
--   2) Social outbox for async fanout (follow / note activity)
-- =========================================================

-- ---- Stripe webhook inbox (payload + queued status) ----

alter table public.stripe_webhook_events
  add column if not exists payload jsonb;

alter table public.stripe_webhook_events
  add column if not exists attempts integer not null default 0;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'stripe_webhook_events_status_check'
  ) then
    alter table public.stripe_webhook_events
      drop constraint stripe_webhook_events_status_check;
  end if;
end $$;

alter table public.stripe_webhook_events
  add constraint stripe_webhook_events_status_check
  check (status in ('queued', 'processing', 'processed', 'failed'));

create index if not exists stripe_webhook_events_queued_idx
  on public.stripe_webhook_events(received_at asc)
  where status = 'queued';

-- ---- Social outbox ----

create table if not exists public.social_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null
    check (event_type in ('NOTE_UPSERT', 'STORY_CREATE', 'FOLLOW', 'DM_SENT')),
  payload jsonb not null default '{}'::jsonb,
  processed boolean not null default false,
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

create index if not exists social_outbox_pending_idx
  on public.social_outbox(created_at asc)
  where processed = false;

alter table public.social_outbox enable row level security;
