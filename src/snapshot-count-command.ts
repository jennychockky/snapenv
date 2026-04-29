import { Command } from 'commander';
import { loadSnapshots } from './storage';
import { countSnapshots, formatCountResult } from './snapshot-count';

export function registerCountCommand(program: Command): void {
  program
    .command('count')
    .description('Count snapshots grouped by a field')
    .option('--by <field>', 'Group by field: day | month | tag | prefix', 'day')
    .option('--prefix <prefix>', 'Filter snapshots by key prefix before counting')
    .option('--tag <tag>', 'Filter snapshots by tag before counting')
    .option('--json', 'Output raw JSON')
    .action(async (opts) => {
      const snapshots = await loadSnapshots();

      let filtered = snapshots;

      if (opts.tag) {
        filtered = filtered.filter(
          (s) => Array.isArray(s.tags) && s.tags.includes(opts.tag)
        );
      }

      if (opts.prefix) {
        filtered = filtered.filter((s) =>
          Object.keys(s.env).some((k) => k.startsWith(opts.prefix))
        );
      }

      const validBy = ['day', 'month', 'tag', 'prefix'];
      if (!validBy.includes(opts.by)) {
        console.error(
          `Invalid --by value "${opts.by}". Must be one of: ${validBy.join(', ')}`
        );
        process.exit(1);
      }

      const result = countSnapshots(filtered, opts.by as 'day' | 'month' | 'tag' | 'prefix');

      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(formatCountResult(result, opts.by));
      }
    });
}
