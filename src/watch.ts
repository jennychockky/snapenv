/**
 * watch.ts — watches a .env file for changes and auto-updates a named snapshot
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseEnvFile } from './env';
import { loadSnapshots, saveSnapshots } from './storage';
import { appendHistoryEntry } from './history-command';

export interface WatchOptions {
  snapshotName: string;
  filePath: string;
  storageDir: string;
  debounceMs?: number;
  onUpdate?: (name: string, changedKeys: string[]) => void;
  onError?: (err: Error) => void;
}

/**
 * Compute the list of keys that differ between two env maps.
 */
export function changedKeys(
  prev: Record<string, string>,
  next: Record<string, string>
): string[] {
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  return [...keys].filter((k) => prev[k] !== next[k]);
}

/**
 * Start watching a .env file and sync changes into a snapshot.
 * Returns a function that stops the watcher.
 */
export function watchEnvFile(options: WatchOptions): () => void {
  const {
    snapshotName,
    filePath,
    storageDir,
    debounceMs = 300,
    onUpdate,
    onError,
  } = options;

  const absPath = path.resolve(filePath);
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const handleChange = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        const newEnv = parseEnvFile(absPath);
        const snapshots = loadSnapshots(storageDir);
        const existing = snapshots[snapshotName];
        const prevEnv: Record<string, string> = existing?.env ?? {};

        const changed = changedKeys(prevEnv, newEnv);
        if (changed.length === 0) return;

        const now = new Date().toISOString();
        snapshots[snapshotName] = {
          name: snapshotName,
          env: newEnv,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };

        saveSnapshots(storageDir, snapshots);

        try {
          appendHistoryEntry(storageDir, {
            snapshotName,
            action: 'watch-update',
            timestamp: now,
            changedKeys: changed,
          });
        } catch {
          // history is best-effort
        }

        onUpdate?.(snapshotName, changed);
      } catch (err) {
        onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    }, debounceMs);
  };

  const watcher = fs.watch(absPath, { persistent: false }, handleChange);

  watcher.on('error', (err) => {
    onError?.(err);
  });

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    watcher.close();
  };
}
