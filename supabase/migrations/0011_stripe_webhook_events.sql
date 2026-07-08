-- =========================================================
-- 0011_stripe_webhook_events.sql
--
-- Stripe webhook idempotency ledger. The backend inserts each verified event
-- ID before handling it, then marks it processed or failed. Duplicate Stripe
-- deliveries cannot update subscriptions or entitlements twice.
-- =========================================================

create table if not exists public.stripe_webhook_events (
  id text primary key,
  type text not null,
  status text not null default 'processing'
    check (status in ('processing', 'processed', 'failed')),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text
);

create index if not exists stripe_webhook_events_status_idx
  on public.stripe_webhook_events(status, received_at desc);

alter table public.stripe_webhook_events enable row level security;

-- No client policies: this is a service-role-only operational ledger.
