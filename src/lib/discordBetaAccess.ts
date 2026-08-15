import { isFounderEmail } from './founderAccess';
import { isDevRuntime } from './adminDevAccess';
import type { CreatorProofProfile } from '../types';

export type DiscordBetaProfile = Partial<CreatorProofProfile> & {
  isAdmin?: boolean;
  admin?: boolean;
  isStaff?: boolean;
  staff?: boolean;
  discordGuildMember?: boolean;
  discordBetaAccess?: boolean;
};

export type DiscordBetaGateOptions = {
  accountId?: string | null;
  email?: string | null;
  /** Override import.meta.env.DEV — tests pass `false` to exercise production rules. */
  isDev?: boolean;
  /** Override VITE_FORCE_DISCORD_BETA_GATE. */
  forceGate?: boolean;
};

function isStaffOrOwnerAccount(profile: DiscordBetaProfile): boolean {
  return Boolean(profile.isStaff || profile.staff || profile.isAdmin || profile.admin);
}

/**
 * Open Beta Discord wall. Guests skip it. Staff/admin skip it (parity with
 * requireAuth). Vite DEV skips it unless VITE_FORCE_DISCORD_BETA_GATE=true
 * so local coding does not trap on stale discord_guild_member flags.
 */
export function isDiscordBetaGateOpen(
  profile: DiscordBetaProfile,
  options: DiscordBetaGateOptions = {},
): boolean {
  const accountId = options.accountId;
  if (accountId == null || accountId === '') return true;
  if (isFounderEmail(options.email)) return true;

  const isDev = options.isDev ?? isDevRuntime();
  const forceGate =
    options.forceGate ?? import.meta.env.VITE_FORCE_DISCORD_BETA_GATE === 'true';
  if (isDev && !forceGate) return true;

  if (isStaffOrOwnerAccount(profile)) return true;

  return profile.discordGuildMember === true && profile.discordBetaAccess === true;
}
