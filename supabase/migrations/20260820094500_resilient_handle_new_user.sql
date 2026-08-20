-- Prevent handle collision crashes on signup trigger (500 "Database error saving new user")
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

  -- If chosen_handle is already taken by a different user, fall back to unique user_<id>
  if exists (select 1 from public.profiles where (handle = chosen_handle or username = chosen_handle) and id <> new.id) then
    chosen_handle := 'user_' || substring(replace(new.id::text, '-', ''), 1, 8);
  end if;

  insert into public.profiles (id, username, handle, display_name)
  values (
    new.id,
    chosen_handle,
    chosen_handle,
    coalesce(new.raw_user_meta_data->>'display_name', chosen_handle)
  )
  on conflict (id) do update set
    username = excluded.username,
    handle = excluded.handle,
    display_name = excluded.display_name;
  return new;
end;
$$;
