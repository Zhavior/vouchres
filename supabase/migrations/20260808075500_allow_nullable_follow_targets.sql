-- The original composite primary key made both target columns NOT NULL.
-- Dropping that key does not relax the inherited nullability automatically.
alter table public.follows
  alter column following_profile_id drop not null,
  alter column following_capper_id drop not null;
