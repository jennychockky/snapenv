import { Command } from 'commander';
import { loadSnapshots, saveSnapshots } from './storage';
import { createRollbackEntry, formatRollbackResult, getLastRollbackTarget, performRollback } from './rollback';
import * as fs from 'fs';
import * as path from 'path';

const ROLLBACK_HISTORY_FILE = path.join(
  process.env.SNAPENV_DIR || path.join(process.env.HOME || '~', '.snapenv'),
  'rollback-history.json'
);

export function loadRollbackHistory() {
  if (!fs.existsSync(ROLLBACK_HISTORY_FILE)) return [];
  return JSON.parse(fs.readFileSync(ROLLBACK_HISTORY_FILE, 'utf-8'));
}

export function saveRollbackHistory(history: object[]) {
  fs.mkdirSync(path.dirname(ROLLBACK_HISTORY_FILE), { recursive: true });
  fs.writeFileSync(ROLLBACK_HISTORY_FILE, JSON.stringify(history, null, 2));
}

export function registerRollbackCommand(program: Command) {
  program
    .command('rollback [snapshot]')
    .description('Roll back to a previous snapshot (or last used if none given)')
    .option('--dry-run', 'Preview rollback without applying')
    .action(async (snapshotArg: string | undefined, opts: { dryRun?: boolean }) => {
      const snapshots = loadSnapshots();
      const history = loadRollbackHistory();

      const targetName = snapshotArg ?? getLastRollbackTarget(history);
      if (!targetName) {
        console.error('No rollback target found. Specify a snapshot name.');
        process.exit(1);
      }

      const target = snapshots.find(s => s.name === targetName);
      if (!target) {
        console.error(`Snapshot "${targetName}" not found.`);
        process.exit(1);
      }

      const current = snapshots[snapshots.length - 1];
      const result = performRollback(current, target);

      if (opts.dryRun) {
        console.log(`[dry-run] ${formatRollbackResult(result)}`);
        return;
      }

      const entry = createRollbackEntry(current?.name ?? '', target.name);
      saveRollbackHistory([...history, entry]);
      console.log(formatRollbackResult(result));
    });
}
