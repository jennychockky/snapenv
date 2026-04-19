import { Command } from 'commander';
import { loadSnapshots, saveSnapshots, getSnapshot } from './storage';
import { mergeEnvMaps } from './snapshot';

export function registerMergeCommand(program: Command): void {
  program
    .command('merge <base> <source> <target>')
    .description('merge two snapshots into a new named snapshot')
    .option('--prefer <which>', 'which snapshot wins on conflict: base or source', 'source')
    .action(async (base: string, source: string, target: string, opts: { prefer: string }) => {
      const snapshots = loadSnapshots();

      const baseSnap = getSnapshot(snapshots, base);
      if (!baseSnap) {
        console.error(`Snapshot "${base}" not found.`);
        process.exit(1);
      }

      const sourceSnap = getSnapshot(snapshots, source);
      if (!sourceSnap) {
        console.error(`Snapshot "${source}" not found.`);
        process.exit(1);
      }

      if (getSnapshot(snapshots, target)) {
        console.error(`Snapshot "${target}" already exists. Choose a different target name.`);
        process.exit(1);
      }

      const preferSource = opts.prefer !== 'base';
      const mergedEnv = preferSource
        ? mergeEnvMaps(baseSnap.env, sourceSnap.env)
        : mergeEnvMaps(sourceSnap.env, baseSnap.env);

      const newSnapshot = {
        name: target,
        env: mergedEnv,
        createdAt: new Date().toISOString(),
        description: `Merged from "${base}" and "${source}" (prefer: ${opts.prefer})`,
      };

      snapshots.push(newSnapshot);
      saveSnapshots(snapshots);

      console.log(`Merged "${base}" + "${source}" → "${target}" (${Object.keys(mergedEnv).length} vars).`);
    });
}
