import { getSupabaseAdmin } from "../middleware/auth";

export interface AiEvaluationRecord {
  id?: string;
  prompt_name: string;
  prompt_version: string;
  model_name: string;
  input_hash?: string;
  output_text: string;
  quality_score?: number;
  latency_ms: number;
  cost_estimate?: number;
  created_at?: string;
}

export class AiEvalRepository {
  /**
   * Log an AI generation evaluation metric for offline quality auditing
   */
  async logEvaluation(record: AiEvaluationRecord): Promise<AiEvaluationRecord | null> {
    const supabase = await getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("ai_evaluations")
      .insert({
        prompt_name: record.prompt_name,
        prompt_version: record.prompt_version,
        model_name: record.model_name,
        input_hash: record.input_hash,
        output_text: record.output_text,
        quality_score: record.quality_score,
        latency_ms: record.latency_ms,
        cost_estimate: record.cost_estimate ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.warn("[AiEvalRepository] Failed to log AI evaluation:", error.message);
      return null;
    }

    return data as AiEvaluationRecord;
  }
}

export const aiEvalRepository = new AiEvalRepository();
