export type ApiDataQuality =
  | "official_mlb_schedule"
  | "official_mlb_lineup"
  | "official_mlb_scores"
  | "sports_truth_snapshot"
  | "validated_hr_board"
  | "projection_preview"
  | "limited";

export interface ApiResponseMeta {
  source: string;
  dataQuality: ApiDataQuality;
  updatedAt: string;
  generatedAt?: string;
  warnings: string[];
  cache?: {
    strategy: string;
    ttlMs?: number;
  };
}

export function buildApiMeta(input: {
  source: string;
  dataQuality: ApiDataQuality;
  updatedAt?: string;
  generatedAt?: string;
  warnings?: string[];
  cache?: ApiResponseMeta["cache"];
}): ApiResponseMeta {
  const updatedAt = input.updatedAt ?? new Date().toISOString();

  return {
    source: input.source,
    dataQuality: input.dataQuality,
    updatedAt,
    ...(input.generatedAt ? { generatedAt: input.generatedAt } : {}),
    warnings: input.warnings ?? [],
    ...(input.cache ? { cache: input.cache } : {}),
  };
}
