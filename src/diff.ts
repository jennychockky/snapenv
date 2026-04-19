export type DiffEntry = {
  key: string;
  type: 'added' | 'removed' | 'changed';
  before?: string;
  after?: string;
};

export function computeDiff(
  before: Record<string, string>,
  after: Record<string, string>
): DiffEntry[] {
  const entries: DiffEntry[] = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const inBefore = Object.prototype.hasOwnProperty.call(before, key);
    const inAfter = Object.prototype.hasOwnProperty.call(after, key);

    if (inBefore && !inAfter) {
      entries.push({ key, type: 'removed', before: before[key] });
    } else if (!inBefore && inAfter) {
      entries.push({ key, type: 'added', after: after[key] });
    } else if (before[key] !== after[key]) {
      entries.push({ key, type: 'changed', before: before[key], after: after[key] });
    }
  }

  return entries.sort((a, b) => a.key.localeCompare(b.key));
}

export function formatDiff(entries: DiffEntry[]): string {
  if (entries.length === 0) return '(no differences)';

  return entries
    .map((e) => {
      if (e.type === 'added') return `+ ${e.key}=${e.after}`;
      if (e.type === 'removed') return `- ${e.key}=${e.before}`;
      return `~ ${e.key}: ${e.before} → ${e.after}`;
    })
    .join('\n');
}

export function summarizeDiff(entries: DiffEntry[]): string {
  const added = entries.filter((e) => e.type === 'added').length;
  const removed = entries.filter((e) => e.type === 'removed').length;
  const changed = entries.filter((e) => e.type === 'changed').length;
  const parts: string[] = [];
  if (added) parts.push(`${added} added`);
  if (removed) parts.push(`${removed} removed`);
  if (changed) parts.push(`${changed} changed`);
  return parts.length ? parts.join(', ') : 'no changes';
}
