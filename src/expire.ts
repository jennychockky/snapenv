export interface ExpiryPolicy {
  ttlSeconds?: number;
  expiresAt?: string; // ISO date string
}

export interface SnapshotExpiry {
  name: string;
  expiresAt: string;
}

export function setExpiry(name: string, policy: ExpiryPolicy): SnapshotExpiry {
  if (policy.expiresAt) {
    return { name, expiresAt: policy.expiresAt };
  }
  if (policy.ttlSeconds !== undefined) {
    const expiresAt = new Date(Date.now() + policy.ttlSeconds * 1000).toISOString();
    return { name, expiresAt };
  }
  throw new Error('Either ttlSeconds or expiresAt must be provided');
}

export function isExpired(expiry: SnapshotExpiry, now: Date = new Date()): boolean {
  return now >= new Date(expiry.expiresAt);
}

export function filterExpired(
  expiries: SnapshotExpiry[],
  now: Date = new Date()
): { expired: SnapshotExpiry[]; active: SnapshotExpiry[] } {
  const expired: SnapshotExpiry[] = [];
  const active: SnapshotExpiry[] = [];
  for (const e of expiries) {
    (isExpired(e, now) ? expired : active).push(e);
  }
  return { expired, active };
}

export function formatExpiry(expiry: SnapshotExpiry): string {
  const date = new Date(expiry.expiresAt);
  const diff = date.getTime() - Date.now();
  if (diff < 0) return `${expiry.name}: expired`;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  const human = days > 0 ? `${days}d` : hrs > 0 ? `${hrs}h` : `${mins}m`;
  return `${expiry.name}: expires in ${human} (${expiry.expiresAt})`;
}
