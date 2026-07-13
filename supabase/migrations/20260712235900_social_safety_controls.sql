-- Social safety controls and abuse reports. Client roles have no direct access;
-- all reads and writes go through authenticated server routes.

create table if not exists public.social_user_controls (
  actor_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  control_type text not null check (control_type in ('block', 'mute')),
  created_at timestamptz not null default now(),
  primary key (actor_id, target_id, control_type),
  check (actor_id <> target_id)
);

create index if not exists social_user_controls_actor_idx
  on public.social_user_controls(actor_id, control_type, created_at desc);

create index if not exists social_user_controls_target_idx
  on public.social_user_controls(target_id, control_type);

create table if not exists public.social_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  subject_type text not null check (subject_type in ('profile', 'post', 'story')),
  subject_id uuid not null,
  target_profile_id uuid references public.profiles(id) on delete set null,
  reason text not null check (reason in ('spam', 'harassment', 'impersonation', 'harmful_content', 'other')),
  details text not null default '' check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reporter_id, subject_type, subject_id)
);

create index if not exists social_reports_status_created_idx
  on public.social_reports(status, created_at asc);

alter table public.social_user_controls enable row level security;
alter table public.social_reports enable row level security;
