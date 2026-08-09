/**
 * MANUAL, HUMAN-IN-THE-LOOP test against your REAL Discord server and bot
 * token. This is intentionally NOT part of the automated test suite (it is
 * not under tests/, vitest's `include` glob never picks it up, and it is
 * not wired into `npm run quality`/CI) — it makes real network calls to
 * discord.com and writes real rows to your Supabase project, using a
 * throwaway Discord account you control.
 *
 * It exercises the exact same production functions the real HTTP routes
 * call — completeDiscordConnection() (what GET /api/discord/callback runs)
 * and retryDiscordGuildJoin() (what POST /api/discord/retry-join runs) — so
 * there is no drift between what this script proves and what ships. It does
 * NOT mock anything: the Discord REST calls inside those functions are real,
 * and this script also makes its own independent read-only
 * GET /guilds/{guild}/members/{user} calls (bot token) before/after each
 * phase to verify Discord's *actual* state, rather than trusting our own
 * function's return value alone.
 *
 * Prerequisites:
 *   - .env.local has real values for DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET,
 *     DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_OPEN_BETA_ROLE_ID,
 *     DISCORD_REDIRECT_URI, DISCORD_TOKEN_ENCRYPTION_KEY,
 *     DISCORD_OAUTH_STATE_SECRET (or DISCORD_CLIENT_SECRET as its fallback),
 *     SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 *   - A real row in your Supabase `profiles` table to act as the "VouchEdge
 *     user" for this test (any throwaway test account you already created
 *     works — its id is what you pass as --user-id).
 *   - A throwaway Discord account (NOT your main account) you can log into
 *     in a private/incognito browser window.
 *   - DISCORD_REDIRECT_URI must point at a real, reachable instance of THIS
 *     app's GET /api/discord/callback (e.g. your local dev server or a
 *     staging deploy) — that's the endpoint Discord redirects to, and it's
 *     the same one production traffic hits.
 *
 * Usage:
 *   node --env-file=.env.local --import tsx scripts/manualTestDiscordRejoin.ts \
 *     --user-id <supabase-profiles-uuid> --phase fresh-join
 *
 *   node --env-file=.env.local --import tsx scripts/manualTestDiscordRejoin.ts \
 *     --user-id <supabase-profiles-uuid> --phase retry-only
 *
 *   node --env-file=.env.local --import tsx scripts/manualTestDiscordRejoin.ts \
 *     --user-id <supabase-profiles-uuid> --phase both
 *
 * Phases:
 *   fresh-join  — proves a user who is NOT yet a guild member gets added
 *                 AND gets @Open Beta on first connect (expects Discord's
 *                 201 path). Requires the throwaway account to not already
 *                 be a member of the guild — leave/kick it first if a
 *                 previous run added it.
 *   retry-only  — proves a user who IS already a guild member, but lacks
 *                 @Open Beta, gets the role applied via retryDiscordGuildJoin
 *                 (the same function POST /api/discord/retry-join calls).
 *                 Requires completeDiscordConnection to have already run once
 *                 for --user-id (run fresh-join first, or connect once via
 *                 the real UI) so discord_oauth_tokens has a row to refresh
 *                 from. The script will prompt you to remove @Open Beta from
 *                 the throwaway account in Discord before it calls retry, so
 *                 the "204 (already a member) + role missing" case is real.
 *   both        — runs fresh-join then retry-only back to back (default).
 */
import readline from "node:readline/promises";
import { assertDiscordConfigured, DISCORD_API_BASE } from "../server/services/discord/discordConfig";
import { createDiscordOAuthState } from "../server/services/discord/discordOAuthState";
import { completeDiscordConnection, retryDiscordGuildJoin } from "../server/services/discord/discordConnectionService";
import { getDiscordProfileState } from "../server/repositories/discordProfileRepository";
import type { DiscordGuildMember, DiscordApiErrorBody } from "../server/services/discord/discordTypes";

function readCliValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length).trim() || undefined;
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0) {
    const next = process.argv[index + 1];
    if (next && !next.startsWith("--")) return next.trim() || undefined;
  }
  return undefined;
}

function section(title: string): void {
  console.log(`\n${"=".repeat(70)}\n${title}\n${"=".repeat(70)}`);
}

function pass(message: string): void {
  console.log(`  \u2705 PASS — ${message}`);
}

function fail(message: string): never {
  console.error(`  \u274c FAIL — ${message}`);
  process.exitCode = 1;
  throw new Error(message);
}

