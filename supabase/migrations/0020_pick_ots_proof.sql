-- OpenTimestamps proof blob stored at parlay lock (base64-encoded .ots bytes).

alter table public.picks
  add column if not exists ots_proof text;

alter table public.picks
  add column if not exists ots_stamped_at timestamptz;

create index if not exists picks_ots_stamped_at_idx
  on public.picks(ots_stamped_at)
  where ots_stamped_at is not null;
