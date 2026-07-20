do $$
begin
  if not exists (select 1 from pg_type where typname = 'business_product_pricing_model') then
    create type business_product_pricing_model as enum ('free', 'one_time', 'recurring', 'waitlist');
  end if;
  if not exists (select 1 from pg_type where typname = 'business_membership_status') then
    create type business_membership_status as enum ('active', 'trialing', 'past_due', 'canceled', 'pending', 'waitlist');
  end if;
end
$$;

create table if not exists public.creator_businesses (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null unique references public.profiles(id) on delete cascade,
  slug text not null unique check (char_length(slug) between 3 and 64),
  display_name text not null default '',
  status text not null default 'active',
  brand_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_businesses_owner_idx on public.creator_businesses(owner_profile_id);

create table if not exists public.creator_business_products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.creator_businesses(id) on delete cascade,
  code text not null,
  name text not null,
  description text not null default '',
  pricing_model business_product_pricing_model not null default 'free',
  price_cents integer not null default 0,
  billing_interval text,
  visibility text not null default 'public',
  active boolean not null default true,
  access_scope jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, code)
);

create index if not exists creator_business_products_business_idx on public.creator_business_products(business_id, sort_order);

create table if not exists public.creator_business_apps (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.creator_businesses(id) on delete cascade,
  app_key text not null,
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, app_key)
);

create index if not exists creator_business_apps_business_idx on public.creator_business_apps(business_id);

create table if not exists public.creator_business_memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.creator_businesses(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid references public.creator_business_products(id) on delete set null,
  status business_membership_status not null default 'active',
  source text not null default 'internal',
  started_at timestamptz not null default now(),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_business_memberships_business_idx on public.creator_business_memberships(business_id, status);
create index if not exists creator_business_memberships_profile_idx on public.creator_business_memberships(profile_id, status);

create table if not exists public.creator_business_team_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.creator_businesses(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, profile_id)
);

create index if not exists creator_business_team_members_business_idx on public.creator_business_team_members(business_id);

create table if not exists public.creator_business_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.creator_businesses(id) on delete cascade,
  event_type text not null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  subject_profile_id uuid references public.profiles(id) on delete set null,
  product_id uuid references public.creator_business_products(id) on delete set null,
  membership_id uuid references public.creator_business_memberships(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists creator_business_events_business_idx on public.creator_business_events(business_id, created_at desc);

alter table public.creator_businesses enable row level security;
alter table public.creator_business_products enable row level security;
alter table public.creator_business_apps enable row level security;
alter table public.creator_business_memberships enable row level security;
alter table public.creator_business_team_members enable row level security;
alter table public.creator_business_events enable row level security;

revoke all on public.creator_businesses from anon, authenticated;
revoke all on public.creator_business_products from anon, authenticated;
revoke all on public.creator_business_apps from anon, authenticated;
revoke all on public.creator_business_memberships from anon, authenticated;
revoke all on public.creator_business_team_members from anon, authenticated;
revoke all on public.creator_business_events from anon, authenticated;
