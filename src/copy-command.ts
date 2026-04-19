import { Command } from 'commander';
import { copySnapshot } from './copy';
import { getStorageDir } from './storage';

export function registerCopyCommand(program: Command): void {
  program
    .command('copy <source> <dest>')
    .alias('cp')
    .description('Copy a snapshot to a new name')
    .option('--overwrite', 'Overwrite destination if it already exists', false)
    .action((source: string, dest: string, opts: { overwrite: boolean }) => {
      const storageDir = getStorageDir();
      try {
        const copy = copySnapshot(storageDir, source, dest, opts.overwrite);
        console.log(`Snapshot '${source}' copied to '${copy.name}'`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
