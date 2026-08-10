/**
 * TypeScript shapes for the Discord REST responses this backend consumes.
 * Intentionally narrow — only the fields VouchEdge actually reads.
 */

/** POST https://discord.com/api/oauth2/token response. */
export interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

/** GET https://discord.com/api/users/@me response (subset). */
export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
}

/** GET/PUT guild member object (subset — https://discord.com/developers/docs/resources/guild#guild-member-object). */
export interface DiscordGuildMember {
  user?: DiscordUser;
  nick: string | null;
  roles: string[];
  joined_at: string;
  pending?: boolean;
}

/** Discord's standard JSON error body shape. */
export interface DiscordApiErrorBody {
  code?: number;
  message?: string;
  errors?: Record<string, unknown>;
}

export class DiscordApiError extends Error {
  readonly status: number;
  readonly body: DiscordApiErrorBody | null;
  readonly endpoint: string;

  constructor(params: { status: number; body: DiscordApiErrorBody | null; endpoint: string }) {
    super(
      `Discord API ${params.endpoint} failed with ${params.status}${
        params.body?.message ? `: ${params.body.message}` : ""
      }`,
    );
    this.name = "DiscordApiError";
    this.status = params.status;
    this.body = params.body;
    this.endpoint = params.endpoint;
  }
}

/** Structured outcome of the guild-join + role-assignment attempt. */
export type GuildJoinOutcome =
  | { kind: "joined_new_member"; roleAssigned: true }
  | { kind: "already_member_role_assigned"; roleAssigned: true }
  | { kind: "forbidden"; roleAssigned: false; reason: string }
  | { kind: "token_expired"; roleAssigned: false }
  | { kind: "error"; roleAssigned: false; reason: string };
