import { Snapshot } from './storage';

export interface AccessEntry {
  snapshotName: string;
  accessedAt: string;
  action: 'read' | 'write' | 'delete';
  source?: string;
}

export interface AccessLog {
  entries: AccessEntry[];
}

export function createAccessEntry(
  snapshotName: string,
  action: AccessEntry['action'],
  source?: string
): AccessEntry {
  return {
    snapshotName,
    accessedAt: new Date().toISOString(),
    action,
    source,
  };
}

export function recordAccess(
  log: AccessLog,
  entry: AccessEntry
): AccessLog {
  return { entries: [...log.entries, entry] };
}

export function filterAccessLog(
  log: AccessLog,
  opts: { snapshotName?: string; action?: AccessEntry['action']; since?: Date }
): AccessEntry[] {
  return log.entries.filter((e) => {
    if (opts.snapshotName && e.snapshotName !== opts.snapshotName) return false;
    if (opts.action && e.action !== opts.action) return false;
    if (opts.since && new Date(e.accessedAt) < opts.since) return false;
    return true;
  });
}

export function mostAccessedSnapshots(
  log: AccessLog,
  limit = 5
): Array<{ name: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const entry of log.entries) {
    counts[entry.snapshotName] = (counts[entry.snapshotName] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function formatAccessLog(entries: AccessEntry[]): string {
  if (entries.length === 0) return 'No access records found.';
  return entries
    .map(
      (e) =>
        `[${e.accessedAt}] ${e.action.toUpperCase().padEnd(6)} ${e.snapshotName}${
          e.source ? ` (via ${e.source})` : ''
        }`
    )
    .join('\n');
}
