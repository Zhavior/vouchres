-- Lock down SECURITY DEFINER RPCs and world-readable tables.
--
-- Background: Postgres grants EXECUTE on new functions to PUBLIC by default,
-- and Supabase exposes every public-schema function at /rest/v1/rpc/<name> to
-- the anon key (which ships in the browser bundle by design). Six SECURITY
-- DEFINER functions were created without a REVOKE, so they were callable
-- unauthenticated. Separately, a number of tables carry `for select using (true)`
-- policies, which makes PostgREST hand their rows to anon directly — bypassing
-- the Express authorization layer entirely.
--
-- Three strategies below, chosen per object:
--   A. Functions            -> hard revoke. No client calls these directly.
--   B. Non-realtime tables  -> hard revoke. All reads go through the service role.
--   C. Realtime-backed      -> scoped RLS policy, NOT a revoke. Supabase Realtime
--      tables                 evaluates RLS per subscriber; a revoke would silently
--                             kill live updates, so these get a correct policy instead.

-- =========================================================
-- A. SECURITY DEFINER functions — server-only
-- =========================================================
-- Signature-agnostic so this stays correct across overloads and future arg changes.
do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname in (
        'export_user_data',           -- full PII dump for an arbitrary user id
        'anonymize_user_picks',       -- hard DELETE of an arbitrary user's picks
        'record_resolution_outcome',  -- writes the grading/resolution audit trail
        'increment_quota',            -- write any user's AI quota counters
        'get_user_quota',             -- read any user's usage
        'increment_post_view'         -- inflate any post's view count
      )
  loop
    execute format('revoke all on function %s from public, anon, authenticated', fn.sig);
    execute format('grant execute on function %s to service_role', fn.sig);
  end loop;
end $$;

