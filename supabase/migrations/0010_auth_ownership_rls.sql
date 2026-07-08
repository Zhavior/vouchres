-- =========================================================
-- 0010_auth_ownership_rls.sql
--
-- RLS ownership hardening for notification-owned tables plus explicit
-- ownership policy refreshes for existing user-owned tables.
-- Idempotent and safe to re-run.
-- =========================================================

-- Notifications/preferences/push subscriptions were added after the base
-- schema, so make their RLS posture explicit here.
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists "notifications_select_self" on public.notifications;
create policy "notifications_select_self"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "notifications_insert_self" on public.notifications;
create policy "notifications_insert_self"
  on public.notifications for insert
  with check (auth.uid() = user_id);

drop policy if exists "notifications_update_self" on public.notifications;
create policy "notifications_update_self"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "notifications_delete_self" on public.notifications;
create policy "notifications_delete_self"
  on public.notifications for delete
  using (auth.uid() = user_id);

drop policy if exists "notification_preferences_select_self" on public.notification_preferences;
create policy "notification_preferences_select_self"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "notification_preferences_insert_self" on public.notification_preferences;
create policy "notification_preferences_insert_self"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "notification_preferences_update_self" on public.notification_preferences;
create policy "notification_preferences_update_self"
  on public.notification_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "push_subscriptions_select_self" on public.push_subscriptions;
create policy "push_subscriptions_select_self"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "push_subscriptions_insert_self" on public.push_subscriptions;
create policy "push_subscriptions_insert_self"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists "push_subscriptions_update_self" on public.push_subscriptions;
create policy "push_subscriptions_update_self"
  on public.push_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "push_subscriptions_delete_self" on public.push_subscriptions;
create policy "push_subscriptions_delete_self"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

-- Existing billing records are user-readable only; writes stay service-role
-- only because there are no insert/update/delete policies.
alter table public.subscriptions enable row level security;
drop policy if exists "subscriptions_read_self" on public.subscriptions;
create policy "subscriptions_read_self"
  on public.subscriptions for select
  using (auth.uid() = profile_id);

-- Existing pick/parlay policies should already be applied by 0005. Re-apply
-- the private/public read policy so raw anon clients cannot read private picks.
alter table public.picks enable row level security;
alter table public.pick_legs enable row level security;

drop policy if exists "picks_read_all" on public.picks;
drop policy if exists "picks_read_public_or_own" on public.picks;
create policy "picks_read_public_or_own"
  on public.picks for select
  using (coalesce(visibility::text, 'private') = 'public' or auth.uid() = user_id);

drop policy if exists "picks_delete_self" on public.picks;
create policy "picks_delete_self"
  on public.picks for delete
  using (auth.uid() = user_id);

drop policy if exists "pick_legs_read_all" on public.pick_legs;
drop policy if exists "pick_legs_read_public_or_own" on public.pick_legs;
create policy "pick_legs_read_public_or_own"
  on public.pick_legs for select
  using (
    exists (
      select 1 from public.picks p
      where p.id = pick_id
        and (coalesce(p.visibility::text, 'private') = 'public' or p.user_id = auth.uid())
    )
  );
