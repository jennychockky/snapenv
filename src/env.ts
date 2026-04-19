import * as fs from 'fs';
import * as path from 'path';

export interface EnvMap {
  [key: string]: string;
}

/**
 * Reads and parses a .env file into a key-value map.
 */
export function parseEnvFile(filePath: string): EnvMap {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Env file not found: ${resolved}`);
  }

  const content = fs.readFileSync(resolved, 'utf-8');
  return parseEnvString(content);
}

/**
 * Parses a raw .env string into a key-value map.
 */
export function parseEnvString(content: string): EnvMap {
  const result: EnvMap = {};

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Serialises an EnvMap back to .env file format.
 */
export function serializeEnvMap(env: EnvMap): string {
  return Object.entries(env)
    .map(([key, value]) => {
      const needsQuotes = /\s/.test(value);
      const serializedValue = needsQuotes ? `"${value}"` : value;
      return `${key}=${serializedValue}`;
    })
    .join('\n');
}

/**
 * Captures the current process environment, optionally filtered by keys.
 */
export function captureProcessEnv(keys?: string[]): EnvMap {
  const source = process.env as EnvMap;
  if (!keys || keys.length === 0) {
    return { ...source };
  }
  return keys.reduce<EnvMap>((acc, key) => {
    if (source[key] !== undefined) {
      acc[key] = source[key];
    }
    return acc;
  }, {});
}
