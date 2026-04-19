import { Command } from 'commander';
import { addTag, removeTag, listTags, findByTag } from './tag';

export function registerTagCommands(program: Command): void {
  const tag = program.command('tag').description('Manage snapshot tags');

  tag
    .command('add <snapshot> <tag>')
    .description('Add a tag to a snapshot')
    .action((snapshot: string, tagName: string) => {
      try {
        addTag(snapshot, tagName);
        console.log(`Tag '${tagName}' added to snapshot '${snapshot}'.`);
      } catch (err: any) {
        console.error(err.message);
        process.exit(1);
      }
    });

  tag
    .command('remove <snapshot> <tag>')
    .description('Remove a tag from a snapshot')
    .action((snapshot: string, tagName: string) => {
      try {
        removeTag(snapshot, tagName);
        console.log(`Tag '${tagName}' removed from snapshot '${snapshot}'.`);
      } catch (err: any) {
        console.error(err.message);
        process.exit(1);
      }
    });

  tag
    .command('list <snapshot>')
    .description('List tags for a snapshot')
    .action((snapshot: string) => {
      try {
        const tags = listTags(snapshot);
        if (tags.length === 0) {
          console.log('No tags.');
        } else {
          tags.forEach((t) => console.log(t));
        }
      } catch (err: any) {
        console.error(err.message);
        process.exit(1);
      }
    });

  tag
    .command('find <tag>')
    .description('Find snapshots by tag')
    .action((tagName: string) => {
      const names = findByTag(tagName);
      if (names.length === 0) {
        console.log('No snapshots found.');
      } else {
        names.forEach((n) => console.log(n));
      }
    });
}
