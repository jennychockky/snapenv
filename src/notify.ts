export type NotifyEvent =
  | 'snapshot:created'
  | 'snapshot:restored'
  | 'snapshot:deleted'
  | 'snapshot:expired'
  | 'snapshot:locked'
  | 'snapshot:unlocked';

export interface NotifyRule {
  id: string;
  event: NotifyEvent;
  channel: 'console' | 'file';
  destination?: string; // file path for 'file' channel
  enabled: boolean;
  createdAt: string;
}

export interface NotifyPayload {
  event: NotifyEvent;
  snapshotName: string;
  timestamp: string;
  meta?: Record<string, string>;
}

export function createNotifyRule(
  event: NotifyEvent,
  channel: NotifyRule['channel'],
  destination?: string
): NotifyRule {
  return {
    id: Math.random().toString(36).slice(2, 10),
    event,
    channel,
    destination,
    enabled: true,
    createdAt: new Date().toISOString(),
  };
}

export function buildPayload(
  event: NotifyEvent,
  snapshotName: string,
  meta?: Record<string, string>
): NotifyPayload {
  return { event, snapshotName, timestamp: new Date().toISOString(), meta };
}

export function formatPayload(payload: NotifyPayload): string {
  const base = `[snapenv] ${payload.event} — ${payload.snapshotName} at ${payload.timestamp}`;
  if (payload.meta && Object.keys(payload.meta).length > 0) {
    const metaStr = Object.entries(payload.meta)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');
    return `${base} (${metaStr})`;
  }
  return base;
}

export function matchingRules(rules: NotifyRule[], event: NotifyEvent): NotifyRule[] {
  return rules.filter((r) => r.enabled && r.event === event);
}

export async function dispatchNotification(
  rule: NotifyRule,
  payload: NotifyPayload
): Promise<void> {
  const message = formatPayload(payload);
  if (rule.channel === 'console') {
    console.log(message);
  } else if (rule.channel === 'file' && rule.destination) {
    const fs = await import('fs/promises');
    await fs.appendFile(rule.destination, message + '\n', 'utf8');
  }
}

export async function notify(
  rules: NotifyRule[],
  event: NotifyEvent,
  snapshotName: string,
  meta?: Record<string, string>
): Promise<void> {
  const payload = buildPayload(event, snapshotName, meta);
  const matched = matchingRules(rules, event);
  await Promise.all(matched.map((r) => dispatchNotification(r, payload)));
}