-- Defense in depth: export_user_data is the highest-value one, so make it
-- self-service-only even if some future grant re-exposes it.
create or replace function public.export_user_data(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  result json;
begin
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'export_user_data: callers may only export their own data';
  end if;

  select json_build_object(
    'profile',       (select row_to_json(p) from public.profiles p where p.id = p_user_id),
    'picks',         (select coalesce(json_agg(row_to_json(x)), '[]'::json) from public.picks x where x.user_id = p_user_id),
    'posts',         (select coalesce(json_agg(row_to_json(x)), '[]'::json) from public.posts x where x.author_id = p_user_id),
    'post_comments', (select coalesce(json_agg(row_to_json(x)), '[]'::json) from public.post_comments x where x.author_id = p_user_id),
    'post_likes',    (select coalesce(json_agg(row_to_json(x)), '[]'::json) from public.post_likes x where x.profile_id = p_user_id),
    'follows',       (select coalesce(json_agg(row_to_json(x)), '[]'::json) from public.follows x where x.follower_id = p_user_id),
    'followers',     (select coalesce(json_agg(row_to_json(x)), '[]'::json) from public.follows x where x.following_profile_id = p_user_id)
  ) into result;

  return result;
end;
$$;

revoke all on function public.export_user_data(uuid) from public, anon, authenticated;
grant execute on function public.export_user_data(uuid) to service_role;

comment on function public.export_user_data(uuid) is
  'Server-only (service_role). GDPR export. Also self-checks auth.uid() as defense in depth.';

-- =========================================================
-- B. Non-realtime tables — hard revoke, server reads only
-- =========================================================
-- profiles is the highest-impact: RLS SELECT policies are row-level, not
-- column-level, so `using (true)` exposed email, stripe_customer_id,
-- stripe_subscription_id, is_staff and jurisdiction to anon.
revoke all on public.profiles                   from anon, authenticated;
revoke all on public.post_comments              from anon, authenticated;
revoke all on public.post_likes                 from anon, authenticated;
revoke all on public.comment_likes              from anon, authenticated;
revoke all on public.cappers                    from anon, authenticated;
revoke all on public.pick_legs                  from anon, authenticated;
revoke all on public.daily_quotas               from anon, authenticated;
revoke all on public.push_subscriptions         from anon, authenticated;
revoke all on public.notification_preferences   from anon, authenticated;
revoke all on public.grading_logs               from anon, authenticated;
revoke all on public.pick_audit_log             from anon, authenticated;
revoke all on public.resolution_contracts       from anon, authenticated;
revoke all on public.resolution_outcomes        from anon, authenticated;
revoke all on public.resolution_sla_metrics     from anon, authenticated;

grant all on public.profiles                    to service_role;
grant all on public.post_comments               to service_role;
grant all on public.post_likes                  to service_role;
grant all on public.comment_likes               to service_role;
grant all on public.cappers                     to service_role;
grant all on public.pick_legs                   to service_role;
grant all on public.daily_quotas                to service_role;
grant all on public.push_subscriptions          to service_role;
grant all on public.notification_preferences    to service_role;
grant all on public.grading_logs                to service_role;
grant all on public.pick_audit_log              to service_role;
grant all on public.resolution_contracts        to service_role;
grant all on public.resolution_outcomes         to service_role;
grant all on public.resolution_sla_metrics      to service_role;

-- =========================================================
-- C. Realtime-backed tables — scoped policies, keep the subscription working
-- =========================================================
-- These are subscribed to from the browser (useFollowingHub, useSocialGraph,
-- WorldChatPanel, subscriber club chat). Realtime re-evaluates RLS per
-- subscriber, so a correct policy preserves live updates while closing the
-- anon read. The Express layer remains the primary gate; this is the backstop.

-- notifications: strictly your own.
drop policy if exists "notifications_read_all"  on public.notifications;
drop policy if exists "notifications_read_own"  on public.notifications;
create policy "notifications_read_own"
  on public.notifications for select
  using (auth.uid() = user_id);

-- dm_participants: your own membership rows only.
--
-- NOTE: this policy must NOT sub-select from dm_participants. A policy on a
-- table that queries the same table re-enters policy evaluation and Postgres
-- aborts with "infinite recursion detected in policy for relation
-- dm_participants", which would break DMs outright. The direct predicate is
-- both recursion-free and sufficient: the hooks use realtime purely as a
-- refresh trigger and re-fetch the full conversation through the API.
drop policy if exists "dm_participants_read_all" on public.dm_participants;
drop policy if exists "dm_participants_read_own" on public.dm_participants;
create policy "dm_participants_read_own"
  on public.dm_participants for select
  using (auth.uid() = user_id);

-- dm_conversations / dm_messages: membership-gated.
drop policy if exists "dm_conversations_read_all" on public.dm_conversations;
drop policy if exists "dm_conversations_read_own" on public.dm_conversations;
create policy "dm_conversations_read_own"
  on public.dm_conversations for select
  using (
    exists (
      select 1 from public.dm_participants p
      where p.conversation_id = dm_conversations.id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "dm_messages_read_all" on public.dm_messages;
drop policy if exists "dm_messages_read_own" on public.dm_messages;
create policy "dm_messages_read_own"
  on public.dm_messages for select
  using (
    exists (
      select 1 from public.dm_participants p
      where p.conversation_id = dm_messages.conversation_id
        and p.user_id = auth.uid()
    )
  );

-- story_views: the viewer, or the owner of the story being viewed.
drop policy if exists "story_views_read_all" on public.story_views;
drop policy if exists "story_views_read_scoped" on public.story_views;
create policy "story_views_read_scoped"
  on public.story_views for select
  using (
    auth.uid() = viewer_id
    or exists (
      select 1 from public.user_stories s
      where s.id = story_views.story_id
        and s.user_id = auth.uid()
    )
  );

-- user_stories / user_status_notes: yourself, or someone you follow. Unexpired only.
drop policy if exists "user_stories_read_all" on public.user_stories;
drop policy if exists "user_stories_read_scoped" on public.user_stories;
create policy "user_stories_read_scoped"
  on public.user_stories for select
  using (
    auth.uid() = user_id
    or (
      expires_at > now()
      and exists (
        select 1 from public.follows f
        where f.follower_id = auth.uid()
          and f.following_profile_id = user_stories.user_id
      )
    )
  );

drop policy if exists "user_status_notes_read_all" on public.user_status_notes;
drop policy if exists "user_status_notes_read_scoped" on public.user_status_notes;
create policy "user_status_notes_read_scoped"
  on public.user_status_notes for select
  using (
    auth.uid() = user_id
    or (
      expires_at > now()
      and exists (
        select 1 from public.follows f
        where f.follower_id = auth.uid()
          and f.following_profile_id = user_status_notes.user_id
      )
    )
  );

-- follows: the social graph is only visible to participants in the edge.
drop policy if exists "follows_read_all" on public.follows;
drop policy if exists "follows_read_scoped" on public.follows;
create policy "follows_read_scoped"
  on public.follows for select
  using (auth.uid() = follower_id or auth.uid() = following_profile_id);

-- posts: demo content is public; real posts are author-or-follower, matching
-- the fail-closed 404 behaviour in server/routes/postRoutes.ts.
drop policy if exists "posts_read_all" on public.posts;
drop policy if exists "posts_read_scoped" on public.posts;
create policy "posts_read_scoped"
  on public.posts for select
  using (
    is_demo
    or auth.uid() = author_id
    or exists (
      select 1 from public.follows f
      where f.follower_id = auth.uid()
        and f.following_profile_id = posts.author_id
    )
  );

-- picks: mirrors picks_read_public_or_own from 0010_auth_ownership_rls.sql.
-- Re-asserted here because supabase/schema.sql still carries the old
-- `picks_read_all` policy, so a `db push` of that file can regress it.
drop policy if exists "picks_read_all" on public.picks;
drop policy if exists "picks_read_public_or_own" on public.picks;
create policy "picks_read_public_or_own"
  on public.picks for select
  using (visibility = 'public' or auth.uid() = user_id);

-- subscriber_channel_messages: was `using (true)` — every club chat message,
-- including private `owner` channels, was world-readable. Scope to the author,
-- the owner of an `owner` channel, and followers of the target for the
-- capper/profile channels. The full paid-membership check stays in
-- server/routes/subscriberRoutes.ts (assertCanAccessSubscriberChannel); this
-- policy is the backstop that stops anonymous bulk reads.
drop policy if exists "subscriber_channel_messages_read" on public.subscriber_channel_messages;
drop policy if exists "subscriber_channel_messages_read_scoped" on public.subscriber_channel_messages;
create policy "subscriber_channel_messages_read_scoped"
  on public.subscriber_channel_messages for select
  using (
    auth.uid() = author_id
    or (channel_kind = 'owner' and channel_target_id = auth.uid()::text)
    or (
      channel_kind = 'profile'
      and exists (
        select 1 from public.follows f
        where f.follower_id = auth.uid()
          and f.following_profile_id::text = subscriber_channel_messages.channel_target_id
      )
    )
    or (
      channel_kind = 'capper'
      and exists (
        select 1 from public.follows f
        where f.follower_id = auth.uid()
          and f.following_capper_id = subscriber_channel_messages.channel_target_id
      )
    )
  );
