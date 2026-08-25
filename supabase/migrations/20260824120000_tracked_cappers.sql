-- Cappers — the tracked handles whose daily home-run picks the Results desk grades.
--
-- Two tables, not one jsonb blob (contrast hr_lists): picks are read *per slate*
-- and joined against the real HR feed one player at a time, so the grading query
-- wants rows. A capper's identity also outlives any single slate.
--
-- Nothing here stores a grade. Whether a pick hit is derived at read time from
-- server/services/mlb/hrFeedService.ts, so a graded result can never drift from
-- what actually happened, and a stored "win" can never be edited after the fact.

create table public.tracked_cappers (
  id uuid primary key default gen_random_uuid(),
  -- Social handle without the leading @ ('scadmeta'), lowercased for lookup.
  handle text not null,
  -- Short label shown on the ticket and leaderboard ('SCAD').
  display_name text not null,
  avatar_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tracked_cappers_handle_shape
    check (handle = lower(btrim(handle)) and char_length(handle) between 1 and 40),
  constraint tracked_cappers_display_name_len
    check (char_length(btrim(display_name)) between 1 and 20)
);

create unique index tracked_cappers_handle_key on public.tracked_cappers (handle);
create index tracked_cappers_active_order_idx on public.tracked_cappers (sort_order) where active;

create trigger tracked_cappers_touch_updated_at
  before update on public.tracked_cappers
  for each row execute function public.touch_updated_at();

-- One row per player a capper called for a given slate.
--
-- `slot` separates the two things the desk reports on: 'ticket' is the single
-- headline call (the Cappers Ticket, one per capper per slate), 'board' is the
-- rest of that capper's published list (the correct-picks count).
--
-- player_name / team_abbr are snapshots taken when the pick was recorded, so the
-- ticket still renders correctly after a trade. player_id is the join key.
create table public.tracked_capper_picks (
  id uuid primary key default gen_random_uuid(),
  capper_id uuid not null references public.tracked_cappers(id) on delete cascade,
  slate_date date not null,
  player_id integer not null check (player_id > 0),
  player_name text not null,
  team_abbr text,
  game_pk integer,
  slot text not null default 'board' check (slot in ('ticket', 'board')),
  -- When the call was locked. Picks recorded after first pitch are still shown,
  -- but this column is what an audit would read to check they were not late.
  locked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  constraint tracked_capper_picks_player_name_len
    check (char_length(btrim(player_name)) between 1 and 80)
);

-- A capper cannot call the same player twice on one slate.
create unique index tracked_capper_picks_unique_idx
  on public.tracked_capper_picks (capper_id, slate_date, player_id);

-- At most one headline ticket per capper per slate.
create unique index tracked_capper_picks_one_ticket_idx
  on public.tracked_capper_picks (capper_id, slate_date)
  where slot = 'ticket';

-- The Results desk always reads a whole slate at once.
create index tracked_capper_picks_slate_idx
  on public.tracked_capper_picks (slate_date, capper_id);

alter table public.tracked_cappers enable row level security;
alter table public.tracked_capper_picks enable row level security;

-- Reads are served by the backend with the service role (same pattern as
-- hr_lists). Signed-in clients get select so the desk can degrade to a direct
-- read; writes are staff-only and never reach the client.
revoke all on public.tracked_cappers from anon, authenticated;
revoke all on public.tracked_capper_picks from anon, authenticated;
grant select on public.tracked_cappers to authenticated;
grant select on public.tracked_capper_picks to authenticated;
grant select, insert, update, delete on public.tracked_cappers to service_role;
grant select, insert, update, delete on public.tracked_capper_picks to service_role;

drop policy if exists "tracked_cappers_select_all" on public.tracked_cappers;
create policy "tracked_cappers_select_all"
  on public.tracked_cappers for select
  to authenticated
  using (true);

drop policy if exists "tracked_capper_picks_select_all" on public.tracked_capper_picks;
create policy "tracked_capper_picks_select_all"
  on public.tracked_capper_picks for select
  to authenticated
  using (true);
