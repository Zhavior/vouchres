-- "My HR List" — user-curated home-run watchlists that can be shared publicly.
--
-- Entries are stored as a jsonb array rather than a child table on purpose:
-- a list is always read and written whole (the share card renders the entire
-- list), ordering is user-controlled, and each entry is a point-in-time
-- snapshot of what the board said when the player was added. Normalising would
-- add a join and an ordering column for no read we actually perform.
--
-- Snapshot semantics matter for trust: `entries` is what the user saw at add
-- time. Live board values are re-read for display, never written back over the
-- snapshot, so a shared list cannot be silently rewritten after the fact.

create table public.hr_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  -- Slate the list was built for (YYYY-MM-DD). Null for evergreen lists.
  slate_date date,
  entries jsonb not null default '[]'::jsonb,
  -- Public lists are readable by anon via /l/:id and are the only ones that
  -- render a share card. Private is the default: sharing must be a deliberate act.
  visibility text not null default 'private'
    check (visibility in ('private', 'public')),
  -- Set the first time the list is made public; drives "shared at" provenance
  -- on the permalink and is never cleared by going private again.
  first_shared_at timestamptz,
  share_count integer not null default 0 check (share_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint hr_lists_title_len
    check (char_length(btrim(title)) between 1 and 80),
  constraint hr_lists_entries_is_array
    check (jsonb_typeof(entries) = 'array'),
  -- Bounded so a single list cannot blow up the share-card renderer or the row.
  constraint hr_lists_entries_limit
    check (jsonb_array_length(entries) <= 25)
);

create index hr_lists_user_updated_idx
  on public.hr_lists (user_id, updated_at desc);

-- Supports the public permalink lookup without scanning private rows.
create index hr_lists_public_idx
  on public.hr_lists (id)
  where visibility = 'public';

create trigger hr_lists_touch_updated_at
  before update on public.hr_lists
  for each row execute function public.touch_updated_at();

alter table public.hr_lists enable row level security;

-- New public-schema entities are not auto-exposed in this project. anon stays
-- closed at the grant level; the public permalink is served by the backend with
-- the service role, so anon never needs direct table access.
revoke all on public.hr_lists from anon, authenticated;
grant select, insert, update, delete on public.hr_lists to authenticated;
grant select, insert, update, delete on public.hr_lists to service_role;

drop policy if exists "hr_lists_select_own" on public.hr_lists;
create policy "hr_lists_select_own"
  on public.hr_lists for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "hr_lists_insert_own" on public.hr_lists;
create policy "hr_lists_insert_own"
  on public.hr_lists for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "hr_lists_update_own" on public.hr_lists;
create policy "hr_lists_update_own"
  on public.hr_lists for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "hr_lists_delete_own" on public.hr_lists;
create policy "hr_lists_delete_own"
  on public.hr_lists for delete
  to authenticated
  using ((select auth.uid()) = user_id);
