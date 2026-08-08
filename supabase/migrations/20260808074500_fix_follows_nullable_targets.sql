-- A composite primary key treats every member as NOT NULL, which made the
-- documented capper-follow path impossible to persist. Keep a stable row ID
-- and preserve idempotency across either allowed target shape.
alter table public.follows
  drop constraint if exists follows_pkey;

alter table public.follows
  add column if not exists id uuid default gen_random_uuid();

update public.follows
set id = gen_random_uuid()
where id is null;

alter table public.follows
  alter column id set not null;

alter table public.follows
  add constraint follows_pkey primary key (id);

alter table public.follows
  drop constraint if exists follows_target_unique;

alter table public.follows
  add constraint follows_target_unique
  unique nulls not distinct (follower_id, following_profile_id, following_capper_id);
