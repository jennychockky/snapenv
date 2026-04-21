import { loadSnapshots, saveSnapshots } from './storage';
import { isExpired } from './expire';

export interface PruneOptions {
  dryRun?: boolean;
  olderThanDays?: number;
  keepCount?: number;
  tag?: string;
}

export interface PruneResult {
  removed: string[];
  kept: string[];
  dryRun: boolean;
}

export function pruneByAge(
  snapshots: Record<string, any>,
  olderThanDays: number
): string[] {
  const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
  return Object.entries(snapshots)
    .filter(([, snap]) => snap.createdAt && new Date(snap.createdAt).getTime() < cutoff)
    .map(([name]) => name);
}

export function pruneByKeepCount(
  snapshots: Record<string, any>,
  keepCount: number
): string[] {
  const sorted = Object.entries(snapshots)
    .filter(([, snap]) => snap.createdAt)
    .sort(([, a], [, b]) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return sorted.slice(keepCount).map(([name]) => name);
}

export function pruneExpired(snapshots: Record<string, any>, expiries: Record<string, string>): string[] {
  return Object.keys(snapshots).filter((name) => {
    const expiry = expiries[name];
    return expiry ? isExpired(expiry) : false;
  });
}

export async function pruneSnapshots(
  storageDir: string,
  options: PruneOptions,
  expiries: Record<string, string> = {}
): Promise<PruneResult> {
  const snapshots = await loadSnapshots(storageDir);
  const toRemove = new Set<string>();

  if (options.olderThanDays !== undefined) {
    pruneByAge(snapshots, options.olderThanDays).forEach((n) => toRemove.add(n));
  }

  if (options.keepCount !== undefined) {
    pruneByKeepCount(snapshots, options.keepCount).forEach((n) => toRemove.add(n));
  }

  const expiredNames = pruneExpired(snapshots, expiries);
  expiredNames.forEach((n) => toRemove.add(n));

  if (options.tag) {
    const tag = options.tag;
    Object.entries(snapshots)
      .filter(([, snap]) => Array.isArray(snap.tags) && snap.tags.includes(tag))
      .forEach(([name]) => toRemove.add(name));
  }

  const removed = Array.from(toRemove);
  const kept = Object.keys(snapshots).filter((n) => !toRemove.has(n));

  if (!options.dryRun) {
    const pruned: Record<string, any> = {};
    kept.forEach((n) => (pruned[n] = snapshots[n]));
    await saveSnapshots(storageDir, pruned);
  }

  return { removed, kept, dryRun: options.dryRun ?? false };
}

export function formatPruneResult(result: PruneResult): string {
  const lines: string[] = [];
  if (result.dryRun) lines.push('Dry run — no changes made.');
  if (result.removed.length === 0) {
    lines.push('Nothing to prune.');
  } else {
    lines.push(`Pruned ${result.removed.length} snapshot(s):`);
    result.removed.forEach((n) => lines.push(`  - ${n}`));
  }
  return lines.join('\n');
}
