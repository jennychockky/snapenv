import { getSnapshot, loadSnapshots } from './storage';
import { computeDiff, formatDiff, summarizeDiff } from './diff';

export interface DiffCommandOptions {
  summary?: boolean;
  prefix?: string;
}

export async function diffCommand(
  snapshotA: string,
  snapshotB: string,
  options: DiffCommandOptions = {}
): Promise<string> {
  const snapshots = await loadSnapshots();

  const a = getSnapshot(snapshots, snapshotA);
  if (!a) throw new Error(`Snapshot not found: ${snapshotA}`);

  const b = getSnapshot(snapshots, snapshotB);
  if (!b) throw new Error(`Snapshot not found: ${snapshotB}`);

  let envA = a.env;
  let envB = b.env;

  if (options.prefix) {
    const p = options.prefix;
    const filterByPrefix = (env: Record<string, string>) =>
      Object.fromEntries(Object.entries(env).filter(([k]) => k.startsWith(p)));
    envA = filterByPrefix(envA);
    envB = filterByPrefix(envB);
  }

  const entries = computeDiff(envA, envB);

  if (options.summary) {
    return `${snapshotA} → ${snapshotB}: ${summarizeDiff(entries)}`;
  }

  const header = `Diff: ${snapshotA} → ${snapshotB}\n${'─'.repeat(40)}`;
  return `${header}\n${formatDiff(entries)}`;
}
