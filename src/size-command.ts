import { Command } from 'commander';
import { loadSnapshots } from './storage';
import { computeSnapshotSize, computeAggregateSizes, formatSnapshotSize, formatAggregateSizes } from './snapshot-size';

export function registerSizeCommand(program: Command): void {
  const sizeCmd = program
    .command('size')
    .description('Show byte size and key count of snapshots');

  sizeCmd
    .command('show <name>')
    .description('Show size details for a specific snapshot')
    .action(async (name: string) => {
      const snapshots = await loadSnapshots();
      const snapshot = snapshots.find(s => s.name === name);
      if (!snapshot) {
        console.error(`Snapshot "${name}" not found.`);
        process.exit(1);
      }
      console.log(formatSnapshotSize(computeSnapshotSize(snapshot)));
    });

  sizeCmd
    .command('all')
    .description('Show size details for all snapshots')
    .option('--sort <field>', 'Sort by: name | keys | bytes', 'bytes')
    .action(async (opts: { sort: string }) => {
      const snapshots = await loadSnapshots();
      if (snapshots.length === 0) {
        console.log('No snapshots found.');
        return;
      }
      const sizes = snapshots.map(computeSnapshotSize);
      const sorted = [...sizes].sort((a, b) => {
        if (opts.sort === 'name') return a.name.localeCompare(b.name);
        if (opts.sort === 'keys') return b.keyCount - a.keyCount;
        return b.byteSize - a.byteSize;
      });
      for (const s of sorted) {
        console.log(`${s.name.padEnd(24)} keys=${s.keyCount}  bytes=${s.byteSize}`);
      }
    });

  sizeCmd
    .command('summary')
    .description('Show aggregate size summary across all snapshots')
    .action(async () => {
      const snapshots = await loadSnapshots();
      console.log(formatAggregateSizes(computeAggregateSizes(snapshots)));
    });
}
