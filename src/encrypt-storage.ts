import { loadSnapshots, saveSnapshots } from './storage';
import { encryptData, decryptData } from './encrypt';
import type { Snapshot } from './storage';

export function encryptSnapshot(snapshot: Snapshot, passphrase: string): Snapshot {
  const encryptedVars: Record<string, string> = {};
  for (const [key, value] of Object.entries(snapshot.vars)) {
    encryptedVars[key] = encryptData(value, passphrase);
  }
  return { ...snapshot, vars: encryptedVars, encrypted: true };
}

export function decryptSnapshot(snapshot: Snapshot, passphrase: string): Snapshot {
  if (!snapshot.encrypted) return snapshot;
  const decryptedVars: Record<string, string> = {};
  for (const [key, value] of Object.entries(snapshot.vars)) {
    decryptedVars[key] = decryptData(value, passphrase);
  }
  return { ...snapshot, vars: decryptedVars, encrypted: false };
}

export async function saveEncryptedSnapshot(
  name: string,
  snapshot: Snapshot,
  passphrase: string
): Promise<void> {
  const snapshots = await loadSnapshots();
  snapshots[name] = encryptSnapshot(snapshot, passphrase);
  await saveSnapshots(snapshots);
}

export async function loadDecryptedSnapshot(
  name: string,
  passphrase: string
): Promise<Snapshot | null> {
  const snapshots = await loadSnapshots();
  const snapshot = snapshots[name];
  if (!snapshot) return null;
  return decryptSnapshot(snapshot, passphrase);
}
