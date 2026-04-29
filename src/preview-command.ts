import { Command } from 'commander';
import { loadSnapshots } from './storage';
import { previewSnapshot, formatPreview } from './snapshot-preview';

export function registerPreviewCommand(program: Command): void {
  program
    .command('preview <name>')
    .description('Show a preview of a snapshot\'s environment variables')
    .option('-n, --max-keys <number>', 'Maximum number of keys to display', '20')
    .option('--no-mask', 'Disable secret masking')
    .option('--pattern <pattern>', 'Additional secret key pattern (regex)')
    .action(async (name: string, opts) => {
      const snapshots = await loadSnapshots();
      const snapshot = snapshots[name];

      if (!snapshot) {
        console.error(`Snapshot "${name}" not found.`);
        process.exit(1);
      }

      const maxKeys = parseInt(opts.maxKeys, 10);
      if (isNaN(maxKeys) || maxKeys < 1) {
        console.error('--max-keys must be a positive integer.');
        process.exit(1);
      }

      const secretPatterns: RegExp[] = [];
      if (opts.pattern) {
        try {
          secretPatterns.push(new RegExp(opts.pattern, 'i'));
        } catch {
          console.error(`Invalid regex pattern: ${opts.pattern}`);
          process.exit(1);
        }
      }

      const lines = previewSnapshot(snapshot, {
        maxKeys,
        maskSecrets: opts.mask !== false,
        ...(secretPatterns.length > 0 ? { secretPatterns } : {}),
      });

      console.log(formatPreview(lines));
    });
}
