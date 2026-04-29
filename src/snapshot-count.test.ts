import { countSnapshots, formatCountResult } from './snapshot-count';
import { Snapshot } from './storage';

function makeSnapshot(name: string, createdAt: string, tags: string[] = []): Snapshot {
  return { name, env: {}, createdAt, tags };
}

describe('countSnapshots', () => {
  const snapshots: Snapshot[] = [
    makeSnapshot('prod-1', '2024-01-05T10:00:00Z', ['prod', 'stable']),
    makeSnapshot('prod-2', '2024-01-12T10:00:00Z', ['prod']),
    makeSnapshot('dev-1', '2024-02-03T10:00:00Z', ['dev']),
    makeSnapshot('dev-2', '2024-02-20T10:00:00Z', ['dev', 'stable']),
    makeSnapshot('staging-1', '2024-03-01T10:00:00Z', []),
  ];

  it('returns total count with no options', () => {
    const result = countSnapshots(snapshots);
    expect(result.total).toBe(5);
  });

  it('filters by prefix', () => {
    const result = countSnapshots(snapshots, { prefix: 'prod' });
    expect(result.total).toBe(2);
  });

  it('filters by tags', () => {
    const result = countSnapshots(snapshots, { tags: ['stable'] });
    expect(result.total).toBe(2);
  });

  it('filters by multiple tags (AND logic)', () => {
    const result = countSnapshots(snapshots, { tags: ['prod', 'stable'] });
    expect(result.total).toBe(1);
  });

  it('groups by month', () => {
    const result = countSnapshots(snapshots, { groupBy: 'month' });
    expect(result.grouped['2024-01']).toBe(2);
    expect(result.grouped['2024-02']).toBe(2);
    expect(result.grouped['2024-03']).toBe(1);
  });

  it('groups by day', () => {
    const result = countSnapshots(snapshots, { groupBy: 'day' });
    expect(result.grouped['2024-01-05']).toBe(1);
    expect(result.grouped['2024-02-03']).toBe(1);
  });

  it('counts by tag', () => {
    const result = countSnapshots(snapshots);
    expect(result.byTag['prod']).toBe(2);
    expect(result.byTag['dev']).toBe(2);
    expect(result.byTag['stable']).toBe(2);
  });

  it('returns empty grouped and byTag when no matches', () => {
    const result = countSnapshots(snapshots, { prefix: 'nonexistent' });
    expect(result.total).toBe(0);
    expect(result.grouped).toEqual({});
    expect(result.byTag).toEqual({});
  });
});

describe('formatCountResult', () => {
  it('formats total only', () => {
    const output = formatCountResult({ total: 3, grouped: {}, byTag: {} });
    expect(output).toContain('Total snapshots: 3');
  });

  it('includes grouped section when groupBy provided', () => {
    const output = formatCountResult(
      { total: 2, grouped: { '2024-01': 2 }, byTag: {} },
      'month'
    );
    expect(output).toContain('By month:');
    expect(output).toContain('2024-01: 2');
  });

  it('includes by tag section', () => {
    const output = formatCountResult({ total: 1, grouped: {}, byTag: { prod: 1 } });
    expect(output).toContain('By tag:');
    expect(output).toContain('prod: 1');
  });
});
