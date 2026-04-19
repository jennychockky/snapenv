import { Command } from 'commander';
import { importSnapshot, ImportFormat } from './import';
import { saveSnapshot } from './storage';
import { serializeEnvMap } from './env';
import * as path from 'path';

export function registerImportCommand(program: Command): void {
  program
    .command('import <file> <snapshot-name>')
    .description('Import environment variables from a file into a named snapshot')
    .option('-f, --format <format>', 'force format: dotenv | json | shell')
    .option('--prefix <prefix>', 'only import keys with given prefix')
    .action((file: string, snapshotName: string, opts: { format?: string; prefix?: string }) => {
      const formatOverride = opts.format as ImportFormat | undefined;
      if (formatOverride && !['dotenv', 'json', 'shell'].includes(formatOverride)) {
        console.error(`Unknown format: ${formatOverride}`);
        process.exit(1);
      }

      let envMap = importSnapshot(path.resolve(file), formatOverride);

      if (opts.prefix) {
        const filtered = new Map<string, string>();
        for (const [key, value] of envMap) {
          if (key.startsWith(opts.prefix)) filtered.set(key, value);
        }
        envMap = filtered;
      }

      if (envMap.size === 0) {
        console.warn('Warning: no variables found to import.');
      }

      const snapshot = {
        name: snapshotName,
        env: Object.fromEntries(envMap),
        createdAt: new Date().toISOString(),
        tags: [] as string[],
      };

      saveSnapshot(snapshot);
      console.log(`Imported ${envMap.size} variable(s) into snapshot "${snapshotName}".`);
    });
}
