import { Command } from 'commander';
import { loadSnapshots } from './storage';
import { applyFilters, FilterOptions, formatFilterSummary } from './snapshot-filter';

export function registerFilterCommand(program: Command): void {
  program
    .command('filter')
    .description('List snapshots matching specified criteria')
    .option('--prefix <prefix>', 'Filter by name prefix')
    .option('--tag <tags...>', 'Filter by one or more tags (all must match)')
    .option('--before <date>', 'Filter snapshots created before date (ISO)')
    .option('--after <date>', 'Filter snapshots created after date (ISO)')
    .option('--key-pattern <pattern>', 'Filter by key matching regex pattern')
    .option('--min-keys <n>', 'Minimum number of keys', parseInt)
    .option('--max-keys <n>', 'Maximum number of keys', parseInt)
    .option('--count', 'Only print the count of matched snapshots')
    .action((opts) => {
      const snapshots = loadSnapshots();

      const filterOpts: FilterOptions = {};

      if (opts.prefix) filterOpts.prefix = opts.prefix;
      if (opts.tag) filterOpts.tags = opts.tag;
      if (opts.before) filterOpts.before = new Date(opts.before);
      if (opts.after) filterOpts.after = new Date(opts.after);
      if (opts.keyPattern) filterOpts.keyPattern = new RegExp(opts.keyPattern);
      if (opts.minKeys !== undefined) filterOpts.minKeys = opts.minKeys;
      if (opts.maxKeys !== undefined) filterOpts.maxKeys = opts.maxKeys;

      const matched = applyFilters(snapshots, filterOpts);

      if (opts.count) {
        console.log(formatFilterSummary(snapshots.length, matched.length));
        return;
      }

      if (matched.length === 0) {
        console.log('No snapshots matched the given filters.');
        return;
      }

      matched.forEach((s) => {
        const keyCount = Object.keys(s.env).length;
        const tags = Array.isArray(s.tags) && s.tags.length > 0
          ? ` [${s.tags.join(', ')}]`
          : '';
        console.log(`  ${s.name}${tags}  (${keyCount} keys, ${s.createdAt})`);
      });

      console.log();
      console.log(formatFilterSummary(snapshots.length, matched.length));
    });
}
