-- Vouches — was localStorage-only (src/App.tsx savedVouches). Never touched
-- the backend, so vouches didn't survive logout or sync across devices.
-- This gives vouches a real, stable server-side identity (needed for any
-- future shareable/public link to a vouch).

create table public.vouches (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  vouch_source      text not null,
  user_note         text not null default '',
  market            text not null,
  sport             text not null default 'mlb',
  player_or_team    text,
  game_name         text not null,
  odds              text not null,
  line              text,
  selection         text,
  status            pick_status not null default 'pending',
  saved_count       int not null default 0,
  vouched_count     int not null default 0,
  ai_confidence     numeric(4,2) check (ai_confidence between 0 and 100),
  capper_confidence numeric(4,2) check (capper_confidence between 0 and 100),
  risk_tier         text,
  is_locked         boolean not null default false,
  lock_time         timestamptz,
  longer_breakdown  text,
  card_theme        text,
  visibility        text not null default 'public' check (visibility in ('public', 'private')),
  is_demo           boolean not null default false,
  -- User-facing hide/remove timestamp. Same convention as picks.user_hidden_at:
  -- never hard-delete, never repurpose status='void' for this.
  user_hidden_at    timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index vouches_user_id_created_idx on public.vouches(user_id, created_at desc);
create index vouches_visible_idx
  on public.vouches (user_id, created_at desc)
  where user_hidden_at is null;

create trigger vouches_touch
  before update on public.vouches
  for each row execute function public.touch_updated_at();

alter table public.vouches enable row level security;

-- vouches: world-readable when not hidden and public, only author writes
create policy "vouches_read_all"
  on public.vouches for select
  using (visibility = 'public' and user_hidden_at is null or auth.uid() = user_id);

create policy "vouches_insert_self"
  on public.vouches for insert
  with check (auth.uid() = user_id);

create policy "vouches_update_self"
  on public.vouches for update
  using (auth.uid() = user_id);

-- Let a post reference the vouch it was built from, alongside the existing pick_id link.
alter table if exists public.posts
  add column if not exists vouch_id uuid references public.vouches(id) on delete set null;

comment on column public.posts.vouch_id is
  'Optional link to the vouches row this post was published from (Vouch Board / Orbit Studio).';
