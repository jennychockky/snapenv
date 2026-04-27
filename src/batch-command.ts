import { Command } from 'commander';
import { loadSnapshots, saveSnapshots } from './storage';
import { applyBatchDelete, applyBatchTag, formatBatchResult } from './batch';

export function registerBatchCommands(program: Command): void {
  const batch = program.command('batch').description('perform operations on multiple snapshots at once');

  batch
    .command('delete <names...>')
    .description('delete multiple snapshots by name')
    .action(async (names: string[]) => {
      const snapshots = await loadSnapshots();
      const result = applyBatchDelete(snapshots, names);
      await saveSnapshots(snapshots);
      console.log(formatBatchResult(result));
      if (result.failed.length > 0) process.exitCode = 1;
    });

  batch
    .command('tag <tag> <names...>')
    .description('add a tag to multiple snapshots')
    .action(async (tag: string, names: string[]) => {
      const snapshots = await loadSnapshots();
      const result = applyBatchTag(snapshots, names, tag);
      await saveSnapshots(snapshots);
      console.log(formatBatchResult(result));
      if (result.failed.length > 0) process.exitCode = 1;
    });

  batch
    .command('list')
    .description('list all snapshot names')
    .option('--json', 'output as JSON')
    .action(async (opts: { json?: boolean }) => {
      const snapshots = await loadSnapshots();
      const names = Object.keys(snapshots);
      if (opts.json) {
        console.log(JSON.stringify(names, null, 2));
      } else {
        if (names.length === 0) {
          console.log('No snapshots found.');
        } else {
          names.forEach((n) => console.log(n));
        }
      }
    });
}
