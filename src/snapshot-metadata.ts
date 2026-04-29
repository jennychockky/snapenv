import { Snapshot } from './storage';

export interface SnapshotMetadata {
  name: string;
  keyCount: number;
  createdAt: string;
  tags: string[];
  description?: string;
  source?: string;
  sizeBytes: number;
}

export function extractMetadata(snapshot: Snapshot): SnapshotMetadata {
  const env = snapshot.env ?? {};
  const serialized = JSON.stringify(env);
  return {
    name: snapshot.name,
    keyCount: Object.keys(env).length,
    createdAt: snapshot.createdAt ?? new Date().toISOString(),
    tags: snapshot.tags ?? [],
    description: snapshot.description,
    source: snapshot.source,
    sizeBytes: Buffer.byteLength(serialized, 'utf8'),
  };
}

export function formatMetadata(meta: SnapshotMetadata): string {
  const lines: string[] = [
    `Name:        ${meta.name}`,
    `Keys:        ${meta.keyCount}`,
    `Created:     ${meta.createdAt}`,
    `Size:        ${meta.sizeBytes} bytes`,
    `Tags:        ${meta.tags.length > 0 ? meta.tags.join(', ') : '(none)'}`,
  ];
  if (meta.description) lines.push(`Description: ${meta.description}`);
  if (meta.source) lines.push(`Source:      ${meta.source}`);
  return lines.join('\n');
}

export function annotateSnapshot(
  snapshot: Snapshot,
  updates: { description?: string; source?: string }
): Snapshot {
  return {
    ...snapshot,
    ...(updates.description !== undefined && { description: updates.description }),
    ...(updates.source !== undefined && { source: updates.source }),
  };
}

export function metadataMatchesQuery(
  meta: SnapshotMetadata,
  query: string
): boolean {
  const q = query.toLowerCase();
  return (
    meta.name.toLowerCase().includes(q) ||
    (meta.description?.toLowerCase().includes(q) ?? false) ||
    (meta.source?.toLowerCase().includes(q) ?? false) ||
    meta.tags.some((t) => t.toLowerCase().includes(q))
  );
}
