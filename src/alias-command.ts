import { Command } from 'commander';
import { addAlias, removeAlias, listAliases } from './alias';
import { getStorageDir } from './storage';

export function registerAliasCommands(program: Command): void {
  const alias = program
    .command('alias')
    .description('Manage snapshot aliases');

  alias
    .command('add <alias> <snapshot>')
    .description('Create an alias for a snapshot')
    .action((aliasName: string, snapshotName: string) => {
      try {
        const dir = getStorageDir();
        addAlias(aliasName, snapshotName, dir);
        console.log(`Alias '${aliasName}' -> '${snapshotName}' created.`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  alias
    .command('remove <alias>')
    .description('Remove an alias')
    .action((aliasName: string) => {
      try {
        const dir = getStorageDir();
        removeAlias(aliasName, dir);
        console.log(`Alias '${aliasName}' removed.`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  alias
    .command('list')
    .description('List all aliases')
    .action(() => {
      const dir = getStorageDir();
      const aliases = listAliases(dir);
      const entries = Object.entries(aliases);
      if (entries.length === 0) {
        console.log('No aliases defined.');
        return;
      }
      entries.forEach(([a, snap]) => console.log(`${a} -> ${snap}`));
    });
}
