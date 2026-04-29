/**
 * Namespace support for grouping snapshots under logical project names.
 */

export interface NamespacedSnapshot {
  namespace: string;
  name: string;
}

/** Parse a "namespace/name" string into its parts. */
export function parseNamespacedKey(key: string): NamespacedSnapshot {
  const slashIdx = key.indexOf('/');
  if (slashIdx === -1) {
    return { namespace: 'default', name: key };
  }
  const namespace = key.slice(0, slashIdx).trim();
  const name = key.slice(slashIdx + 1).trim();
  if (!namespace || !name) {
    throw new Error(`Invalid namespaced key: "${key}"`);
  }
  return { namespace, name };
}

/** Build a "namespace/name" string from parts. */
export function buildNamespacedKey(namespace: string, name: string): string {
  if (!namespace || !name) {
    throw new Error('namespace and name must be non-empty');
  }
  return `${namespace}/${name}`;
}

/** Return all unique namespaces present in a list of snapshot names. */
export function listNamespaces(snapshotNames: string[]): string[] {
  const ns = new Set<string>();
  for (const key of snapshotNames) {
    try {
      ns.add(parseNamespacedKey(key).namespace);
    } catch {
      ns.add('default');
    }
  }
  return Array.from(ns).sort();
}

/** Filter snapshot names that belong to the given namespace. */
export function filterByNamespace(
  snapshotNames: string[],
  namespace: string
): string[] {
  return snapshotNames.filter((key) => {
    try {
      return parseNamespacedKey(key).namespace === namespace;
    } catch {
      return namespace === 'default';
    }
  });
}

/** Strip the namespace prefix from a key, returning just the name. */
export function stripNamespace(key: string): string {
  return parseNamespacedKey(key).name;
}

/**
 * Rename all snapshot keys belonging to a given namespace by replacing
 * the namespace prefix with a new namespace name.
 *
 * Keys that do not belong to `fromNamespace` are returned unchanged.
 */
export function renameNamespace(
  snapshotNames: string[],
  fromNamespace: string,
  toNamespace: string
): string[] {
  if (!toNamespace) {
    throw new Error('toNamespace must be non-empty');
  }
  return snapshotNames.map((key) => {
    const parsed = parseNamespacedKey(key);
    if (parsed.namespace === fromNamespace) {
      return buildNamespacedKey(toNamespace, parsed.name);
    }
    return key;
  });
}
