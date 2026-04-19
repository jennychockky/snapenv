import { EnvMap } from './env';

export type ExportFormat = 'dotenv' | 'json' | 'shell';

export function exportSnapshot(envMap: EnvMap, format: ExportFormat): string {
  switch (format) {
    case 'dotenv':
      return exportDotenv(envMap);
    case 'json':
      return exportJson(envMap);
    case 'shell':
      return exportShell(envMap);
    default:
      throw new Error(`Unknown export format: ${format}`);
  }
}

function exportDotenv(envMap: EnvMap): string {
  return Object.entries(envMap)
    .map(([key, value]) => `${key}=${quoteValue(value)}`)
    .join('\n');
}

function exportJson(envMap: EnvMap): string {
  return JSON.stringify(envMap, null, 2);
}

function exportShell(envMap: EnvMap): string {
  return Object.entries(envMap)
    .map(([key, value]) => `export ${key}=${quoteValue(value)}`)
    .join('\n');
}

function quoteValue(value: string): string {
  if (/[\s"'\\$`]/.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}

export function importSnapshot(content: string, format: ExportFormat): EnvMap {
  switch (format) {
    case 'dotenv':
    case 'shell': {
      const { parseEnvString } = require('./env');
      const cleaned = content
        .split('\n')
        .map(line => line.replace(/^export\s+/, ''))
        .join('\n');
      return parseEnvString(cleaned);
    }
    case 'json': {
      const parsed = JSON.parse(content);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Invalid JSON: expected an object');
      }
      return parsed as EnvMap;
    }
    default:
      throw new Error(`Unknown import format: ${format}`);
  }
}
