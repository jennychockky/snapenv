import { parseSort, sortSnapshots, formatSortLabel, SortOptions } from './snapshot-sort';
import { Snapshot } from './storage';

function makeSnapshot(overrides: Partial<Snapshot> & { name: string }): Snapshot {
  return {
    name: overrides.name,
    env: overrides.env ?? {},
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
  } as Snapshot;
}

describe('parseSort', () => {
  it('parses field and order', () => {
    expect(parseSort('name:asc')).toEqual({ field: 'name', order: 'asc' });
    expect(parseSort('created:desc')).toEqual({ field: 'created', order: 'desc' });
  });

  it('defaults order to asc when omitted', () => {
    expect(parseSort('keyCount')).toEqual({ field: 'keyCount', order: 'asc' });
  });

  it('throws on invalid field', () => {
    expect(() => parseSort('bogus:asc')).toThrow('Invalid sort field');
  });
});

describe('sortSnapshots', () => {
  const snaps = [
    makeSnapshot({ name: 'beta', env: { A: '1', B: '2', C: '3' }, createdAt: '2024-01-03T00:00:00Z' }),
    makeSnapshot({ name: 'alpha', env: { X: '1' }, createdAt: '2024-01-01T00:00:00Z' }),
    makeSnapshot({ name: 'gamma', env: {}, createdAt: '2024-01-02T00:00:00Z' }),
  ];

  it('sorts by name asc', () => {
    const result = sortSnapshots(snaps, { field: 'name', order: 'asc' });
    expect(result.map(s => s.name)).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('sorts by name desc', () => {
    const result = sortSnapshots(snaps, { field: 'name', order: 'desc' });
    expect(result.map(s => s.name)).toEqual(['gamma', 'beta', 'alpha']);
  });

  it('sorts by keyCount asc', () => {
    const result = sortSnapshots(snaps, { field: 'keyCount', order: 'asc' });
    expect(result.map(s => s.name)).toEqual(['gamma', 'alpha', 'beta']);
  });

  it('sorts by created asc', () => {
    const result = sortSnapshots(snaps, { field: 'created', order: 'asc' });
    expect(result.map(s => s.name)).toEqual(['alpha', 'gamma', 'beta']);
  });

  it('does not mutate original array', () => {
    const original = [...snaps];
    sortSnapshots(snaps, { field: 'name', order: 'asc' });
    expect(snaps).toEqual(original);
  });
});

describe('formatSortLabel', () => {
  it('formats label', () => {
    const opts: SortOptions = { field: 'updated', order: 'desc' };
    expect(formatSortLabel(opts)).toBe('updated:desc');
  });
});
