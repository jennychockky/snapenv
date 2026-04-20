import { Snapshot } from './storage';

export interface CompareResult {
  onlyInA: Record<string, string>;
  onlyInB: Record<string, string>;
  changed: Record<string, { a: string; b: string }>;
  unchanged: Record<string, string>;
}

export function compareSnapshots(a: Snapshot, b: Snapshot): CompareResult {
  const onlyInA: Record<string, string> = {};
  const onlyInB: Record<string, string> = {};
  const changed: Record<string, { a: string; b: string }> = {};
  const unchanged: Record<string, string> = {};

  const allKeys = new Set([...Object.keys(a.env), ...Object.keys(b.env)]);

  for (const key of allKeys) {
    const inA = key in a.env;
    const inB = key in b.env;
    if (inA && !inB) {
      onlyInA[key] = a.env[key];
    } else if (!inA && inB) {
      onlyInB[key] = b.env[key];
    } else if (a.env[key] !== b.env[key]) {
      changed[key] = { a: a.env[key], b: b.env[key] };
    } else {
      unchanged[key] = a.env[key];
    }
  }

  return { onlyInA, onlyInB, changed, unchanged };
}

export function formatCompareResult(
  result: CompareResult,
  nameA: string,
  nameB: string
): string {
  const lines: string[] = [];

  const onlyAKeys = Object.keys(result.onlyInA);
  if (onlyAKeys.length > 0) {
    lines.push(`Only in [${nameA}]:`);
    for (const key of onlyAKeys) {
      lines.push(`  - ${key}=${result.onlyInA[key]}`);
    }
  }

  const onlyBKeys = Object.keys(result.onlyInB);
  if (onlyBKeys.length > 0) {
    lines.push(`Only in [${nameB}]:`);
    for (const key of onlyBKeys) {
      lines.push(`  + ${key}=${result.onlyInB[key]}`);
    }
  }

  const changedKeys = Object.keys(result.changed);
  if (changedKeys.length > 0) {
    lines.push(`Changed:`);
    for (const key of changedKeys) {
      lines.push(`  ~ ${key}: ${result.changed[key].a} → ${result.changed[key].b}`);
    }
  }

  if (lines.length === 0) {
    return `[${nameA}] and [${nameB}] are identical (${Object.keys(result.unchanged).length} keys).`;
  }

  lines.push(`\nUnchanged: ${Object.keys(result.unchanged).length} key(s).`);
  return lines.join('\n');
}
