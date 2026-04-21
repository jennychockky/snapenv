import { Snapshot } from './storage';

export interface RollbackResult {
  success: boolean;
  snapshotName: string;
  previousName: string | null;
  restoredKeys: number;
  message: string;
}

export interface RollbackEntry {
  timestamp: string;
  fromSnapshot: string;
  toSnapshot: string;
}

export function buildRollbackStack(
  history: RollbackEntry[],
  maxDepth = 10
): RollbackEntry[] {
  return history.slice(-maxDepth);
}

export function getLastRollbackTarget(
  history: RollbackEntry[]
): string | null {
  if (history.length === 0) return null;
  const last = history[history.length - 1];
  return last.fromSnapshot;
}

export function createRollbackEntry(
  fromSnapshot: string,
  toSnapshot: string
): RollbackEntry {
  return {
    timestamp: new Date().toISOString(),
    fromSnapshot,
    toSnapshot,
  };
}

export function formatRollbackResult(result: RollbackResult): string {
  if (!result.success) return `Rollback failed: ${result.message}`;
  const prev = result.previousName ? ` (was: ${result.previousName})` : '';
  return `Rolled back to "${result.snapshotName}"${prev} — ${result.restoredKeys} key(s) restored.`;
}

export function performRollback(
  current: Snapshot,
  target: Snapshot
): RollbackResult {
  const restoredKeys = Object.keys(target.env).length;
  return {
    success: true,
    snapshotName: target.name,
    previousName: current.name,
    restoredKeys,
    message: 'OK',
  };
}
