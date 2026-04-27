import { Command } from 'commander';
import { loadSnapshots } from './storage';
import { buildSnapshotGraph, findRelated, formatGraph } from './snapshot-graph';

export function registerGraphCommand(program: Command): void {
  const graph = program
    .command('graph')
    .description('visualize relationships between snapshots');

  graph
    .command('show')
    .description('show full snapshot similarity graph')
    .option('--min-similarity <number>', 'minimum similarity threshold (0-1)', '0.1')
    .action(async (opts) => {
      const snapshots = await loadSnapshots();
      if (Object.keys(snapshots).length === 0) {
        console.log('No snapshots found.');
        return;
      }
      const g = buildSnapshotGraph(snapshots);
      const threshold = parseFloat(opts.minSimilarity);
      const filtered = {
        nodes: g.nodes,
        edges: g.edges.filter(e => e.similarity >= threshold),
      };
      console.log(formatGraph(filtered));
    });

  graph
    .command('related <name>')
    .description('list snapshots related to a given snapshot')
    .option('--threshold <number>', 'minimum similarity threshold (0-1)', '0.3')
    .action(async (name: string, opts) => {
      const snapshots = await loadSnapshots();
      if (!snapshots[name]) {
        console.error(`Snapshot "${name}" not found.`);
        process.exit(1);
      }
      const g = buildSnapshotGraph(snapshots);
      const threshold = parseFloat(opts.threshold);
      const related = findRelated(g, name, threshold);
      if (related.length === 0) {
        console.log(`No snapshots related to "${name}" above threshold ${threshold}.`);
        return;
      }
      console.log(`Snapshots related to "${name}":`);
      const edges = g.edges.filter(
        e => (e.from === name || e.to === name) && e.similarity >= threshold
      );
      for (const r of related) {
        const edge = edges.find(e => e.from === r || e.to === r);
        const pct = edge ? (edge.similarity * 100).toFixed(1) : '?';
        console.log(`  ${r}  (similarity: ${pct}%, shared keys: ${edge?.sharedKeys ?? '?'})`);
      }
    });
}
