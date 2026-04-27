import { applyBatchDelete, applyBatchTag, formatBatchResult } from './batch';
import { Snapshot } from './storage';

function makeSnapshot(name: string): Snapshot {
  return { name, env: { FOO: 'bar' }, createdAt: new Date().toISOString() } as unknown as Snapshot;
}

describe('applyBatchDelete', () => {
  it('deletes existing snapshots', () => {
    const snaps = { a: makeSnapshot('a'), b: makeSnapshot('b') };
    const result = applyBatchDelete(snaps, ['a', 'b']);
    expect(result.succeeded).toEqual(['a', 'b']);
    expect(result.failed).toHaveLength(0);
    expect(snaps['a']).toBeUndefined();
  });

  it('reports missing snapshots as failed', () => {
    const snaps = { a: makeSnapshot('a') };
    const result = applyBatchDelete(snaps, ['a', 'missing']);
    expect(result.succeeded).toEqual(['a']);
    expect(result.failed).toEqual([{ name: 'missing', reason: 'snapshot not found' }]);
  });
});

describe('applyBatchTag', () => {
  it('adds tag to existing snapshots', () => {
    const snaps = { a: makeSnapshot('a'), b: makeSnapshot('b') };
    const result = applyBatchTag(snaps, ['a', 'b'], 'prod');
    expect(result.succeeded).toEqual(['a', 'b']);
    expect((snaps['a'] as any).tags).toContain('prod');
    expect((snaps['b'] as any).tags).toContain('prod');
  });

  it('does not duplicate tags', () => {
    const snap = { ...makeSnapshot('a'), tags: ['prod'] } as any;
    const snaps = { a: snap };
    applyBatchTag(snaps, ['a'], 'prod');
    expect((snaps['a'] as any).tags.filter((t: string) => t === 'prod')).toHaveLength(1);
  });

  it('reports missing snapshots as failed', () => {
    const snaps = {};
    const result = applyBatchTag(snaps, ['ghost'], 'dev');
    expect(result.failed[0].name).toBe('ghost');
  });
});

describe('formatBatchResult', () => {
  it('formats success and failure lines', () => {
    const result = {
      succeeded: ['a', 'b'],
      failed: [{ name: 'c', reason: 'not found' }],
    };
    const output = formatBatchResult(result);
    expect(output).toContain('Succeeded');
    expect(output).toContain('a, b');
    expect(output).toContain('Failed: c');
  });

  it('returns only success line when no failures', () => {
    const result = { succeeded: ['x'], failed: [] };
    const output = formatBatchResult(result);
    expect(output).not.toContain('Failed');
  });
});
