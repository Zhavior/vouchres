-- =========================================================
-- 20260809053000_discord_open_beta_connect.sql
--
-- Discord OAuth2-based Open Beta gating.
--
-- Adds Discord connection/verification state to `profiles` (never raw
-- tokens — those live in the isolated, service-role-only
-- `discord_oauth_tokens` table below, encrypted at rest with AES-256-GCM
-- by the application layer before they ever reach Postgres).
--
-- Naming note: `discord_beta_access` is intentionally namespaced with the
-- `discord_` prefix so it is never confused with the unrelated
-- `FREE_BETA_ALL_ACCESS` env-var switch in server/lib/betaAccess.ts (a
-- temporary "everything unlocked, nobody pays" promo flag). This column is
-- the durable, per-user record of "verified Discord guild member holding
-- the @Open Beta role" and is the single source of truth consulted by
-- hasDiscordBetaAccess() — never a live Discord API call.
-- =========================================================

-- discord_user_id is Discord's numeric snowflake id (from GET /users/@me),
-- stored and compared as an opaque string — not a uuid, never used in
-- arithmetic — so `text` is the correct column type.
alter table public.profiles
  add column if not exists discord_user_id text,
  add column if not exists discord_username text,
  add column if not exists discord_connected_at timestamptz,
  add column if not exists discord_guild_member boolean not null default false,
  add column if not exists discord_beta_access boolean not null default false,
  add column if not exists discord_beta_access_granted_at timestamptz;

-- One Discord account can only ever back one VouchEdge account.
create unique index if not exists profiles_discord_user_id_key
  on public.profiles(discord_user_id)
  where discord_user_id is not null;

comment on column public.profiles.discord_user_id is
  'Discord snowflake user id from GET /users/@me. Never the OAuth token.';
comment on column public.profiles.discord_guild_member is
  'Set true only after a verified PUT guild-member call succeeds (201/204) with the Open Beta role confirmed assigned. Never trust the OAuth token alone as proof.';
comment on column public.profiles.discord_beta_access is
  'Durable Open Beta grant. True only when discord_guild_member is also true. Read via hasDiscordBetaAccess(), never derived from a live Discord API call.';

-- =========================================================
-- discord_oauth_tokens — isolated, encrypted OAuth token store
--
-- Access/refresh tokens are encrypted (AES-256-GCM) by the application
-- before insert and decrypted only in server-only Discord service code.
-- This table intentionally carries no client-facing RLS policy: it is a
-- service-role-only operational store, mirroring stripe_webhook_events
-- (0011_stripe_webhook_events.sql). Purging a user's Discord connection
-- (revoke / disconnect / account deletion) only needs to delete this row —
-- it never touches the durable profiles.discord_* verification fields.
-- =========================================================
create table if not exists public.discord_oauth_tokens (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  encrypted_access_token text not null,
  encrypted_refresh_token text not null,
  token_scope text not null default 'identify guilds.join',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists discord_oauth_tokens_touch_updated_at on public.discord_oauth_tokens;
create trigger discord_oauth_tokens_touch_updated_at
  before update on public.discord_oauth_tokens
  for each row execute function public.touch_updated_at();

alter table public.discord_oauth_tokens enable row level security;

-- No client policies: this is a service-role-only encrypted token vault.
-- (Mirrors stripe_webhook_events — RLS enabled, zero policies, so anon and
-- authenticated are default-denied on all operations. The backend's
-- service-role client bypasses RLS for legitimate reads/writes.)
revoke all on public.discord_oauth_tokens from anon, authenticated;
grant select, insert, update, delete on public.discord_oauth_tokens to service_role;
