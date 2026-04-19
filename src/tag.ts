import { loadSnapshots, saveSnapshots } from './storage';

export function addTag(snapshotName: string, tag: string): void {
  const snapshots = loadSnapshots();
  const snapshot = snapshots[snapshotName];
  if (!snapshot) throw new Error(`Snapshot '${snapshotName}' not found`);
  if (!snapshot.tags) snapshot.tags = [];
  if (!snapshot.tags.includes(tag)) {
    snapshot.tags.push(tag);
    saveSnapshots(snapshots);
  }
}

export function removeTag(snapshotName: string, tag: string): void {
  const snapshots = loadSnapshots();
  const snapshot = snapshots[snapshotName];
  if (!snapshot) throw new Error(`Snapshot '${snapshotName}' not found`);
  if (!snapshot.tags) return;
  snapshot.tags = snapshot.tags.filter((t: string) => t !== tag);
  saveSnapshots(snapshots);
}

export function listTags(snapshotName: string): string[] {
  const snapshots = loadSnapshots();
  const snapshot = snapshots[snapshotName];
  if (!snapshot) throw new Error(`Snapshot '${snapshotName}' not found`);
  return snapshot.tags ?? [];
}

export function findByTag(tag: string): string[] {
  const snapshots = loadSnapshots();
  return Object.entries(snapshots)
    .filter(([, snap]: [string, any]) => Array.isArray(snap.tags) && snap.tags.includes(tag))
    .map(([name]) => name);
}
