import { Snapshot } from './storage';

export interface TrendPoint {
  timestamp: number;
  keyCount: number;
  label: string;
}

export interface TrendResult {
  snapshotName: string;
  points: TrendPoint[];
  delta: number;
  direction: 'growing' | 'shrinking' | 'stable';
}

export function buildTrendPoints(snapshots: Snapshot[]): TrendPoint[] {
  return snapshots
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((snap) => ({
      timestamp: snap.createdAt,
      keyCount: Object.keys(snap.env).length,
      label: snap.name,
    }));
}

export function computeTrend(snapshots: Snapshot[]): TrendResult | null {
  if (snapshots.length === 0) return null;

  const points = buildTrendPoints(snapshots);
  const first = points[0].keyCount;
  const last = points[points.length - 1].keyCount;
  const delta = last - first;

  const direction: TrendResult['direction'] =
    delta > 0 ? 'growing' : delta < 0 ? 'shrinking' : 'stable';

  return {
    snapshotName: snapshots[0].name,
    points,
    delta,
    direction,
  };
}

export function formatTrend(result: TrendResult): string {
  const lines: string[] = [];
  const arrow = result.direction === 'growing' ? '↑' : result.direction === 'shrinking' ? '↓' : '→';

  lines.push(`Trend for "${result.snapshotName}": ${arrow} ${result.direction} (delta: ${result.delta > 0 ? '+' : ''}${result.delta})`);
  lines.push('');

  const maxCount = Math.max(...result.points.map((p) => p.keyCount), 1);
  const barWidth = 30;

  for (const point of result.points) {
    const date = new Date(point.timestamp).toISOString().slice(0, 10);
    const filled = Math.round((point.keyCount / maxCount) * barWidth);
    const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);
    lines.push(`  ${date}  [${bar}] ${point.keyCount} keys  (${point.label})`);
  }

  return lines.join('\n');
}

export function groupSnapshotsByName(snapshots: Snapshot[]): Map<string, Snapshot[]> {
  const map = new Map<string, Snapshot[]>();
  for (const snap of snapshots) {
    const existing = map.get(snap.name) ?? [];
    existing.push(snap);
    map.set(snap.name, existing);
  }
  return map;
}
