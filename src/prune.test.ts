import { pruneByAge, pruneByKeepCount, pruneExpired, formatPruneResult } from './prune';

function makeSnapshot(daysAgo: number, tags: string[] = []) {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return { createdAt: d.toISOString(), vars: {}, tags };
}

describe('pruneByAge', () => {
  it('removes snapshots older than threshold', () => {
    const snaps = {
      old: makeSnapshot(10),
      recent: makeSnapshot(2),
    };
    expect(pruneByAge(snaps, 7)).toEqual(['old']);
  });

  it('returns empty when all snapshots are recent', () => {
    const snaps = { a: makeSnapshot(1), b: makeSnapshot(3) };
    expect(pruneByAge(snaps, 7)).toEqual([]);
  });

  it('ignores snapshots without createdAt', () => {
    const snaps = { nodate: { vars: {} } };
    expect(pruneByAge(snaps as any, 1)).toEqual([]);
  });
});

describe('pruneByKeepCount', () => {
  it('keeps only the N most recent snapshots', () => {
    const snaps = {
      a: makeSnapshot(5),
      b: makeSnapshot(3),
      c: makeSnapshot(1),
    };
    const removed = pruneByKeepCount(snaps, 2);
    expect(removed).toEqual(['a']);
  });

  it('returns empty when count >= total', () => {
    const snaps = { a: makeSnapshot(1), b: makeSnapshot(2) };
    expect(pruneByKeepCount(snaps, 5)).toEqual([]);
  });
});

describe('pruneExpired', () => {
  it('marks expired snapshots for removal', () => {
    const snaps = { alpha: {}, beta: {} };
    const past = new Date(Date.now() - 1000).toISOString();
    const future = new Date(Date.now() + 100_000).toISOString();
    const expiries = { alpha: past, beta: future };
    expect(pruneExpired(snaps as any, expiries)).toEqual(['alpha']);
  });

  it('ignores snapshots with no expiry entry', () => {
    const snaps = { x: {} };
    expect(pruneExpired(snaps as any, {})).toEqual([]);
  });
});

describe('formatPruneResult', () => {
  it('shows dry run notice', () => {
    const out = formatPruneResult({ removed: ['foo'], kept: [], dryRun: true });
    expect(out).toContain('Dry run');
    expect(out).toContain('foo');
  });

  it('shows nothing to prune when list is empty', () => {
    const out = formatPruneResult({ removed: [], kept: ['bar'], dryRun: false });
    expect(out).toContain('Nothing to prune');
  });

  it('lists removed snapshots', () => {
    const out = formatPruneResult({ removed: ['a', 'b'], kept: [], dryRun: false });
    expect(out).toContain('2 snapshot(s)');
    expect(out).toContain('- a');
    expect(out).toContain('- b');
  });
});
