import { Command } from 'commander';
import { loadSnapshots } from './storage';
import {
  computeSnapshotStats,
  computeAggregateStats,
  formatSnapshotStats,
  formatAggregateStats,
} from './snapshot-stats';

export function registerStatsCommand(program: Command): void {
  const stats = program
    .command('stats')
    .description('Show statistics about snapshots');

  stats
    .command('show <name>')
    .description('Show statistics for a single snapshot')
    .option('--json', 'Output as JSON')
    .action(async (name: string, opts: { json?: boolean }) => {
      const snapshots = await loadSnapshots();
      const snapshot = snapshots[name];
      if (!snapshot) {
        console.error(`Snapshot "${name}" not found.`);
        process.exit(1);
      }
      const result = computeSnapshotStats(snapshot);
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(formatSnapshotStats(result));
      }
    });

  stats
    .command('summary')
    .description('Show aggregate statistics across all snapshots')
    .option('--json', 'Output as JSON')
    .option('--sort-by <field>', 'Sort individual stats by: keys | size | name', 'name')
    .action(async (opts: { json?: boolean; sortBy?: string }) => {
      const snapshots = await loadSnapshots();
      const all = Object.values(snapshots);

      if (all.length === 0) {
        console.log('No snapshots found.');
        return;
      }

      const aggregate = computeAggregateStats(all);
      const individual = all.map(computeSnapshotStats);

      const sortBy = opts.sortBy ?? 'name';
      if (sortBy === 'keys') individual.sort((a, b) => b.keyCount - a.keyCount);
      else if (sortBy === 'size') individual.sort((a, b) => b.sizeBytes - a.sizeBytes);
      else individual.sort((a, b) => a.name.localeCompare(b.name));

      if (opts.json) {
        console.log(JSON.stringify({ aggregate, snapshots: individual }, null, 2));
      } else {
        console.log(formatAggregateStats(aggregate));
        console.log('');
        console.log('Per-snapshot breakdown:');
        for (const s of individual) {
          console.log(`  ${s.name}: ${s.keyCount} keys, ${s.sizeBytes} bytes`);
        }
      }
    });
}
