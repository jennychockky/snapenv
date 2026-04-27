import { loadSnapshots, saveSnapshots } from './storage';
import { Snapshot } from './storage';

export interface BatchOperation {
  type: 'delete' | 'tag' | 'untag' | 'pin' | 'unpin';
  names: string[];
  value?: string;
}

export interface BatchResult {
  succeeded: string[];
  failed: { name: string; reason: string }[];
}

export function applyBatchDelete(
  snapshots: Record<string, Snapshot>,
  names: string[]
): BatchResult {
  const result: BatchResult = { succeeded: [], failed: [] };
  for (const name of names) {
    if (!snapshots[name]) {
      result.failed.push({ name, reason: 'snapshot not found' });
    } else {
      delete snapshots[name];
      result.succeeded.push(name);
    }
  }
  return result;
}

export function applyBatchTag(
  snapshots: Record<string, Snapshot>,
  names: string[],
  tag: string
): BatchResult {
  const result: BatchResult = { succeeded: [], failed: [] };
  for (const name of names) {
    if (!snapshots[name]) {
      result.failed.push({ name, reason: 'snapshot not found' });
    } else {
      const snap = snapshots[name];
      const tags: string[] = (snap.tags as string[] | undefined) ?? [];
      if (!tags.includes(tag)) tags.push(tag);
      snapshots[name] = { ...snap, tags } as Snapshot;
      result.succeeded.push(name);
    }
  }
  return result;
}

export function formatBatchResult(result: BatchResult): string {
  const lines: string[] = [];
  if (result.succeeded.length > 0) {
    lines.push(`✓ Succeeded (${result.succeeded.length}): ${result.succeeded.join(', ')}`);
  }
  if (result.failed.length > 0) {
    for (const f of result.failed) {
      lines.push(`✗ Failed: ${f.name} — ${f.reason}`);
    }
  }
  return lines.join('\n');
}
