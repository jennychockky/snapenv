import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { AuditEntry, filterAuditLog, formatAuditLog, createAuditEntry } from './audit';

export function getAuditPath(storageDir: string): string {
  return path.join(storageDir, 'audit.json');
}

export function loadAuditLog(storageDir: string): AuditEntry[] {
  const p = getAuditPath(storageDir);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as AuditEntry[];
}

export function saveAuditLog(storageDir: string, entries: AuditEntry[]): void {
  fs.writeFileSync(getAuditPath(storageDir), JSON.stringify(entries, null, 2));
}

export function appendAuditEntry(storageDir: string, entry: AuditEntry): void {
  const entries = loadAuditLog(storageDir);
  entries.push(entry);
  saveAuditLog(storageDir, entries);
}

export function registerAuditCommands(program: Command, storageDir: string): void {
  const audit = program.command('audit').description('Manage the audit log');

  audit
    .command('log')
    .description('Show the audit log')
    .option('--action <action>', 'Filter by action type')
    .option('--snapshot <name>', 'Filter by snapshot name')
    .option('--since <date>', 'Show entries since date (ISO)')
    .option('--until <date>', 'Show entries until date (ISO)')
    .action((opts) => {
      const entries = loadAuditLog(storageDir);
      const filtered = filterAuditLog(entries, {
        action: opts.action as AuditEntry['action'] | undefined,
        snapshotName: opts.snapshot,
        since: opts.since ? new Date(opts.since) : undefined,
        until: opts.until ? new Date(opts.until) : undefined,
      });
      console.log(formatAuditLog(filtered));
    });

  audit
    .command('clear')
    .description('Clear the audit log')
    .action(() => {
      saveAuditLog(storageDir, []);
      console.log('Audit log cleared.');
    });

  audit
    .command('record <action> <snapshot>')
    .description('Manually record an audit entry')
    .option('--details <text>', 'Optional details')
    .action((action, snapshot, opts) => {
      const entry = createAuditEntry(action as AuditEntry['action'], snapshot, opts.details);
      appendAuditEntry(storageDir, entry);
      console.log(`Recorded: ${action} on ${snapshot}`);
    });
}
