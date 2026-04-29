import { findDuplicates, formatDuplicates, snapshotFingerprint } from './snapshot-duplicate';
import { Snapshot } from './storage';

function makeSnapshot(name: string, env: Record<string, string>, createdAt = Date.now()): Snapshot {
  return { name, env, createdAt };
}

describe('snapshotFingerprint', () => {
  it('produces the same fingerprint for identical envs regardless of key order', () => {
    const a = makeSnapshot('a', { FOO: '1', BAR: '2' });
    const b = makeSnapshot('b', { BAR: '2', FOO: '1' });
    expect(snapshotFingerprint(a)).toBe(snapshotFingerprint(b));
  });

  it('produces different fingerprints for different envs', () => {
    const a = makeSnapshot('a', { FOO: '1' });
    const b = makeSnapshot('b', { FOO: '2' });
    expect(snapshotFingerprint(a)).not.toBe(snapshotFingerprint(b));
  });
});

describe('findDuplicates', () => {
  it('returns empty result when no duplicates exist', () => {
    const snaps = [
      makeSnapshot('a', { FOO: '1' }),
      makeSnapshot('b', { BAR: '2' }),
    ];
    const result = findDuplicates(snaps);
    expect(result.found).toHaveLength(0);
    expect(result.groups.size).toBe(0);
  });

  it('detects two snapshots with identical env maps', () => {
    const snaps = [
      makeSnapshot('a', { FOO: '1', BAR: '2' }),
      makeSnapshot('b', { FOO: '1', BAR: '2' }),
      makeSnapshot('c', { UNIQUE: 'yes' }),
    ];
    const result = findDuplicates(snaps);
    expect(result.found).toHaveLength(2);
    expect(result.groups.size).toBe(1);
    const members = Array.from(result.groups.values())[0];
    expect(members.map((s) => s.name).sort()).toEqual(['a', 'b']);
  });

  it('handles multiple duplicate groups', () => {
    const snaps = [
      makeSnapshot('a', { X: '1' }),
      makeSnapshot('b', { X: '1' }),
      makeSnapshot('c', { Y: '2' }),
      makeSnapshot('d', { Y: '2' }),
    ];
    const result = findDuplicates(snaps);
    expect(result.groups.size).toBe(2);
    expect(result.found).toHaveLength(4);
  });
});

describe('formatDuplicates', () => {
  it('returns a no-duplicates message when result is empty', () => {
    const result = findDuplicates([makeSnapshot('a', { A: '1' })]);
    expect(formatDuplicates(result)).toBe('No duplicate snapshots found.');
  });

  it('includes group and snapshot info in output', () => {
    const snaps = [
      makeSnapshot('snap1', { KEY: 'val' }, new Date('2024-01-01').getTime()),
      makeSnapshot('snap2', { KEY: 'val' }, new Date('2024-01-02').getTime()),
    ];
    const result = findDuplicates(snaps);
    const output = formatDuplicates(result);
    expect(output).toContain('Duplicate group 1');
    expect(output).toContain('snap1');
    expect(output).toContain('snap2');
    expect(output).toContain('2 duplicate snapshots in 1 group(s)');
  });
});
