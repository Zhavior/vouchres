/**
 * Optional ops alert webhook (Slack-compatible incoming webhook or generic JSON POST).
 * Set ALERT_WEBHOOK_URL in production to receive major failure notifications.
 */

type OpsAlertSeverity = "critical" | "warning" | "info";

export type OpsAlertPayload = {
  severity: OpsAlertSeverity;
  title: string;
  detail?: string;
  requestId?: string;
  tags?: Record<string, string>;
};

const THROTTLE_MS = 5 * 60 * 1000;
const recentKeys = new Map<string, number>();

function alertKey(payload: OpsAlertPayload): string {
  return `${payload.severity}:${payload.title}:${payload.detail ?? ""}`;
}

function readWebhookUrl(): string | null {
  const url = process.env.ALERT_WEBHOOK_URL?.trim();
  return url ? url : null;
}

function buildSlackBody(payload: OpsAlertPayload) {
  const emoji = payload.severity === "critical" ? ":rotating_light:" : payload.severity === "warning" ? ":warning:" : ":information_source:";
  const lines = [
    `${emoji} *${payload.title}*`,
    payload.detail ? payload.detail : null,
    payload.requestId ? `requestId: \`${payload.requestId}\`` : null,
    payload.tags ? Object.entries(payload.tags).map(([k, v]) => `${k}: ${v}`).join(" · ") : null,
    `env: ${process.env.NODE_ENV ?? "development"}`,
  ].filter(Boolean);

  return {
    text: lines.join("\n"),
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: lines.join("\n") },
      },
    ],
  };
}

export async function sendOpsAlert(payload: OpsAlertPayload): Promise<void> {
  const webhookUrl = readWebhookUrl();
  if (!webhookUrl) return;

  const key = alertKey(payload);
  const now = Date.now();
  const last = recentKeys.get(key);
  if (last && now - last < THROTTLE_MS) return;
  recentKeys.set(key, now);

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildSlackBody(payload)),
    });
    if (!res.ok) {
      console.warn("[opsAlert] webhook failed", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.warn("[opsAlert] webhook error", err instanceof Error ? err.message : String(err));
  }
}

/** Test helper — clears throttle map. */
export function resetOpsAlertThrottleForTests(): void {
  recentKeys.clear();
}
