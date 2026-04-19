import fs from 'fs';
import path from 'path';
import os from 'os';

const SNAPENV_DIR = path.join(os.homedir(), '.snapenv');
const SNAPSHOTS_FILE = path.join(SNAPENV_DIR, 'snapshots.json');

export interface Snapshot {
  name: string;
  project: string;
  createdAt: string;
  vars: Record<string, string>;
}

export type SnapshotStore = Record<string, Snapshot>;

function ensureStorageDir(): void {
  if (!fs.existsSync(SNAPENV_DIR)) {
    fs.mkdirSync(SNAPENV_DIR, { recursive: true });
  }
}

export function loadSnapshots(): SnapshotStore {
  ensureStorageDir();
  if (!fs.existsSync(SNAPSHOTS_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(SNAPSHOTS_FILE, 'utf-8');
    return JSON.parse(raw) as SnapshotStore;
  } catch {
    return {};
  }
}

export function saveSnapshots(store: SnapshotStore): void {
  ensureStorageDir();
  fs.writeFileSync(SNAPSHOTS_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

export function saveSnapshot(snapshot: Snapshot): void {
  const store = loadSnapshots();
  const key = `${snapshot.project}:${snapshot.name}`;
  store[key] = snapshot;
  saveSnapshots(store);
}

export function getSnapshot(project: string, name: string): Snapshot | undefined {
  const store = loadSnapshots();
  return store[`${project}:${name}`];
}

export function deleteSnapshot(project: string, name: string): boolean {
  const store = loadSnapshots();
  const key = `${project}:${name}`;
  if (!store[key]) return false;
  delete store[key];
  saveSnapshots(store);
  return true;
}

export function listSnapshots(project?: string): Snapshot[] {
  const store = loadSnapshots();
  return Object.values(store).filter(s => !project || s.project === project);
}
