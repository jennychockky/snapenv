import { Snapshot } from './storage';

export interface SnapshotStats {
  name: string;
  keyCount: number;
  createdAt: string;
  sizeBytes: number;
  namespaces: string[];
  hasEncryption: boolean;
  hasTags: boolean;
}

export interface AggregateStats {
  totalSnapshots: number;
  totalKeys: number;
  averageKeys: number;
  largestSnapshot: string | null;
  smallestSnapshot: string | null;
  totalSizeBytes: number;
  uniqueNamespaces: string[];
}

export function computeSnapshotStats(snapshot: Snapshot): SnapshotStats {
  const entries = Object.entries(snapshot.env);
  const sizeBytes = Buffer.byteLength(
    entries.map(([k, v]) => `${k}=${v}`).join('\n'),
    'utf8'
  );

  const namespaces = Array.from(
    new Set(
      Object.keys(snapshot.env)
        .filter(k => k.includes('_'))
        .map(k => k.split('_')[0])
    )
  );

  return {
    name: snapshot.name,
    keyCount: entries.length,
    createdAt: snapshot.createdAt,
    sizeBytes,
    namespaces,
    hasEncryption: !!(snapshot as any).encrypted,
    hasTags: Array.isArray((snapshot as any).tags) && (snapshot as any).tags.length > 0,
  };
}

export function computeAggregateStats(snapshots: Snapshot[]): AggregateStats {
  if (snapshots.length === 0) {
    return {
      totalSnapshots: 0,
      totalKeys: 0,
      averageKeys: 0,
      largestSnapshot: null,
      smallestSnapshot: null,
      totalSizeBytes: 0,
      uniqueNamespaces: [],
    };
  }

  const stats = snapshots.map(computeSnapshotStats);
  const totalKeys = stats.reduce((sum, s) => sum + s.keyCount, 0);
  const totalSizeBytes = stats.reduce((sum, s) => sum + s.sizeBytes, 0);
  const sorted = [...stats].sort((a, b) => a.keyCount - b.keyCount);
  const allNamespaces = Array.from(new Set(stats.flatMap(s => s.namespaces)));

  return {
    totalSnapshots: snapshots.length,
    totalKeys,
    averageKeys: Math.round(totalKeys / snapshots.length),
    largestSnapshot: sorted[sorted.length - 1].name,
    smallestSnapshot: sorted[0].name,
    totalSizeBytes,
    uniqueNamespaces: allNamespaces,
  };
}

export function formatSnapshotStats(stats: SnapshotStats): string {
  const lines = [
    `Snapshot: ${stats.name}`,
    `  Keys:       ${stats.keyCount}`,
    `  Size:       ${stats.sizeBytes} bytes`,
    `  Created:    ${stats.createdAt}`,
    `  Namespaces: ${stats.namespaces.length > 0 ? stats.namespaces.join(', ') : '(none)'}`,
    `  Encrypted:  ${stats.hasEncryption ? 'yes' : 'no'}`,
    `  Tags:       ${stats.hasTags ? 'yes' : 'no'}`,
  ];
  return lines.join('\n');
}

export function formatAggregateStats(stats: AggregateStats): string {
  if (stats.totalSnapshots === 0) return 'No snapshots found.';
  const lines = [
    `Total snapshots:  ${stats.totalSnapshots}`,
    `Total keys:       ${stats.totalKeys}`,
    `Average keys:     ${stats.averageKeys}`,
    `Total size:       ${stats.totalSizeBytes} bytes`,
    `Largest:          ${stats.largestSnapshot}`,
    `Smallest:         ${stats.smallestSnapshot}`,
    `Namespaces:       ${stats.uniqueNamespaces.length > 0 ? stats.uniqueNamespaces.join(', ') : '(none)'}`,
  ];
  return lines.join('\n');
}
