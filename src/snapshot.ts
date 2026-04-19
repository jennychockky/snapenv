import { EnvMap, captureProcessEnv, parseEnvFile } from './env';
import { saveSnapshot, getSnapshot } from './storage';

export interface SnapshotOptions {
  /** Capture from a .env file instead of process.env */
  fromFile?: string;
  /** Only include these keys when capturing from process.env */
  keys?: string[];
}

/**
 * Creates a new snapshot with the given name.
 * Source is either a .env file or the current process environment.
 */
export async function createSnapshot(
  name: string,
  options: SnapshotOptions = {}
): Promise<void> {
  if (!name || !name.trim()) {
    throw new Error('Snapshot name must not be empty.');
  }

  let env: EnvMap;

  if (options.fromFile) {
    env = parseEnvFile(options.fromFile);
  } else {
    env = captureProcessEnv(options.keys);
  }

  if (Object.keys(env).length === 0) {
    throw new Error('No environment variables captured. Snapshot not saved.');
  }

  await saveSnapshot(name.trim(), env);
}

/**
 * Restores a snapshot by applying its values to process.env.
 * Returns the applied EnvMap.
 */
export async function restoreSnapshot(name: string): Promise<EnvMap> {
  if (!name || !name.trim()) {
    throw new Error('Snapshot name must not be empty.');
  }

  const env = await getSnapshot(name.trim());

  if (!env) {
    throw new Error(`Snapshot "${name}" not found.`);
  }

  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
  }

  return env;
}

/**
 * Compares two snapshots and returns added, removed, and changed keys.
 */
export async function diffSnapshots(
  nameA: string,
  nameB: string
): Promise<{ added: string[]; removed: string[]; changed: string[] }> {
  const [a, b] = await Promise.all([getSnapshot(nameA), getSnapshot(nameB)]);

  if (!a) throw new Error(`Snapshot "${nameA}" not found.`);
  if (!b) throw new Error(`Snapshot "${nameB}" not found.`);

  const keysA = new Set(Object.keys(a));
  const keysB = new Set(Object.keys(b));

  const added = [...keysB].filter((k) => !keysA.has(k));
  const removed = [...keysA].filter((k) => !keysB.has(k));
  const changed = [...keysA].filter((k) => keysB.has(k) && a[k] !== b[k]);

  return { added, removed, changed };
}
