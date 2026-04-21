import { Command } from 'commander';
import { appendAuditEntry } from './audit-command';
import { createAuditEntry, AuditEntry } from './audit';

const AUDITABLE_COMMANDS: Record<string, AuditEntry['action']> = {
  save: 'save',
  restore: 'restore',
  delete: 'delete',
  encrypt: 'encrypt',
  decrypt: 'decrypt',
  import: 'import',
  export: 'export',
};

export function withAudit(
  program: Command,
  storageDir: string
): void {
  program.hook('preAction', (thisCommand, actionCommand) => {
    const cmdName = actionCommand.name();
    const action = AUDITABLE_COMMANDS[cmdName];
    if (!action) return;

    const args = actionCommand.args;
    const snapshotName = args[0] ?? 'unknown';
    const details = args.slice(1).join(' ') || undefined;

    const entry = createAuditEntry(action, snapshotName, details);
    try {
      appendAuditEntry(storageDir, entry);
    } catch {
      // non-fatal: audit logging should not block the main command
    }
  });
}

export function auditAction(
  storageDir: string,
  action: AuditEntry['action'],
  snapshotName: string,
  details?: string
): void {
  const entry = createAuditEntry(action, snapshotName, details);
  try {
    appendAuditEntry(storageDir, entry);
  } catch {
    // ignore
  }
}
