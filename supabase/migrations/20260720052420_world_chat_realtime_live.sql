-- Enable safe browser-side realtime reads for live World Chat and DMs.
-- Writes remain on the server routes; this only unlocks subscription reads.

grant select on public.world_chat_channels to authenticated;
grant select on public.world_chat_messages to authenticated;
grant select on public.world_chat_custom_emojis to authenticated;
grant select on public.world_chat_message_reactions to authenticated;

grant select on public.dm_conversations to authenticated;
grant select on public.dm_participants to authenticated;
grant select on public.dm_messages to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'world_chat_channels'
  ) then
    alter publication supabase_realtime add table public.world_chat_channels;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'world_chat_messages'
  ) then
    alter publication supabase_realtime add table public.world_chat_messages;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'world_chat_custom_emojis'
  ) then
    alter publication supabase_realtime add table public.world_chat_custom_emojis;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'world_chat_message_reactions'
  ) then
    alter publication supabase_realtime add table public.world_chat_message_reactions;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'dm_conversations'
  ) then
    alter publication supabase_realtime add table public.dm_conversations;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'dm_participants'
  ) then
    alter publication supabase_realtime add table public.dm_participants;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'dm_messages'
  ) then
    alter publication supabase_realtime add table public.dm_messages;
  end if;
end
$$;
