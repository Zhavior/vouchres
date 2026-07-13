-- A post's social identity must survive a refresh. Legacy rows remain
-- discussions unless they are linked to a pick.
alter table public.posts
  add column if not exists post_kind text not null default 'discussion';

alter table public.posts
  drop constraint if exists posts_post_kind_check;

alter table public.posts
  add constraint posts_post_kind_check
  check (post_kind in ('discussion', 'research_note', 'result', 'vouch', 'parlay', 'audio'));

alter table public.posts
  add column if not exists media_url text,
  add column if not exists media_type text;

alter table public.posts
  drop constraint if exists posts_media_type_check;

alter table public.posts
  add constraint posts_media_type_check
  check (media_type is null or media_type in ('audio'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media',
  'post-media',
  true,
  8388608,
  array['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
