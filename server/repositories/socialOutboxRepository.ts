import { getSupabaseAdmin } from "../middleware/auth";

export interface SocialOutboxEvent {
  id?: string;
  user_id: string;
  event_type: "NOTE_UPSERT" | "STORY_CREATE" | "FOLLOW" | "DM_SENT";
  payload: Record<string, unknown>;
  processed: boolean;
  created_at?: string;
}

export class SocialOutboxRepository {
  /**
   * Queue a social event into the outbox for async fanout & realtime broadcast
   */
  async queueEvent(event: Omit<SocialOutboxEvent, "processed">): Promise<SocialOutboxEvent | null> {
    const supabase = await getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("social_outbox")
      .insert({
        user_id: event.user_id,
        event_type: event.event_type,
        payload: event.payload,
        processed: false,
      })
      .select()
      .single();

    if (error) {
      console.warn("[SocialOutboxRepository] Failed to queue social event:", error.message);
      return null;
    }

    return data as SocialOutboxEvent;
  }

  /**
   * Fetch unprocessed events for worker fanout
   */
  async getPendingEvents(limit = 50): Promise<SocialOutboxEvent[]> {
    const supabase = await getSupabaseAdmin();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("social_outbox")
      .select("*")
      .eq("processed", false)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.warn("[SocialOutboxRepository] Failed to fetch pending events:", error.message);
      return [];
    }

    return (data ?? []) as SocialOutboxEvent[];
  }
}

export const socialOutboxRepository = new SocialOutboxRepository();
