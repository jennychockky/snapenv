import { getSnapshot } from './storage';
import { applySnapshot } from './snapshot';
import { resolveAlias } from './alias';
import { isExpired } from './expire';
import { decryptSnapshot } from './encrypt-storage';

export interface RestoreOptions {
  prefix?: string;
  dryRun?: boolean;
  passphrase?: string;
  force?: boolean;
}

export interface RestoreResult {
  applied: Record<string, string>;
  skipped: string[];
  warnings: string[];
}

export async function restoreSnapshot(
  name: string,
  options: RestoreOptions = {}
): Promise<RestoreResult> {
  const resolvedName = resolveAlias(name) ?? name;
  let snapshot = getSnapshot(resolvedName);

  if (!snapshot) {
    throw new Error(`Snapshot "${resolvedName}" not found.`);
  }

  const warnings: string[] = [];

  if (isExpired(resolvedName)) {
    if (!options.force) {
      throw new Error(
        `Snapshot "${resolvedName}" has expired. Use --force to restore anyway.`
      );
    }
    warnings.push(`Warning: snapshot "${resolvedName}" is expired.`);
  }

  if (snapshot.encrypted) {
    if (!options.passphrase) {
      throw new Error(`Snapshot "${resolvedName}" is encrypted. Provide --passphrase.`);
    }
    snapshot = await decryptSnapshot(snapshot, options.passphrase);
  }

  const envMap = applySnapshot(snapshot, { prefix: options.prefix });
  const skipped: string[] = [];

  if (!options.dryRun) {
    for (const [key, value] of Object.entries(envMap)) {
      process.env[key] = value;
    }
  }

  return { applied: envMap, skipped, warnings };
}

export function formatRestoreResult(result: RestoreResult): string {
  const lines: string[] = [];
  const count = Object.keys(result.applied).length;
  lines.push(`Restored ${count} variable${count !== 1 ? 's' : ''}.`);
  if (result.warnings.length > 0) {
    lines.push(...result.warnings);
  }
  if (result.skipped.length > 0) {
    lines.push(`Skipped: ${result.skipped.join(', ')}`);
  }
  return lines.join('\n');
}
