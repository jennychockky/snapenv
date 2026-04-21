export interface AuditEntry {
  id: string;
  timestamp: string;
  action: 'save' | 'restore' | 'delete' | 'encrypt' | 'decrypt' | 'import' | 'export';
  snapshotName: string;
  details?: string;
  user?: string;
}

export function createAuditEntry(
  action: AuditEntry['action'],
  snapshotName: string,
  details?: string
): AuditEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    action,
    snapshotName,
    details,
    user: process.env.USER ?? process.env.USERNAME ?? 'unknown',
  };
}

export function filterAuditLog(
  entries: AuditEntry[],
  opts: {
    action?: AuditEntry['action'];
    snapshotName?: string;
    since?: Date;
    until?: Date;
  }
): AuditEntry[] {
  return entries.filter((e) => {
    if (opts.action && e.action !== opts.action) return false;
    if (opts.snapshotName && e.snapshotName !== opts.snapshotName) return false;
    const ts = new Date(e.timestamp);
    if (opts.since && ts < opts.since) return false;
    if (opts.until && ts > opts.until) return false;
    return true;
  });
}

export function formatAuditEntry(entry: AuditEntry): string {
  const parts = [
    entry.timestamp,
    `[${entry.action.toUpperCase()}]`,
    entry.snapshotName,
  ];
  if (entry.user) parts.push(`(${entry.user})`);
  if (entry.details) parts.push(`— ${entry.details}`);
  return parts.join(' ');
}

export function formatAuditLog(entries: AuditEntry[]): string {
  if (entries.length === 0) return 'No audit entries found.';
  return entries.map(formatAuditEntry).join('\n');
}
