import { Command } from 'commander';
import { loadSnapshots, saveSnapshots } from './storage';
import { copySnapshot, cloneSnapshot } from './copy';
import { resolveAlias } from './alias';

export function registerCloneCommand(program: Command): void {
  program
    .command('clone <source> <destination>')
    .description('Clone a snapshot to a new name, optionally in a different namespace')
    .option('--namespace <ns>', 'Target namespace for the cloned snapshot')
    .option('--overwrite', 'Overwrite destination if it already exists', false)
    .action(async (source: string, destination: string, opts: { namespace?: string; overwrite: boolean }) => {
      try {
        const snapshots = await loadSnapshots();

        const resolvedSource = resolveAlias(source, snapshots) ?? source;

        if (!snapshots[resolvedSource]) {
          console.error(`Error: snapshot "${resolvedSource}" not found.`);
          process.exit(1);
        }

        const targetName = opts.namespace
          ? `${opts.namespace}:${destination}`
          : destination;

        if (snapshots[targetName] && !opts.overwrite) {
          console.error(
            `Error: snapshot "${targetName}" already exists. Use --overwrite to replace it.`
          );
          process.exit(1);
        }

        const updated = cloneSnapshot(snapshots, resolvedSource, targetName);
        await saveSnapshots(updated);

        console.log(`Cloned "${resolvedSource}" → "${targetName}".`);
      } catch (err) {
        console.error('Clone failed:', (err as Error).message);
        process.exit(1);
      }
    });

  program
    .command('clone-all <sourcePrefix> <destPrefix>')
    .description('Clone all snapshots matching a prefix to a new prefix')
    .option('--overwrite', 'Overwrite destinations if they already exist', false)
    .action(async (sourcePrefix: string, destPrefix: string, opts: { overwrite: boolean }) => {
      try {
        const snapshots = await loadSnapshots();
        const matches = Object.keys(snapshots).filter(k => k.startsWith(sourcePrefix));

        if (matches.length === 0) {
          console.warn(`No snapshots found with prefix "${sourcePrefix}".`);
          return;
        }

        let updated = { ...snapshots };
        const results: string[] = [];

        for (const src of matches) {
          const suffix = src.slice(sourcePrefix.length);
          const dest = `${destPrefix}${suffix}`;

          if (updated[dest] && !opts.overwrite) {
            console.warn(`Skipping "${src}" → "${dest}" (already exists).`);
            continue;
          }

          updated = cloneSnapshot(updated, src, dest);
          results.push(`  ${src} → ${dest}`);
        }

        await saveSnapshots(updated);
        console.log(`Cloned ${results.length} snapshot(s):\n${results.join('\n')}`);
      } catch (err) {
        console.error('Clone-all failed:', (err as Error).message);
        process.exit(1);
      }
    });
}