/**
 * Independent, read-only confirmation of Discord's actual state — deliberately
 * NOT reusing server/services/discord/discordApiClient so this check has no
 * shared code path with the functions under test. A raw bot-token GET.
 */
async function fetchGuildMemberDirect(discordUserId: string): Promise<
  { status: 200; member: DiscordGuildMember } | { status: 404; member: null } | { status: number; member: null; errorBody: DiscordApiErrorBody | null }
> {
  const config = assertDiscordConfigured();
  const res = await fetch(`${DISCORD_API_BASE}/guilds/${config.guildId}/members/${discordUserId}`, {
    headers: { Authorization: `Bot ${config.botToken}` },
    signal: AbortSignal.timeout(8000),
  });

  if (res.status === 200) return { status: 200, member: (await res.json()) as DiscordGuildMember };
  if (res.status === 404) return { status: 404, member: null };
  const errorBody = await res.json().catch(() => null);
  return { status: res.status, member: null, errorBody };
}

async function printIndependentDiscordState(discordUserId: string, label: string): Promise<{ isMember: boolean; hasRole: boolean }> {
  const config = assertDiscordConfigured();
  const result = await fetchGuildMemberDirect(discordUserId);

  if (result.status === 404) {
    console.log(`  [independent Discord check — ${label}] user is NOT a guild member.`);
    return { isMember: false, hasRole: false };
  }
  if (result.status !== 200) {
    console.log(`  [independent Discord check — ${label}] unexpected status ${result.status}`, result.errorBody);
    return { isMember: false, hasRole: false };
  }

  const hasRole = result.member.roles.includes(config.openBetaRoleId);
  console.log(
    `  [independent Discord check — ${label}] user IS a guild member. roles=[${result.member.roles.join(", ")}] ` +
      `@Open Beta present=${hasRole}`,
  );
  return { isMember: true, hasRole };
}

async function printProfileState(userId: string, label: string): Promise<Awaited<ReturnType<typeof getDiscordProfileState>>> {
  const state = await getDiscordProfileState(userId);
  console.log(`  [profiles row — ${label}]`, JSON.stringify(state, null, 2));
  return state;
}

async function promptForAuthorizationCode(rl: readline.Interface, userId: string): Promise<string> {
  const state = createDiscordOAuthState(userId);
  const config = assertDiscordConfigured();
  const url = new URL("https://discord.com/api/oauth2/authorize");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify guilds.join");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "consent");

  console.log("\n  1. Open this URL in a PRIVATE/INCOGNITO browser window, logged in as your THROWAWAY Discord account:\n");
  console.log(`     ${url.toString()}\n`);
  console.log("  2. Approve the authorization prompt.");
  console.log(`  3. You'll land on ${config.redirectUri}?code=...&state=... — copy the full resulting URL (or just the code param).\n`);

  const pasted = await rl.question("Paste the redirected URL (or bare code) here: ");
  const trimmed = pasted.trim();

  try {
    const parsed = new URL(trimmed);
    const code = parsed.searchParams.get("code");
    if (!code) fail("Pasted URL has no ?code= param — did the authorization actually succeed?");
    return code;
  } catch {
    // Not a URL — treat the whole paste as the bare code.
    if (!trimmed) fail("No code provided.");
    return trimmed;
  }
}

async function runFreshJoinPhase(rl: readline.Interface, userId: string): Promise<void> {
  section("PHASE: fresh-join — user is NOT yet a guild member");
  console.log("  Confirm in Discord (People/Members list) that your throwaway account is");
  console.log("  currently NOT a member of the guild before continuing. If a previous run");
  console.log("  added it, kick it from the server now.\n");
  await rl.question("  Press Enter once confirmed... ");

  const code = await promptForAuthorizationCode(rl, userId);

  console.log("\n  Calling the REAL completeDiscordConnection({ userId, code }) — same function GET /api/discord/callback runs...");
  const outcome = await completeDiscordConnection({ userId, code });
  console.log("  completeDiscordConnection() returned:", JSON.stringify(outcome, null, 2));

  if (!outcome.ok) {
    fail(`completeDiscordConnection failed outright: ${outcome.reason}`);
  }

  const profileState = await printProfileState(userId, "after fresh-join");
  if (!profileState?.discordUserId) fail("profiles.discord_user_id was not persisted.");

  const independent = await printIndependentDiscordState(profileState.discordUserId, "after fresh-join");

  if (!outcome.guildMember) {
    fail(`Guild join did not succeed (reason: ${(outcome as { reason?: string }).reason ?? "unknown"}). ` +
      "See the [discord] console.error/warn lines above this script's output for the loud failure detail.");
  }
  if (!independent.isMember) fail("Discord's own API says this user is NOT a guild member, but our outcome claimed success.");
  if (!independent.hasRole) fail("Discord's own API says @Open Beta is NOT present, but our outcome claimed success.");
  if (!profileState.betaAccess || !profileState.discordGuildMember) {
    fail("profiles.discord_beta_access / discord_guild_member were not both set true.");
  }

  pass("New member added AND @Open Beta assigned on first connect (fresh-join / expected 201 path).");
}

