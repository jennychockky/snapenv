import { Snapshot } from './storage';

export interface DuplicateResult {
  found: Snapshot[];
  groups: Map<string, Snapshot[]>;
}

/**
 * Compute a fingerprint for a snapshot based on its env key-value pairs.
 */
export function snapshotFingerprint(snapshot: Snapshot): string {
  const entries = Object.entries(snapshot.env)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`);
  return entries.join('\n');
}

/**
 * Find snapshots that share identical environment variable maps.
 */
export function findDuplicates(snapshots: Snapshot[]): DuplicateResult {
  const groups = new Map<string, Snapshot[]>();

  for (const snap of snapshots) {
    const fp = snapshotFingerprint(snap);
    if (!groups.has(fp)) {
      groups.set(fp, []);
    }
    groups.get(fp)!.push(snap);
  }

  // Keep only groups with more than one snapshot
  for (const [key, members] of groups) {
    if (members.length < 2) {
      groups.delete(key);
    }
  }

  const found = Array.from(groups.values()).flat();
  return { found, groups };
}

/**
 * Format duplicate results for display.
 */
export function formatDuplicates(result: DuplicateResult): string {
  if (result.groups.size === 0) {
    return 'No duplicate snapshots found.';
  }

  const lines: string[] = [];
  let groupIndex = 1;

  for (const members of result.groups.values()) {
    lines.push(`Duplicate group ${groupIndex++}:`);
    for (const snap of members) {
      const date = new Date(snap.createdAt).toLocaleString();
      lines.push(`  - ${snap.name} (created: ${date}, keys: ${Object.keys(snap.env).length})`);
    }
  }

  lines.push('');
  lines.push(`Total: ${result.found.length} duplicate snapshots in ${result.groups.size} group(s).`);
  return lines.join('\n');
}
