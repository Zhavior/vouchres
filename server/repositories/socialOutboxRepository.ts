import { getSupabaseAdmin } from "../middleware/auth";

export type SocialOutboxEventType = "NOTE_UPSERT" | "STORY_CREATE" | "FOLLOW" | "DM_SENT";

export interface SocialOutboxEvent {
  id?: string;
  user_id: string;
  event_type: SocialOutboxEventType;
  payload: Record<string, unknown>;
  processed: boolean;
  processed_at?: string | null;
  last_error?: string | null;
  created_at?: string;
}

function missingTable(error: { code?: string } | null | undefined): boolean {
  const code = String(error?.code ?? "");
  return code === "42P01" || code === "PGRST205" || code === "PGRST204";
}

export class SocialOutboxRepository {
  /**
   * Queue a social event into the outbox for async fanout & realtime broadcast
   */
  async queueEvent(
    event: Omit<SocialOutboxEvent, "processed" | "id" | "created_at" | "processed_at" | "last_error">,
  ): Promise<SocialOutboxEvent | null> {
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
      if (missingTable(error)) {
        console.warn("[SocialOutboxRepository] social_outbox table missing; queue skipped");
        return null;
      }
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
      if (missingTable(error)) return [];
      console.warn("[SocialOutboxRepository] Failed to fetch pending events:", error.message);
      return [];
    }

    return (data ?? []) as SocialOutboxEvent[];
  }

  async markProcessed(id: string): Promise<void> {
    const supabase = await getSupabaseAdmin();
    if (!supabase) return;
    const { error } = await supabase
      .from("social_outbox")
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", id)
      .eq("processed", false);
    if (error && !missingTable(error)) {
      console.warn("[SocialOutboxRepository] markProcessed failed:", error.message);
    }
  }

  async markFailed(id: string, lastError: string): Promise<void> {
    const supabase = await getSupabaseAdmin();
    if (!supabase) return;
    const { error } = await supabase
      .from("social_outbox")
      .update({
        last_error: lastError.slice(0, 500),
      })
      .eq("id", id);
    if (error && !missingTable(error)) {
      console.warn("[SocialOutboxRepository] markFailed failed:", error.message);
    }
  }
}

export const socialOutboxRepository = new SocialOutboxRepository();
