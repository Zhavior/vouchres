-- Add Twitter-style @handle to profiles (canonical public identifier).
alter table public.profiles
  add column if not exists handle text;

update public.profiles
set handle = lower(username)
where handle is null
  and username is not null
  and char_length(username) between 3 and 30
  and lower(username) ~ '^[a-z0-9][a-z0-9_]*$';

update public.profiles
set handle = 'user_' || substring(replace(id::text, '-', ''), 1, 8)
where handle is null;

alter table public.profiles
  alter column handle set not null;

alter table public.profiles
  drop constraint if exists profiles_handle_format;

alter table public.profiles
  add constraint profiles_handle_format check (
    char_length(handle) between 3 and 30
    and handle ~ '^[a-z0-9][a-z0-9_]*$'
  );

create unique index if not exists profiles_handle_unique_idx on public.profiles(handle);
create index if not exists profiles_handle_lower_idx on public.profiles(lower(handle));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  raw_handle text;
  chosen_handle text;
begin
  raw_handle := lower(coalesce(
    new.raw_user_meta_data->>'handle',
    new.raw_user_meta_data->>'username',
  ''));
  if raw_handle <> '' and char_length(raw_handle) between 3 and 30
     and raw_handle ~ '^[a-z0-9][a-z0-9_]*$' then
    chosen_handle := raw_handle;
  else
    chosen_handle := 'user_' || substring(replace(new.id::text, '-', ''), 1, 8);
  end if;

  insert into public.profiles (id, username, handle, display_name)
  values (
    new.id,
    chosen_handle,
    chosen_handle,
    coalesce(new.raw_user_meta_data->>'display_name', chosen_handle)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
