import { Command } from 'commander';
import { loadSnapshots, saveSnapshots } from './storage';
import { parseSort, sortSnapshots, formatSortLabel } from './snapshot-sort';

export function registerSortCommand(program: Command): void {
  program
    .command('sort')
    .description('List snapshots sorted by a given field')
    .option('-b, --by <field>', 'Sort field: name, created, updated, size, keyCount', 'name')
    .option('-o, --order <order>', 'Sort order: asc or desc', 'asc')
    .option('--reorder', 'Persist the sorted order to storage', false)
    .action(async (opts) => {
      const raw = `${opts.by}:${opts.order}`;
      let sortOpts;
      try {
        sortOpts = parseSort(raw);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }

      const snapshots = await loadSnapshots();
      if (snapshots.length === 0) {
        console.log('No snapshots found.');
        return;
      }

      const sorted = sortSnapshots(snapshots, sortOpts);

      console.log(`Snapshots sorted by ${formatSortLabel(sortOpts)}:\n`);
      sorted.forEach((snap, i) => {
        const keys = Object.keys(snap.env ?? {}).length;
        const date = snap.updatedAt ?? snap.createdAt ?? 'unknown';
        console.log(`  ${i + 1}. ${snap.name}  (${keys} keys, updated: ${date})`);
      });

      if (opts.reorder) {
        await saveSnapshots(sorted);
        console.log(`\nStorage reordered by ${formatSortLabel(sortOpts)}.`);
      }
    });
}
