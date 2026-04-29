import { Snapshot } from './storage';

export interface FilterOptions {
  prefix?: string;
  tags?: string[];
  before?: Date;
  after?: Date;
  keyPattern?: RegExp;
  minKeys?: number;
  maxKeys?: number;
}

export function filterByDate(
  snapshots: Snapshot[],
  before?: Date,
  after?: Date
): Snapshot[] {
  return snapshots.filter((s) => {
    const ts = new Date(s.createdAt);
    if (before && ts >= before) return false;
    if (after && ts <= after) return false;
    return true;
  });
}

export function filterByTags(
  snapshots: Snapshot[],
  tags: string[]
): Snapshot[] {
  if (tags.length === 0) return snapshots;
  return snapshots.filter((s) =>
    tags.every((t) => Array.isArray(s.tags) && s.tags.includes(t))
  );
}

export function filterByKeyPattern(
  snapshots: Snapshot[],
  pattern: RegExp
): Snapshot[] {
  return snapshots.filter((s) =>
    Object.keys(s.env).some((k) => pattern.test(k))
  );
}

export function filterByKeyCount(
  snapshots: Snapshot[],
  min?: number,
  max?: number
): Snapshot[] {
  return snapshots.filter((s) => {
    const count = Object.keys(s.env).length;
    if (min !== undefined && count < min) return false;
    if (max !== undefined && count > max) return false;
    return true;
  });
}

export function applyFilters(
  snapshots: Snapshot[],
  opts: FilterOptions
): Snapshot[] {
  let result = snapshots;

  if (opts.prefix) {
    result = result.filter((s) => s.name.startsWith(opts.prefix!));
  }
  if (opts.tags && opts.tags.length > 0) {
    result = filterByTags(result, opts.tags);
  }
  if (opts.before || opts.after) {
    result = filterByDate(result, opts.before, opts.after);
  }
  if (opts.keyPattern) {
    result = filterByKeyPattern(result, opts.keyPattern);
  }
  if (opts.minKeys !== undefined || opts.maxKeys !== undefined) {
    result = filterByKeyCount(result, opts.minKeys, opts.maxKeys);
  }

  return result;
}

export function formatFilterSummary(
  total: number,
  matched: number
): string {
  return `Matched ${matched} of ${total} snapshot${total !== 1 ? 's' : ''}.`;
}
