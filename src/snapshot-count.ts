import { Snapshot } from './storage';

export interface CountOptions {
  groupBy?: 'day' | 'week' | 'month';
  prefix?: string;
  tags?: string[];
}

export interface CountResult {
  total: number;
  grouped: Record<string, number>;
  byTag: Record<string, number>;
}

function getGroupKey(timestamp: string, groupBy: 'day' | 'week' | 'month'): string {
  const date = new Date(timestamp);
  if (groupBy === 'day') {
    return date.toISOString().slice(0, 10);
  }
  if (groupBy === 'month') {
    return date.toISOString().slice(0, 7);
  }
  // week: ISO week
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function countSnapshots(snapshots: Snapshot[], options: CountOptions = {}): CountResult {
  let filtered = snapshots;

  if (options.prefix) {
    filtered = filtered.filter(s => s.name.startsWith(options.prefix!));
  }

  if (options.tags && options.tags.length > 0) {
    filtered = filtered.filter(s =>
      options.tags!.every(t => (s.tags ?? []).includes(t))
    );
  }

  const grouped: Record<string, number> = {};
  const byTag: Record<string, number> = {};

  for (const snap of filtered) {
    if (options.groupBy && snap.createdAt) {
      const key = getGroupKey(snap.createdAt, options.groupBy);
      grouped[key] = (grouped[key] ?? 0) + 1;
    }
    for (const tag of snap.tags ?? []) {
      byTag[tag] = (byTag[tag] ?? 0) + 1;
    }
  }

  return { total: filtered.length, grouped, byTag };
}

export function formatCountResult(result: CountResult, groupBy?: string): string {
  const lines: string[] = [`Total snapshots: ${result.total}`];

  if (groupBy && Object.keys(result.grouped).length > 0) {
    lines.push(`\nBy ${groupBy}:`);
    for (const [key, count] of Object.entries(result.grouped).sort()) {
      lines.push(`  ${key}: ${count}`);
    }
  }

  if (Object.keys(result.byTag).length > 0) {
    lines.push('\nBy tag:');
    for (const [tag, count] of Object.entries(result.byTag).sort()) {
      lines.push(`  ${tag}: ${count}`);
    }
  }

  return lines.join('\n');
}
