import { ExportFormat } from './export';

export function detectFormat(filename: string): ExportFormat {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'json':
      return 'json';
    case 'sh':
      return 'shell';
    case 'env':
    default:
      return 'dotenv';
  }
}

export function formatExtension(format: ExportFormat): string {
  switch (format) {
    case 'json':
      return '.json';
    case 'shell':
      return '.sh';
    case 'dotenv':
    default:
      return '.env';
  }
}

export function buildExportFilename(snapshotName: string, format: ExportFormat): string {
  const safe = snapshotName.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${safe}${formatExtension(format)}`;
}

export function parseFormatFlag(flag: string | undefined): ExportFormat {
  if (!flag) return 'dotenv';
  const lower = flag.toLowerCase();
  if (lower === 'json' || lower === 'shell' || lower === 'dotenv') {
    return lower as ExportFormat;
  }
  throw new Error(`Invalid format "${flag}". Valid formats: dotenv, json, shell`);
}
