import { loadSnapshots, saveSnapshots } from './storage';
import { resolveAlias, listAliases, addAlias, removeAlias } from './alias';

export function renameSnapshot(
  oldName: string,
  newName: string,
  storageDir: string
): void {
  const snapshots = loadSnapshots(storageDir);

  if (!snapshots[oldName]) {
    throw new Error(`Snapshot '${oldName}' not found`);
  }
  if (snapshots[newName]) {
    throw new Error(`Snapshot '${newName}' already exists`);
  }

  snapshots[newName] = { ...snapshots[oldName], name: newName };
  delete snapshots[oldName];
  saveSnapshots(storageDir, snapshots);
}

export function updateAliasesAfterRename(
  oldName: string,
  newName: string,
  storageDir: string
): string[] {
  const aliases = listAliases(storageDir);
  const updated: string[] = [];

  for (const [alias, target] of Object.entries(aliases)) {
    if (target === oldName) {
      removeAlias(alias, storageDir);
      addAlias(alias, newName, storageDir);
      updated.push(alias);
    }
  }

  return updated;
}
