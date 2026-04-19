import { loadSnapshots, saveSnapshots, getSnapshot } from './storage';
import { Snapshot } from './storage';

export function copySnapshot(
  storageDir: string,
  sourceName: string,
  destName: string,
  overwrite = false
): Snapshot {
  const snapshots = loadSnapshots(storageDir);

  if (!snapshots[sourceName]) {
    throw new Error(`Snapshot '${sourceName}' not found`);
  }

  if (snapshots[destName] && !overwrite) {
    throw new Error(
      `Snapshot '${destName}' already exists. Use --overwrite to replace it.`
    );
  }

  const source = snapshots[sourceName];
  const copy: Snapshot = {
    name: destName,
    env: { ...source.env },
    createdAt: new Date().toISOString(),
    tags: source.tags ? [...source.tags] : [],
  };

  snapshots[destName] = copy;
  saveSnapshots(storageDir, snapshots);
  return copy;
}

export function cloneSnapshot(
  storageDir: string,
  sourceName: string,
  destName: string,
  overwrite = false
): Snapshot {
  return copySnapshot(storageDir, sourceName, destName, overwrite);
}
