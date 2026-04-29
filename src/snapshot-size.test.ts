import { computeSnapshotSize, computeAggregateSizes, formatSnapshotSize, formatAggregateSizes } from './snapshot-size';
import { Snapshot } from './storage';

function makeSnapshot(name: string, env: Record<string, string>): Snapshot {
  return { name, env, createdAt: new Date().toISOString() };
}

describe('computeSnapshotSize', () => {
  it('returns zero size for empty env', () => {
    const result = computeSnapshotSize(makeSnapshot('empty', {}));
    expect(result.keyCount).toBe(0);
    expect(result.byteSize).toBe(0);
    expect(result.largestKey).toBeNull();
  });

  it('counts keys and bytes correctly', () => {
    const result = computeSnapshotSize(makeSnapshot('s1', { FOO: 'bar', BAZ: 'qux' }));
    expect(result.keyCount).toBe(2);
    expect(result.byteSize).toBe(Buffer.byteLength('FOO') + Buffer.byteLength('bar') + Buffer.byteLength('BAZ') + Buffer.byteLength('qux'));
  });

  it('identifies the largest key by value bytes', () => {
    const result = computeSnapshotSize(makeSnapshot('s1', { A: 'short', B: 'a much longer value here' }));
    expect(result.largestKey).toBe('B');
  });
});

describe('computeAggregateSizes', () => {
  it('returns empty report for no snapshots', () => {
    const report = computeAggregateSizes([]);
    expect(report.totalSnapshots).toBe(0);
    expect(report.largest).toBeNull();
  });

  it('computes totals and averages', () => {
    const snaps = [
      makeSnapshot('a', { X: '1' }),
      makeSnapshot('b', { Y: '22', Z: '333' }),
    ];
    const report = computeAggregateSizes(snaps);
    expect(report.totalSnapshots).toBe(2);
    expect(report.totalKeys).toBe(3);
    expect(report.totalBytes).toBeGreaterThan(0);
    expect(report.largest?.name).toBe('b');
    expect(report.smallest?.name).toBe('a');
  });
});

describe('formatSnapshotSize', () => {
  it('includes name, keys, and size', () => {
    const size = computeSnapshotSize(makeSnapshot('mysnap', { KEY: 'value' }));
    const output = formatSnapshotSize(size);
    expect(output).toContain('mysnap');
    expect(output).toContain('1');
    expect(output).toContain('KEY');
  });
});

describe('formatAggregateSizes', () => {
  it('returns message when no snapshots', () => {
    expect(formatAggregateSizes(computeAggregateSizes([]))).toContain('No snapshots');
  });

  it('includes aggregate info', () => {
    const snaps = [makeSnapshot('x', { A: 'b' })];
    const output = formatAggregateSizes(computeAggregateSizes(snaps));
    expect(output).toContain('Snapshots');
    expect(output).toContain('x');
  });
});
