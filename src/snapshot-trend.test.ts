import { buildTrendPoints, computeTrend, formatTrend, groupSnapshotsByName } from './snapshot-trend';
import { Snapshot } from './storage';

function makeSnapshot(name: string, env: Record<string, string>, createdAt: number): Snapshot {
  return { name, env, createdAt };
}

const snaps: Snapshot[] = [
  makeSnapshot('dev', { A: '1', B: '2' }, 1000),
  makeSnapshot('dev', { A: '1', B: '2', C: '3' }, 2000),
  makeSnapshot('dev', { A: '1', B: '2', C: '3', D: '4' }, 3000),
];

describe('buildTrendPoints', () => {
  it('returns points sorted by timestamp', () => {
    const points = buildTrendPoints([...snaps].reverse());
    expect(points[0].timestamp).toBe(1000);
    expect(points[2].timestamp).toBe(3000);
  });

  it('maps key counts correctly', () => {
    const points = buildTrendPoints(snaps);
    expect(points.map((p) => p.keyCount)).toEqual([2, 3, 4]);
  });
});

describe('computeTrend', () => {
  it('returns null for empty array', () => {
    expect(computeTrend([])).toBeNull();
  });

  it('detects growing direction', () => {
    const result = computeTrend(snaps);
    expect(result?.direction).toBe('growing');
    expect(result?.delta).toBe(2);
  });

  it('detects shrinking direction', () => {
    const reversed = [
      makeSnapshot('prod', { A: '1', B: '2', C: '3' }, 1000),
      makeSnapshot('prod', { A: '1' }, 2000),
    ];
    const result = computeTrend(reversed);
    expect(result?.direction).toBe('shrinking');
    expect(result?.delta).toBe(-2);
  });

  it('detects stable direction', () => {
    const stable = [
      makeSnapshot('staging', { X: '1' }, 1000),
      makeSnapshot('staging', { Y: '2' }, 2000),
    ];
    const result = computeTrend(stable);
    expect(result?.direction).toBe('stable');
    expect(result?.delta).toBe(0);
  });
});

describe('formatTrend', () => {
  it('includes direction arrow and delta', () => {
    const result = computeTrend(snaps)!;
    const output = formatTrend(result);
    expect(output).toContain('↑');
    expect(output).toContain('+2');
    expect(output).toContain('growing');
  });

  it('renders a bar for each point', () => {
    const result = computeTrend(snaps)!;
    const output = formatTrend(result);
    const lines = output.split('\n').filter((l) => l.includes('█'));
    expect(lines).toHaveLength(3);
  });
});

describe('groupSnapshotsByName', () => {
  it('groups snapshots by name', () => {
    const mixed = [
      makeSnapshot('dev', {}, 1),
      makeSnapshot('prod', {}, 2),
      makeSnapshot('dev', {}, 3),
    ];
    const groups = groupSnapshotsByName(mixed);
    expect(groups.get('dev')).toHaveLength(2);
    expect(groups.get('prod')).toHaveLength(1);
  });
});
