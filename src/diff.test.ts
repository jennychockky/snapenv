import { computeDiff, formatDiff, summarizeDiff } from './diff';

const base = { FOO: 'foo', BAR: 'bar', SHARED: 'same' };
const next = { BAZ: 'baz', SHARED: 'same', FOO: 'changed' };

describe('computeDiff', () => {
  it('detects added keys', () => {
    const diff = computeDiff(base, next);
    const added = diff.filter((e) => e.type === 'added');
    expect(added).toHaveLength(1);
    expect(added[0].key).toBe('BAZ');
    expect(added[0].after).toBe('baz');
  });

  it('detects removed keys', () => {
    const diff = computeDiff(base, next);
    const removed = diff.filter((e) => e.type === 'removed');
    expect(removed).toHaveLength(1);
    expect(removed[0].key).toBe('BAR');
    expect(removed[0].before).toBe('bar');
  });

  it('detects changed keys', () => {
    const diff = computeDiff(base, next);
    const changed = diff.filter((e) => e.type === 'changed');
    expect(changed).toHaveLength(1);
    expect(changed[0].key).toBe('FOO');
    expect(changed[0].before).toBe('foo');
    expect(changed[0].after).toBe('changed');
  });

  it('ignores unchanged keys', () => {
    const diff = computeDiff(base, next);
    expect(diff.find((e) => e.key === 'SHARED')).toBeUndefined();
  });

  it('returns empty array for identical maps', () => {
    expect(computeDiff(base, { ...base })).toHaveLength(0);
  });
});

describe('formatDiff', () => {
  it('returns no differences message for empty diff', () => {
    expect(formatDiff([])).toBe('(no differences)');
  });

  it('formats added, removed, changed entries', () => {
    const diff = computeDiff(base, next);
    const output = formatDiff(diff);
    expect(output).toContain('+ BAZ=baz');
    expect(output).toContain('- BAR=bar');
    expect(output).toContain('~ FOO: foo → changed');
  });
});

describe('summarizeDiff', () => {
  it('summarizes counts', () => {
    const diff = computeDiff(base, next);
    expect(summarizeDiff(diff)).toBe('1 added, 1 removed, 1 changed');
  });

  it('returns no changes for empty diff', () => {
    expect(summarizeDiff([])).toBe('no changes');
  });
});
