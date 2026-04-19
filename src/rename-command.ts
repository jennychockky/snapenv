import { Command } from 'commander';
import { renameSnapshot, updateAliasesAfterRename } from './rename';
import { getStorageDir } from './storage';

export function registerRenameCommand(program: Command): void {
  program
    .command('rename <old-name> <new-name>')
    .description('Rename a snapshot and update any aliases pointing to it')
    .option('--no-update-aliases', 'Skip updating aliases that reference the old name')
    .action((oldName: string, newName: string, opts: { updateAliases: boolean }) => {
      const storageDir = getStorageDir();

      try {
        renameSnapshot(oldName, newName, storageDir);
        console.log(`Renamed snapshot '${oldName}' to '${newName}'`);

        if (opts.updateAliases !== false) {
          const updated = updateAliasesAfterRename(oldName, newName, storageDir);
          if (updated.length > 0) {
            console.log(`Updated aliases: ${updated.join(', ')}`);
          }
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
