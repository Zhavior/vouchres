-- Notification Queue (FOR UPDATE SKIP LOCKED pattern)
-- Designed to offload bulk inserts and web push deliveries

create type public.notification_job_status as enum ('pending', 'processing', 'completed', 'failed');

create table if not exists public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  metadata jsonb default '{}'::jsonb,
  dedupe_key text not null,
  status public.notification_job_status not null default 'pending',
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Essential index for the worker polling loop
create index if not exists idx_notification_jobs_pending 
  on public.notification_jobs(status, created_at) 
  where status = 'pending';

-- Add RLS (Server-only table, no client access)
alter table public.notification_jobs enable row level security;
