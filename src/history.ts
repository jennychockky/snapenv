import { Snapshot } from './storage';

export interface HistoryEntry {
  snapshotName: string;
  action: 'save' | 'restore' | 'delete';
  timestamp: string;
  keyCount: number;
}

export function recordHistory(
  history: HistoryEntry[],
  entry: Omit<HistoryEntry, 'timestamp'>
): HistoryEntry[] {
  const newEntry: HistoryEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };
  return [...history, newEntry];
}

export function filterHistory(
  history: HistoryEntry[],
  snapshotName?: string,
  action?: HistoryEntry['action']
): HistoryEntry[] {
  return history.filter((e) => {
    if (snapshotName && e.snapshotName !== snapshotName) return false;
    if (action && e.action !== action) return false;
    return true;
  });
}

export function formatHistoryEntry(entry: HistoryEntry): string {
  return `[${entry.timestamp}] ${entry.action.toUpperCase()} "${entry.snapshotName}" (${entry.keyCount} keys)`;
}

export function formatHistory(history: HistoryEntry[]): string {
  if (history.length === 0) return 'No history entries found.';
  return history.map(formatHistoryEntry).join('\n');
}

export function snapshotToHistoryEntry(
  snapshot: Snapshot,
  action: HistoryEntry['action']
): Omit<HistoryEntry, 'timestamp'> {
  return {
    snapshotName: snapshot.name,
    action,
    keyCount: Object.keys(snapshot.env).length,
  };
}
