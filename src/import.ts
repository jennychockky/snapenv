import { EnvMap } from './env';
import { parseEnvFile, parseEnvString } from './env';
import * as fs from 'fs';
import * as path from 'path';

export type ImportFormat = 'dotenv' | 'json' | 'shell';

export function detectImportFormat(filePath: string): ImportFormat {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.json') return 'json';
  if (ext === '.sh') return 'shell';
  return 'dotenv';
}

export function importDotenv(content: string): EnvMap {
  return parseEnvString(content);
}

export function importJson(content: string): EnvMap {
  const parsed = JSON.parse(content);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('JSON import must be a flat key-value object');
  }
  const map: EnvMap = new Map();
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== 'string') throw new Error(`Value for key "${key}" must be a string`);
    map.set(key, value);
  }
  return map;
}

export function importShell(content: string): EnvMap {
  const lines = content.split('\n');
  const exportLines = lines
    .map(l => l.trim())
    .filter(l => l.startsWith('export '))
    .map(l => l.slice('export '.length));
  return parseEnvString(exportLines.join('\n'));
}

export function importSnapshot(filePath: string, formatOverride?: ImportFormat): EnvMap {
  const content = fs.readFileSync(filePath, 'utf-8');
  const format = formatOverride ?? detectImportFormat(filePath);
  switch (format) {
    case 'json': return importJson(content);
    case 'shell': return importShell(content);
    case 'dotenv': default: return importDotenv(content);
  }
}
