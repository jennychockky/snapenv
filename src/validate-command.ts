import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { getSnapshot } from './storage';
import { validateEnvMap, formatValidationReport, parseRulesFile, ValidationRule } from './validate';

const DEFAULT_RULES_FILE = '.snapenv-rules.json';

export function registerValidateCommand(program: Command): void {
  program
    .command('validate <snapshot>')
    .description('Validate a snapshot against a set of rules')
    .option('-r, --rules <file>', 'Path to JSON rules file', DEFAULT_RULES_FILE)
    .option('--require <keys>', 'Comma-separated list of required keys')
    .option('--allow <key=values>', 'Allowed values for a key (e.g. LOG_LEVEL=info,warn,error)', [])
    .action((snapshotName: string, opts: { rules: string; require?: string; allow: string[] }) => {
      const snapshot = getSnapshot(snapshotName);
      if (!snapshot) {
        console.error(`Snapshot "${snapshotName}" not found.`);
        process.exit(1);
      }

      let rules: ValidationRule[] = [];

      const rulesPath = path.resolve(opts.rules);
      if (fs.existsSync(rulesPath)) {
        try {
          rules = parseRulesFile(fs.readFileSync(rulesPath, 'utf-8'));
        } catch (e) {
          console.error(`Failed to parse rules file: ${(e as Error).message}`);
          process.exit(1);
        }
      }

      if (opts.require) {
        const requiredKeys = opts.require.split(',').map((k) => k.trim());
        for (const key of requiredKeys) {
          if (!rules.find((r) => r.key === key)) {
            rules.push({ key, required: true });
          } else {
            const existing = rules.find((r) => r.key === key)!;
            existing.required = true;
          }
        }
      }

      const allowList = Array.isArray(opts.allow) ? opts.allow : [opts.allow];
      for (const entry of allowList) {
        const eqIdx = entry.indexOf('=');
        if (eqIdx === -1) continue;
        const key = entry.slice(0, eqIdx).trim();
        const values = entry.slice(eqIdx + 1).split(',').map((v) => v.trim());
        const existing = rules.find((r) => r.key === key);
        if (existing) {
          existing.allowedValues = values;
        } else {
          rules.push({ key, allowedValues: values });
        }
      }

      if (rules.length === 0) {
        console.warn('No validation rules provided. Nothing to validate.');
        return;
      }

      const report = validateEnvMap(snapshot.env, rules);
      console.log(formatValidationReport(report));
      if (!report.valid) process.exit(1);
    });
}
