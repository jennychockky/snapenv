import { Snapshot } from './storage';

export interface SearchOptions {
  key?: string;
  value?: string;
  name?: string;
  tag?: string;
  caseSensitive?: boolean;
}

export interface SearchResult {
  snapshotName: string;
  matches: Array<{ key: string; value: string }>;
}

export function searchSnapshots(
  snapshots: Record<string, Snapshot>,
  options: SearchOptions
): SearchResult[] {
  const results: SearchResult[] = [];
  const flags = options.caseSensitive ? '' : 'i';

  for (const [name, snapshot] of Object.entries(snapshots)) {
    if (options.name) {
      const re = new RegExp(options.name, flags);
      if (!re.test(name)) continue;
    }

    if (options.tag && snapshot.tags) {
      if (!snapshot.tags.includes(options.tag)) continue;
    }

    const matches: Array<{ key: string; value: string }> = [];

    for (const [k, v] of Object.entries(snapshot.env)) {
      const keyMatch = options.key
        ? new RegExp(options.key, flags).test(k)
        : true;
      const valueMatch = options.value
        ? new RegExp(options.value, flags).test(v)
        : true;

      if (keyMatch && valueMatch) {
        matches.push({ key: k, value: v });
      }
    }

    if (matches.length > 0 || (!options.key && !options.value)) {
      if (options.key || options.value) {
        results.push({ snapshotName: name, matches });
      } else {
        results.push({ snapshotName: name, matches: Object.entries(snapshot.env).map(([key, value]) => ({ key, value })) });
      }
    }
  }

  return results;
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return 'No matches found.';
  return results
    .map(r => {
      const lines = r.matches.map(m => `  ${m.key}=${m.value}`);
      return `[${r.snapshotName}]\n${lines.join('\n')}`;
    })
    .join('\n\n');
}
