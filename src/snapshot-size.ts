import { Snapshot } from './storage';

export interface SnapshotSize {
  name: string;
  keyCount: number;
  byteSize: number;
  largestKey: string | null;
  largestValueBytes: number;
}

export interface AggregateSizeReport {
  totalSnapshots: number;
  totalKeys: number;
  totalBytes: number;
  averageKeysPerSnapshot: number;
  averageBytesPerSnapshot: number;
  largest: SnapshotSize | null;
  smallest: SnapshotSize | null;
}

export function computeSnapshotSize(snapshot: Snapshot): SnapshotSize {
  const entries = Object.entries(snapshot.env);
  let byteSize = 0;
  let largestKey: string | null = null;
  let largestValueBytes = 0;

  for (const [key, value] of entries) {
    const valBytes = Buffer.byteLength(value, 'utf8');
    byteSize += Buffer.byteLength(key, 'utf8') + valBytes;
    if (valBytes > largestValueBytes) {
      largestValueBytes = valBytes;
      largestKey = key;
    }
  }

  return {
    name: snapshot.name,
    keyCount: entries.length,
    byteSize,
    largestKey,
    largestValueBytes,
  };
}

export function computeAggregateSizes(snapshots: Snapshot[]): AggregateSizeReport {
  if (snapshots.length === 0) {
    return { totalSnapshots: 0, totalKeys: 0, totalBytes: 0, averageKeysPerSnapshot: 0, averageBytesPerSnapshot: 0, largest: null, smallest: null };
  }

  const sizes = snapshots.map(computeSnapshotSize);
  const totalKeys = sizes.reduce((s, r) => s + r.keyCount, 0);
  const totalBytes = sizes.reduce((s, r) => s + r.byteSize, 0);
  const largest = sizes.reduce((a, b) => b.byteSize > a.byteSize ? b : a);
  const smallest = sizes.reduce((a, b) => b.byteSize < a.byteSize ? b : a);

  return {
    totalSnapshots: snapshots.length,
    totalKeys,
    totalBytes,
    averageKeysPerSnapshot: totalKeys / snapshots.length,
    averageBytesPerSnapshot: totalBytes / snapshots.length,
    largest,
    smallest,
  };
}

export function formatSnapshotSize(size: SnapshotSize): string {
  const lines: string[] = [
    `Snapshot : ${size.name}`,
    `Keys     : ${size.keyCount}`,
    `Size     : ${size.byteSize} bytes`,
  ];
  if (size.largestKey) {
    lines.push(`Largest  : ${size.largestKey} (${size.largestValueBytes} bytes)`);
  }
  return lines.join('\n');
}

export function formatAggregateSizes(report: AggregateSizeReport): string {
  if (report.totalSnapshots === 0) return 'No snapshots found.';
  const lines: string[] = [
    `Snapshots : ${report.totalSnapshots}`,
    `Total keys: ${report.totalKeys}`,
    `Total size: ${report.totalBytes} bytes`,
    `Avg keys  : ${report.averageKeysPerSnapshot.toFixed(1)}`,
    `Avg size  : ${report.averageBytesPerSnapshot.toFixed(1)} bytes`,
  ];
  if (report.largest) lines.push(`Largest   : ${report.largest.name} (${report.largest.byteSize} bytes)`);
  if (report.smallest) lines.push(`Smallest  : ${report.smallest.name} (${report.smallest.byteSize} bytes)`);
  return lines.join('\n');
}
