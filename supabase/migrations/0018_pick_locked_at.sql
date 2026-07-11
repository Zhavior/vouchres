-- Immutable lock timestamp: set when a pick/parlay is shared to the feed.
-- After locked_at is set, summary edits and hide are blocked (grading still allowed).

alter table public.picks
  add column if not exists locked_at timestamptz;

-- Backfill existing feed-shared picks from their first post.
update public.picks p
set locked_at = sub.first_post_at
from (
  select pick_id, min(created_at) as first_post_at
  from public.posts
  where pick_id is not null
  group by pick_id
) sub
where p.id = sub.pick_id
  and p.locked_at is null;

create index if not exists picks_locked_at_idx
  on public.picks(locked_at)
  where locked_at is not null;
