import { getSupabaseAdmin } from "../middleware/auth";

export interface TrustLedgerEvent {
  id?: string;
  user_id: string;
  event_type: "COMMIT" | "LOCK" | "GRADE" | "REPAIR" | "REVOKE";
  pick_id?: string;
  parlay_id?: string;
  trust_delta: number;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export class TrustLedgerRepository {
  /**
   * Append an immutable trust event to the canonical ledger
   */
  async recordEvent(event: TrustLedgerEvent): Promise<TrustLedgerEvent | null> {
    const supabase = await getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("trust_ledger_events")
      .insert({
        user_id: event.user_id,
        event_type: event.event_type,
        pick_id: event.pick_id,
        parlay_id: event.parlay_id,
        trust_delta: event.trust_delta,
        metadata: event.metadata ?? {},
      })
      .select()
      .single();

    if (error) {
      console.warn("[TrustLedgerRepository] Failed to record ledger event:", error.message);
      return null;
    }

    return data as TrustLedgerEvent;
  }

  /**
   * Fetch all historical trust ledger events for a user
   */
  async getEventsForUser(userId: string, limit = 50): Promise<TrustLedgerEvent[]> {
    const supabase = await getSupabaseAdmin();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("trust_ledger_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("[TrustLedgerRepository] Failed to fetch events for user:", error.message);
      return [];
    }

    return (data ?? []) as TrustLedgerEvent[];
  }
}

export const trustLedgerRepository = new TrustLedgerRepository();
