import { Snapshot } from './storage';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';

export interface ArchiveEntry {
  name: string;
  snapshot: Snapshot;
  archivedAt: string;
  reason?: string;
}

export interface ArchiveStore {
  entries: ArchiveEntry[];
}

export function archiveSnapshot(
  store: ArchiveStore,
  snapshot: Snapshot,
  reason?: string
): ArchiveStore {
  const entry: ArchiveEntry = {
    name: snapshot.name,
    snapshot,
    archivedAt: new Date().toISOString(),
    reason,
  };
  return { entries: [...store.entries, entry] };
}

export function unarchiveSnapshot(
  store: ArchiveStore,
  name: string
): { store: ArchiveStore; snapshot: Snapshot | undefined } {
  const entry = store.entries.find((e) => e.name === name);
  if (!entry) return { store, snapshot: undefined };
  const updated = { entries: store.entries.filter((e) => e.name !== name) };
  return { store: updated, snapshot: entry.snapshot };
}

export function listArchived(store: ArchiveStore): ArchiveEntry[] {
  return [...store.entries].sort(
    (a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()
  );
}

export function formatArchiveList(entries: ArchiveEntry[]): string {
  if (entries.length === 0) return 'No archived snapshots.';
  return entries
    .map((e) => {
      const date = new Date(e.archivedAt).toLocaleString();
      const reason = e.reason ? ` — ${e.reason}` : '';
      return `  ${e.name}  (archived ${date}${reason})`;
    })
    .join('\n');
}

export function exportArchive(store: ArchiveStore): Buffer {
  const json = JSON.stringify(store, null, 2);
  return zlib.gzipSync(Buffer.from(json, 'utf8'));
}

export function importArchive(buf: Buffer): ArchiveStore {
  const json = zlib.gunzipSync(buf).toString('utf8');
  return JSON.parse(json) as ArchiveStore;
}
