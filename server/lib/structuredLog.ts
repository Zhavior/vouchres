export type StructuredLogLevel = "info" | "warn" | "error";

export interface StructuredLogPayload {
  level: StructuredLogLevel;
  event: string;
  requestId?: string;
  method?: string;
  route?: string;
  status?: number;
  durationMs?: number;
  code?: string;
  message?: string;
  details?: unknown;
  [key: string]: unknown;
}

export function structuredLog(payload: StructuredLogPayload): void {
  const { level, event, ...fields } = payload;
  const line = JSON.stringify({
    level,
    event,
    at: new Date().toISOString(),
    ...fields,
  });

  if (level === "error") {
    console.error(`[api:${event}]`, line);
    return;
  }

  if (level === "warn") {
    console.warn(`[api:${event}]`, line);
    return;
  }

  console.log(`[api:${event}]`, line);
}
