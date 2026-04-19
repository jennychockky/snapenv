import { Command } from 'commander';
import { loadSnapshots } from './storage';
import { lintEnvMap, formatLintResults, builtinRules, LintRule } from './lint';

export function registerLintCommand(program: Command): void {
  program
    .command('lint <name>')
    .description('Lint a snapshot for common env variable issues')
    .option('--no-uppercase', 'Disable uppercase key check')
    .option('--no-empty', 'Disable empty value check')
    .option('--json', 'Output results as JSON')
    .action((name: string, opts) => {
      const snapshots = loadSnapshots();
      const snapshot = snapshots[name];
      if (!snapshot) {
        console.error(`Snapshot "${name}" not found.`);
        process.exit(1);
      }

      let rules: LintRule[] = [...builtinRules];
      if (opts.uppercase === false) {
        rules = rules.filter((r) => r.name !== 'uppercase-key');
      }
      if (opts.empty === false) {
        rules = rules.filter((r) => r.name !== 'no-empty-value');
      }

      const results = lintEnvMap(snapshot.env, rules);

      if (opts.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log(formatLintResults(results));
      }

      if (results.length > 0) process.exit(1);
    });
}
