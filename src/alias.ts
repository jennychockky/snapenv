import { loadSnapshots, saveSnapshots } from './storage';

export interface AliasMap {
  [alias: string]: string; // alias -> snapshot name
}

export function addAlias(alias: string, snapshotName: string, storageDir: string): void {
  const data = loadSnapshots(storageDir);
  if (!data.aliases) data.aliases = {};
  if (!data.snapshots[snapshotName]) {
    throw new Error(`Snapshot '${snapshotName}' does not exist`);
  }
  data.aliases[alias] = snapshotName;
  saveSnapshots(storageDir, data);
}

export function removeAlias(alias: string, storageDir: string): void {
  const data = loadSnapshots(storageDir);
  if (!data.aliases || !data.aliases[alias]) {
    throw new Error(`Alias '${alias}' does not exist`);
  }
  delete data.aliases[alias];
  saveSnapshots(storageDir, data);
}

export function resolveAlias(nameOrAlias: string, storageDir: string): string {
  const data = loadSnapshots(storageDir);
  if (data.aliases && data.aliases[nameOrAlias]) {
    return data.aliases[nameOrAlias];
  }
  return nameOrAlias;
}

export function listAliases(storageDir: string): AliasMap {
  const data = loadSnapshots(storageDir);
  return data.aliases || {};
}
