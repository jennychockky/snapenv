export interface EnvMap {
  [key: string]: string;
}

export interface DiffResult {
  added: string[];   // keys in current but not in snapshot
  removed: string[]; // keys in snapshot but not in current
  changed: string[]; // keys in both but with different values
}

/**
 * Apply a snapshot env over a base env, returning the merged result.
 */
export function applySnapshot(base: EnvMap, snapshot: EnvMap): EnvMap {
  return { ...base, ...snapshot };
}

/**
 * Diff a snapshot env against a current env.
 * "added" means present in current but absent in snapshot.
 * "removed" means present in snapshot but absent in current.
 * "changed" means present in both but values differ.
 */
export function diffSnapshot(snapshot: EnvMap, current: EnvMap): DiffResult {
  const snapKeys = new Set(Object.keys(snapshot));
  const currKeys = new Set(Object.keys(current));

  const added = [...currKeys].filter(k => !snapKeys.has(k));
  const removed = [...snapKeys].filter(k => !currKeys.has(k));
  const changed = [...snapKeys]
    .filter(k => currKeys.has(k) && snapshot[k] !== current[k]);

  return { added, removed, changed };
}

/**
 * Filter an env map to only include keys matching a prefix.
 */
export function filterByPrefix(env: EnvMap, prefix: string): EnvMap {
  return Object.fromEntries(
    Object.entries(env).filter(([k]) => k.startsWith(prefix))
  );
}

/**
 * Merge multiple env maps left-to-right (later maps win on conflict).
 */
export function mergeEnvMaps(...maps: EnvMap[]): EnvMap {
  return Object.assign({}, ...maps);
}
