-- =========================================================
-- 20260807095357_rls_lockdown_all_writes.sql
--
-- SECURITY: Drop all remaining INSERT/UPDATE/DELETE RLS policies on public
-- tables that allowed the authenticated or anon client to write directly from
-- the browser. This eliminates the attack surface for malicious scripts that
-- would try to forge massive amounts of data and rack up Supabase billing charges.
--
-- Legitimate writes are unaffected because they route through the backend API,
-- which uses the service_role key to bypass RLS.
-- =========================================================

-- Drop post and interaction policies
drop policy if exists "posts_insert_self" on public.posts;
drop policy if exists "posts_update_self" on public.posts;
drop policy if exists "posts_delete_self" on public.posts;

drop policy if exists "likes_insert_self" on public.post_likes;
drop policy if exists "likes_delete_self" on public.post_likes;

drop policy if exists "comments_insert_self" on public.post_comments;
drop policy if exists "comments_delete_self" on public.post_comments;

drop policy if exists "comment_likes_insert" on public.comment_likes;
drop policy if exists "comment_likes_delete" on public.comment_likes;

-- Drop social and trust policies
drop policy if exists "follows_insert_self" on public.follows;
drop policy if exists "follows_delete_self" on public.follows;

drop policy if exists "vouches_insert" on public.vouches;
drop policy if exists "vouches_update" on public.vouches;

drop policy if exists "player_vouches_insert" on public.player_vouches;
drop policy if exists "player_vouches_delete" on public.player_vouches;

-- Drop notification and preference policies
drop policy if exists "notifications_insert_self" on public.notifications;
drop policy if exists "notifications_update_self" on public.notifications;
drop policy if exists "notifications_delete_self" on public.notifications;

drop policy if exists "notification_preferences_insert_self" on public.notification_preferences;
drop policy if exists "notification_preferences_update_self" on public.notification_preferences;

drop policy if exists "push_subscriptions_insert_self" on public.push_subscriptions;
drop policy if exists "push_subscriptions_update_self" on public.push_subscriptions;
drop policy if exists "push_subscriptions_delete_self" on public.push_subscriptions;

drop policy if exists "today_personalization_preferences_insert" on public.today_personalization_preferences;
drop policy if exists "today_personalization_preferences_update" on public.today_personalization_preferences;
drop policy if exists "today_personalization_preferences_delete" on public.today_personalization_preferences;

-- Drop messaging and chat policies
drop policy if exists "world_chat_profiles_insert" on public.world_chat_profiles;
drop policy if exists "world_chat_profiles_update" on public.world_chat_profiles;

drop policy if exists "world_chat_messages_insert" on public.world_chat_messages;

drop policy if exists "world_chat_message_reactions_insert" on public.world_chat_message_reactions;
drop policy if exists "world_chat_message_reactions_delete" on public.world_chat_message_reactions;

drop policy if exists "subscriber_channel_messages_insert" on public.subscriber_channel_messages;

-- Drop miscellaneous policies
drop policy if exists "beta_insert_self" on public.beta_signups;
drop policy if exists "pick_audit_log_insert_own" on public.pick_audit_log;

-- The default deny posture is now fully enforced for writes from the client across the whole schema.