async function runRetryOnlyPhase(rl: readline.Interface, userId: string): Promise<void> {
  section("PHASE: retry-only — user IS a guild member, but lacks @Open Beta");

  const before = await printProfileState(userId, "before retry-only");
  if (!before?.discordUserId) {
    fail("No discord_user_id on this profile yet — run --phase fresh-join first, or connect once via the real UI.");
  }
  const discordUserId = before.discordUserId;

  const currentState = await printIndependentDiscordState(discordUserId, "before retry-only");
  if (!currentState.isMember) {
    fail("This user is not currently a Discord guild member — retry-only requires an EXISTING member. Run fresh-join first.");
  }

  if (currentState.hasRole) {
    console.log("\n  This account currently HAS @Open Beta. To make this a meaningful test of the");
    console.log("  204 (already a member) + role-assignment path, manually remove ONLY the");
    console.log("  @Open Beta role from this account in Discord's server member list now");
    console.log("  (do NOT kick them — they must remain a guild member).\n");
    await rl.question("  Press Enter once the role has been removed... ");

    const recheck = await printIndependentDiscordState(discordUserId, "after manual role removal");
    if (recheck.hasRole) fail("@Open Beta is still present — role removal didn't take effect. Re-check in Discord and re-run.");
    if (!recheck.isMember) fail("User is no longer a guild member — do not kick them, only remove the role.");
  }

  console.log("\n  Calling the REAL retryDiscordGuildJoin(userId) — same function POST /api/discord/retry-join runs...");
  const outcome = await retryDiscordGuildJoin(userId);
  console.log("  retryDiscordGuildJoin() returned:", JSON.stringify(outcome, null, 2));

  if (!outcome.ok) fail(`retryDiscordGuildJoin reported not connected: ${outcome.reason}`);

  const after = await printProfileState(userId, "after retry-only");
  const independentAfter = await printIndependentDiscordState(discordUserId, "after retry-only");

  if (!outcome.guildMember) {
    fail(`Retry did not succeed (reason: ${(outcome as { reason?: string }).reason ?? "unknown"}). ` +
      "See the [discord] console.error/warn lines above this script's output for the loud failure detail.");
  }
  if (!independentAfter.hasRole) fail("Discord's own API says @Open Beta is still NOT present after retry.");
  if (!after?.betaAccess || !after.discordGuildMember) {
    fail("profiles.discord_beta_access / discord_guild_member were not both set true after retry.");
  }

  pass("Already-a-member user got @Open Beta applied via the retry-join path (expected 204 + role-PUT path).");
}

async function main(): Promise<void> {
  const userId = readCliValue("user-id");
  const phase = readCliValue("phase") ?? "both";

  if (!userId) {
    console.error("Usage: --user-id <supabase-profiles-uuid> [--phase fresh-join|retry-only|both]");
    process.exit(1);
  }
  if (!["fresh-join", "retry-only", "both"].includes(phase)) {
    console.error(`Unknown --phase "${phase}". Expected fresh-join, retry-only, or both.`);
    process.exit(1);
  }

  // Fails loudly here (before touching Discord/Supabase) if any DISCORD_* env
  // var is missing — same guard every real route/service uses.
  assertDiscordConfigured();

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    if (phase === "fresh-join" || phase === "both") {
      await runFreshJoinPhase(rl, userId);
    }
    if (phase === "retry-only" || phase === "both") {
      await runRetryOnlyPhase(rl, userId);
    }
    section("ALL REQUESTED PHASES PASSED");
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error("\n[manualTestDiscordRejoin] FAILED:", error instanceof Error ? error.message : error);
  process.exitCode = process.exitCode ?? 1;
});
