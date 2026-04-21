import * as fs from "fs";
import * as path from "path";

export interface LockedSnapshot {
  name: string;
  lockedAt: string;
  reason?: string;
}

export type LockMap = Record<string, LockedSnapshot>;

export function lockSnapshot(
  locks: LockMap,
  name: string,
  reason?: string
): LockMap {
  if (locks[name]) {
    throw new Error(`Snapshot "${name}" is already locked.`);
  }
  return {
    ...locks,
    [name]: { name, lockedAt: new Date().toISOString(), reason },
  };
}

export function unlockSnapshot(locks: LockMap, name: string): LockMap {
  if (!locks[name]) {
    throw new Error(`Snapshot "${name}" is not locked.`);
  }
  const updated = { ...locks };
  delete updated[name];
  return updated;
}

export function isLocked(locks: LockMap, name: string): boolean {
  return Object.prototype.hasOwnProperty.call(locks, name);
}

export function listLocks(locks: LockMap): LockedSnapshot[] {
  return Object.values(locks).sort((a, b) =>
    a.lockedAt.localeCompare(b.lockedAt)
  );
}

export function formatLocks(locks: LockMap): string {
  const entries = listLocks(locks);
  if (entries.length === 0) return "No locked snapshots.";
  return entries
    .map((l) => {
      const reason = l.reason ? `  reason: ${l.reason}` : "";
      return `🔒 ${l.name}  (locked at ${l.lockedAt})${reason}`;
    })
    .join("\n");
}
