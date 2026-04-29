import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import {
  AccessLog,
  createAccessEntry,
  filterAccessLog,
  mostAccessedSnapshots,
  formatAccessLog,
  recordAccess,
} from './snapshot-access';

export function getAccessPath(dir: string): string {
  return path.join(dir, 'access-log.json');
}

export function loadAccessLog(dir: string): AccessLog {
  const p = getAccessPath(dir);
  if (!fs.existsSync(p)) return { entries: [] };
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as AccessLog;
}

export function saveAccessLog(dir: string, log: AccessLog): void {
  fs.writeFileSync(getAccessPath(dir), JSON.stringify(log, null, 2));
}

export function appendAccessEntry(
  dir: string,
  snapshotName: string,
  action: 'read' | 'write' | 'delete',
  source?: string
): void {
  const log = loadAccessLog(dir);
  const entry = createAccessEntry(snapshotName, action, source);
  saveAccessLog(dir, recordAccess(log, entry));
}

export function registerAccessCommands(program: Command, storageDir: string): void {
  const access = program.command('access').description('Snapshot access log commands');

  access
    .command('log')
    .description('Show access log')
    .option('-n, --name <name>', 'Filter by snapshot name')
    .option('-a, --action <action>', 'Filter by action (read|write|delete)')
    .option('--since <date>', 'Show entries since date')
    .action((opts) => {
      const log = loadAccessLog(storageDir);
      const since = opts.since ? new Date(opts.since) : undefined;
      const entries = filterAccessLog(log, {
        snapshotName: opts.name,
        action: opts.action,
        since,
      });
      console.log(formatAccessLog(entries));
    });

  access
    .command('top')
    .description('Show most accessed snapshots')
    .option('-l, --limit <n>', 'Number of results', '5')
    .action((opts) => {
      const log = loadAccessLog(storageDir);
      const results = mostAccessedSnapshots(log, parseInt(opts.limit, 10));
      if (results.length === 0) {
        console.log('No access data available.');
        return;
      }
      results.forEach((r) => console.log(`${r.name}: ${r.count} access(es)`));
    });
}
