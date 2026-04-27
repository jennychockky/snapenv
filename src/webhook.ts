import crypto from "crypto";

export interface WebhookConfig {
  url: string;
  secret?: string;
  events: WebhookEvent[];
  enabled: boolean;
}

export type WebhookEvent =
  | "snapshot.created"
  | "snapshot.deleted"
  | "snapshot.restored"
  | "snapshot.encrypted"
  | "snapshot.expired";

export interface WebhookPayload {
  event: WebhookEvent;
  snapshotName: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export function buildWebhookPayload(
  event: WebhookEvent,
  snapshotName: string,
  meta?: Record<string, unknown>
): WebhookPayload {
  return {
    event,
    snapshotName,
    timestamp: new Date().toISOString(),
    meta,
  };
}

export function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export async function dispatchWebhook(
  config: WebhookConfig,
  payload: WebhookPayload
): Promise<{ ok: boolean; status?: number; error?: string }> {
  if (!config.enabled) return { ok: false, error: "webhook disabled" };
  if (!config.events.includes(payload.event)) {
    return { ok: false, error: "event not subscribed" };
  }

  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.secret) {
    headers["X-Snapenv-Signature"] = signPayload(body, config.secret);
  }

  try {
    const res = await fetch(config.url, { method: "POST", headers, body });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export function formatWebhookConfig(config: WebhookConfig): string {
  const status = config.enabled ? "enabled" : "disabled";
  return `${config.url} [${status}] events: ${config.events.join(", ")}`;
}
