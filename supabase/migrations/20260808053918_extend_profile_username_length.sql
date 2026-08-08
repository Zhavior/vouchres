-- `handle` already permits 30 characters, and the signup trigger copies that
-- value into the legacy `username` column. Keep both constraints aligned.
alter table public.profiles
  drop constraint if exists profiles_username_check;

alter table public.profiles
  add constraint profiles_username_check
  check (char_length(username) between 3 and 30);
