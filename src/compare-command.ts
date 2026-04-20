import { Command } from 'commander';
import { loadSnapshots } from './storage';
import { compareSnapshots, formatCompareResult } from './compare';

export function registerCompareCommand(program: Command): void {
  program
    .command('compare <snapshotA> <snapshotB>')
    .description('Compare two snapshots and show differences')
    .option('--only-changed', 'Show only changed and added/removed keys')
    .option('--json', 'Output result as JSON')
    .action(async (nameA: string, nameB: string, opts: { onlyChanged?: boolean; json?: boolean }) => {
      const snapshots = await loadSnapshots();

      const a = snapshots[nameA];
      const b = snapshots[nameB];

      if (!a) {
        console.error(`Snapshot not found: ${nameA}`);
        process.exit(1);
      }
      if (!b) {
        console.error(`Snapshot not found: ${nameB}`);
        process.exit(1);
      }

      const result = compareSnapshots(a, b);

      if (opts.json) {
        if (opts.onlyChanged) {
          const { unchanged: _u, ...rest } = result;
          console.log(JSON.stringify(rest, null, 2));
        } else {
          console.log(JSON.stringify(result, null, 2));
        }
        return;
      }

      if (opts.onlyChanged) {
        const filtered = { ...result, unchanged: {} };
        console.log(formatCompareResult(filtered, nameA, nameB));
      } else {
        console.log(formatCompareResult(result, nameA, nameB));
      }
    });
}
