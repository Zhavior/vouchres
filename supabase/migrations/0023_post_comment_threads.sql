-- =========================================================
-- 0023_post_comment_threads.sql
-- Threaded replies + comment likes for X-style feed comments.
-- Idempotent and safe to re-run.
-- =========================================================

alter table public.post_comments
  add column if not exists parent_id uuid references public.post_comments(id) on delete cascade;

alter table public.post_comments
  add column if not exists reply_to_user_id uuid references public.profiles(id) on delete set null;

create index if not exists post_comments_parent_idx
  on public.post_comments(post_id, parent_id, created_at);

create table if not exists public.comment_likes (
  comment_id uuid not null references public.post_comments(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, profile_id)
);

create index if not exists comment_likes_profile_idx
  on public.comment_likes(profile_id, created_at desc);

alter table public.comment_likes enable row level security;

drop policy if exists "comment_likes_read_all" on public.comment_likes;
create policy "comment_likes_read_all"
  on public.comment_likes for select using (true);

drop policy if exists "comment_likes_insert_self" on public.comment_likes;
create policy "comment_likes_insert_self"
  on public.comment_likes for insert
  with check (auth.uid() = profile_id);

drop policy if exists "comment_likes_delete_self" on public.comment_likes;
create policy "comment_likes_delete_self"
  on public.comment_likes for delete
  using (auth.uid() = profile_id);
