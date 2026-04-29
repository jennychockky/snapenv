import { Snapshot } from './storage';
import { EnvMap } from './env';

export interface PreviewOptions {
  maxKeys?: number;
  maskSecrets?: boolean;
  secretPatterns?: RegExp[];
}

const DEFAULT_SECRET_PATTERNS: RegExp[] = [
  /secret/i,
  /password/i,
  /passwd/i,
  /token/i,
  /api_?key/i,
  /private/i,
  /credential/i,
];

export function maskValue(key: string, value: string, patterns: RegExp[]): string {
  return patterns.some((p) => p.test(key)) ? '****' : value;
}

export function previewSnapshot(
  snapshot: Snapshot,
  options: PreviewOptions = {}
): string[] {
  const {
    maxKeys = 20,
    maskSecrets = true,
    secretPatterns = DEFAULT_SECRET_PATTERNS,
  } = options;

  const entries = Object.entries(snapshot.env);
  const total = entries.length;
  const shown = entries.slice(0, maxKeys);

  const lines: string[] = [
    `Snapshot: ${snapshot.name}`,
    `Created:  ${new Date(snapshot.createdAt).toLocaleString()}`,
    `Keys:     ${total}`,
    '---',
  ];

  for (const [key, value] of shown) {
    const display = maskSecrets ? maskValue(key, value, secretPatterns) : value;
    lines.push(`  ${key}=${display}`);
  }

  if (total > maxKeys) {
    lines.push(`  ... and ${total - maxKeys} more key(s)`);
  }

  return lines;
}

export function formatPreview(lines: string[]): string {
  return lines.join('\n');
}
