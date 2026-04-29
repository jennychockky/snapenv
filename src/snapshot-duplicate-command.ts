import { Command } from 'commander';
import { loadSnapshots } from './storage';
import { findDuplicates, formatDuplicates } from './snapshot-duplicate';

export function registerDuplicateCommand(program: Command): void {
  program
    .command('duplicates')
    .description('Find duplicate snapshots based on environment variable fingerprints')
    .option('--json', 'Output results as JSON')
    .option('--min-count <n>', 'Minimum group size to report', '2')
    .action(async (opts) => {
      const store = await loadSnapshots();
      const snapshots = Object.values(store);

      if (snapshots.length === 0) {
        console.log('No snapshots found.');
        return;
      }

      const minCount = parseInt(opts.minCount, 10);
      if (isNaN(minCount) || minCount < 2) {
        console.error('--min-count must be an integer >= 2');
        process.exit(1);
      }

      const groups = findDuplicates(snapshots).filter(
        (g) => g.snapshots.length >= minCount
      );

      if (groups.length === 0) {
        console.log('No duplicate snapshots found.');
        return;
      }

      if (opts.json) {
        console.log(JSON.stringify(groups, null, 2));
      } else {
        console.log(formatDuplicates(groups));
      }
    });
}
