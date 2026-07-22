import { getSupabaseAdmin } from "../middleware/auth";

export interface WorldChatMessageRecord {
  id?: string;
  room_id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  content: string;
  badge?: string;
  created_at?: string;
}

export class WorldChatRepository {
  /**
   * Save a message into Supabase World Chat table
   */
  async saveMessage(msg: WorldChatMessageRecord): Promise<WorldChatMessageRecord | null> {
    const supabase = await getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("world_chat_messages")
      .insert({
        room_id: msg.room_id || "global",
        user_id: msg.user_id,
        username: msg.username,
        avatar_url: msg.avatar_url,
        content: msg.content,
        badge: msg.badge,
      })
      .select()
      .single();

    if (error) {
      console.warn("[WorldChatRepository] Failed to save chat message:", error.message);
      return null;
    }

    return data as WorldChatMessageRecord;
  }

  /**
   * Load recent persistent messages for a room
   */
  async getRecentMessages(roomId = "global", limit = 100): Promise<WorldChatMessageRecord[]> {
    const supabase = await getSupabaseAdmin();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("world_chat_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("[WorldChatRepository] Failed to fetch chat messages:", error.message);
      return [];
    }

    return ((data ?? []) as WorldChatMessageRecord[]).reverse();
  }
}

export const worldChatRepository = new WorldChatRepository();
