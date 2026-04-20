import { compareSnapshots, formatCompareResult } from './compare';
import { Snapshot } from './storage';

function makeSnapshot(name: string, env: Record<string, string>): Snapshot {
  return { name, env, createdAt: new Date().toISOString() };
}

describe('compareSnapshots', () => {
  it('detects keys only in A', () => {
    const a = makeSnapshot('a', { FOO: '1', BAR: '2' });
    const b = makeSnapshot('b', { FOO: '1' });
    const result = compareSnapshots(a, b);
    expect(result.onlyInA).toEqual({ BAR: '2' });
    expect(result.onlyInB).toEqual({});
    expect(result.unchanged).toEqual({ FOO: '1' });
  });

  it('detects keys only in B', () => {
    const a = makeSnapshot('a', { FOO: '1' });
    const b = makeSnapshot('b', { FOO: '1', BAZ: '3' });
    const result = compareSnapshots(a, b);
    expect(result.onlyInB).toEqual({ BAZ: '3' });
    expect(result.onlyInA).toEqual({});
  });

  it('detects changed values', () => {
    const a = makeSnapshot('a', { FOO: 'old' });
    const b = makeSnapshot('b', { FOO: 'new' });
    const result = compareSnapshots(a, b);
    expect(result.changed).toEqual({ FOO: { a: 'old', b: 'new' } });
  });

  it('detects unchanged values', () => {
    const a = makeSnapshot('a', { FOO: 'same' });
    const b = makeSnapshot('b', { FOO: 'same' });
    const result = compareSnapshots(a, b);
    expect(result.unchanged).toEqual({ FOO: 'same' });
    expect(Object.keys(result.changed)).toHaveLength(0);
  });

  it('handles empty snapshots', () => {
    const a = makeSnapshot('a', {});
    const b = makeSnapshot('b', {});
    const result = compareSnapshots(a, b);
    expect(result).toEqual({ onlyInA: {}, onlyInB: {}, changed: {}, unchanged: {} });
  });
});

describe('formatCompareResult', () => {
  it('returns identical message when no differences', () => {
    const a = makeSnapshot('a', { X: '1' });
    const b = makeSnapshot('b', { X: '1' });
    const result = compareSnapshots(a, b);
    const output = formatCompareResult(result, 'a', 'b');
    expect(output).toContain('identical');
    expect(output).toContain('1 key');
  });

  it('includes diff sections when differences exist', () => {
    const a = makeSnapshot('a', { FOO: '1', SHARED: 'x' });
    const b = makeSnapshot('b', { BAR: '2', SHARED: 'y' });
    const result = compareSnapshots(a, b);
    const output = formatCompareResult(result, 'snap-a', 'snap-b');
    expect(output).toContain('Only in [snap-a]');
    expect(output).toContain('Only in [snap-b]');
    expect(output).toContain('Changed');
    expect(output).toContain('SHARED');
  });
});
