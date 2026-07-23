/** World Chat storage contract — honest about active backend mode. */

export type WorldChatStorageMeta =
  | {
      mode: "supabase_durable";
      multiInstanceSafe: true;
      persistence: "postgres";
      note: string;
      fallbackReason: null;
    }
  | {
      mode: "in_memory_ephemeral";
      multiInstanceSafe: false;
      persistence: "none";
      note: string;
      fallbackReason: string | null;
    };

function hasSupabaseAdminConfig(): boolean {
  return Boolean(
    (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * When true, World Chat must not silently write to process memory.
 * Default: on in production, off elsewhere (tests / local without DB).
 * Override with WORLD_CHAT_REQUIRE_DURABLE=1|0.
 */
export function requireDurableWorldChat(): boolean {
  const raw = String(process.env.WORLD_CHAT_REQUIRE_DURABLE ?? "")
    .trim()
    .toLowerCase();
  if (raw === "1" || raw === "true" || raw === "yes") return true;
  if (raw === "0" || raw === "false" || raw === "no") return false;
  return process.env.NODE_ENV === "production";
}

export function durableWorldChatStorageMeta(): WorldChatStorageMeta {
  return {
    mode: "supabase_durable",
    multiInstanceSafe: true,
    persistence: "postgres",
    note:
      "Messages and chat profiles are stored in Supabase and are shared across instances. " +
      "World Chat is durable when the required tables are present.",
    fallbackReason: null,
  };
}

export function ephemeralWorldChatStorageMeta(
  fallbackReason: string | null = null,
): WorldChatStorageMeta {
  return {
    mode: "in_memory_ephemeral",
    multiInstanceSafe: false,
    persistence: "none",
    note:
      "Messages are stored in process memory only. They reset on restart and are not shared across instances. " +
      "Do not treat world chat as durable until the Supabase backend is available.",
    fallbackReason,
  };
}

export function worldChatStorageMeta(): WorldChatStorageMeta {
  if (hasSupabaseAdminConfig()) {
    return durableWorldChatStorageMeta();
  }
  return ephemeralWorldChatStorageMeta("supabase_admin_unavailable");
}

export function logWorldChatEphemeralBootNotice(): void {
  if (process.env.NODE_ENV !== "production") return;

  if (!hasSupabaseAdminConfig()) {
    if (requireDurableWorldChat()) {
      console.error(
        "[boot] World Chat requires durable storage in production, but Supabase admin config is unavailable. Writes will fail closed.",
      );
      return;
    }
    console.log(
      "[boot] World chat is in-memory ephemeral because Supabase admin config is unavailable.",
    );
    return;
  }

  if (requireDurableWorldChat()) {
    console.log("[boot] World Chat durable-only mode enabled (WORLD_CHAT_REQUIRE_DURABLE).");
  }
}
