import {
  computeSnapshotStats,
  computeAggregateStats,
  formatSnapshotStats,
  formatAggregateStats,
} from './snapshot-stats';
import { Snapshot } from './storage';

function makeSnapshot(name: string, env: Record<string, string>): Snapshot {
  return { name, env, createdAt: '2024-01-01T00:00:00.000Z' };
}

describe('computeSnapshotStats', () => {
  it('counts keys correctly', () => {
    const snap = makeSnapshot('test', { FOO: 'bar', BAZ: 'qux' });
    const stats = computeSnapshotStats(snap);
    expect(stats.keyCount).toBe(2);
  });

  it('computes size in bytes', () => {
    const snap = makeSnapshot('test', { A: 'b' });
    const stats = computeSnapshotStats(snap);
    expect(stats.sizeBytes).toBeGreaterThan(0);
  });

  it('extracts namespaces from prefixed keys', () => {
    const snap = makeSnapshot('test', { DB_HOST: 'localhost', DB_PORT: '5432', PLAIN: 'val' });
    const stats = computeSnapshotStats(snap);
    expect(stats.namespaces).toContain('DB');
  });

  it('returns empty namespaces when no underscores', () => {
    const snap = makeSnapshot('test', { FOO: 'bar' });
    const stats = computeSnapshotStats(snap);
    expect(stats.namespaces).toEqual([]);
  });

  it('reports no encryption by default', () => {
    const snap = makeSnapshot('test', { X: '1' });
    expect(computeSnapshotStats(snap).hasEncryption).toBe(false);
  });
});

describe('computeAggregateStats', () => {
  it('returns zeros for empty array', () => {
    const stats = computeAggregateStats([]);
    expect(stats.totalSnapshots).toBe(0);
    expect(stats.largestSnapshot).toBeNull();
  });

  it('computes totals across multiple snapshots', () => {
    const snaps = [
      makeSnapshot('a', { A: '1', B: '2' }),
      makeSnapshot('b', { C: '3' }),
    ];
    const stats = computeAggregateStats(snaps);
    expect(stats.totalSnapshots).toBe(2);
    expect(stats.totalKeys).toBe(3);
    expect(stats.averageKeys).toBe(2);
  });

  it('identifies largest and smallest snapshots', () => {
    const snaps = [
      makeSnapshot('big', { A: '1', B: '2', C: '3' }),
      makeSnapshot('small', { X: '1' }),
    ];
    const stats = computeAggregateStats(snaps);
    expect(stats.largestSnapshot).toBe('big');
    expect(stats.smallestSnapshot).toBe('small');
  });

  it('collects unique namespaces', () => {
    const snaps = [
      makeSnapshot('a', { DB_HOST: 'h', APP_KEY: 'k' }),
      makeSnapshot('b', { DB_PORT: '5432' }),
    ];
    const stats = computeAggregateStats(snaps);
    expect(stats.uniqueNamespaces).toContain('DB');
    expect(stats.uniqueNamespaces).toContain('APP');
    expect(new Set(stats.uniqueNamespaces).size).toBe(stats.uniqueNamespaces.length);
  });
});

describe('formatSnapshotStats', () => {
  it('includes snapshot name', () => {
    const snap = makeSnapshot('mysnap', { FOO: 'bar' });
    const result = formatSnapshotStats(computeSnapshotStats(snap));
    expect(result).toContain('mysnap');
  });

  it('shows (none) when no namespaces', () => {
    const snap = makeSnapshot('x', { FOO: 'bar' });
    const result = formatSnapshotStats(computeSnapshotStats(snap));
    expect(result).toContain('(none)');
  });
});

describe('formatAggregateStats', () => {
  it('returns message for empty list', () => {
    expect(formatAggregateStats(computeAggregateStats([]))).toBe('No snapshots found.');
  });

  it('includes total snapshot count', () => {
    const snaps = [makeSnapshot('a', { X: '1' })];
    const result = formatAggregateStats(computeAggregateStats(snaps));
    expect(result).toContain('1');
  });
});
