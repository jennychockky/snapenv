import { Command } from 'commander';
import { loadSnapshots } from './storage';
import { searchSnapshots, formatSearchResults } from './search';

export function registerSearchCommand(program: Command): void {
  program
    .command('search')
    .description('Search snapshots by key, value, name, or tag')
    .option('-k, --key <pattern>', 'filter by key pattern (regex)')
    .option('-v, --value <pattern>', 'filter by value pattern (regex)')
    .option('-n, --name <pattern>', 'filter by snapshot name pattern (regex)')
    .option('-t, --tag <tag>', 'filter by tag')
    .option('-c, --case-sensitive', 'use case-sensitive matching', false)
    .option('--json', 'output results as JSON')
    .action(async (opts) => {
      const snapshots = await loadSnapshots();

      if (Object.keys(snapshots).length === 0) {
        console.log('No snapshots found.');
        return;
      }

      const results = searchSnapshots(snapshots, {
        key: opts.key,
        value: opts.value,
        name: opts.name,
        tag: opts.tag,
        caseSensitive: opts.caseSensitive,
      });

      if (opts.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log(formatSearchResults(results));
      }
    });
}
