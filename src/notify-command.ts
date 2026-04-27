import type { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { createNotifyRule, NotifyRule, NotifyEvent } from './notify';

const NOTIFY_FILE = path.join(
  process.env.SNAPENV_DIR ?? path.join(process.env.HOME ?? '.', '.snapenv'),
  'notify.json'
);

export function getNotifyPath(): string {
  return NOTIFY_FILE;
}

export function loadNotifyRules(filePath = NOTIFY_FILE): NotifyRule[] {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as NotifyRule[];
}

export function saveNotifyRules(rules: NotifyRule[], filePath = NOTIFY_FILE): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(rules, null, 2), 'utf8');
}

export function registerNotifyCommands(program: Command): void {
  const notify = program.command('notify').description('Manage event notification rules');

  notify
    .command('add <event> <channel>')
    .description('Add a notification rule (channel: console|file)')
    .option('-d, --destination <path>', 'Destination file path (for file channel)')
    .action((event: string, channel: string, opts: { destination?: string }) => {
      const validEvents: NotifyEvent[] = [
        'snapshot:created',
        'snapshot:restored',
        'snapshot:deleted',
        'snapshot:expired',
        'snapshot:locked',
        'snapshot:unlocked',
      ];
      if (!validEvents.includes(event as NotifyEvent)) {
        console.error(`Unknown event: ${event}. Valid: ${validEvents.join(', ')}`);
        process.exit(1);
      }
      if (channel !== 'console' && channel !== 'file') {
        console.error('Channel must be console or file');
        process.exit(1);
      }
      const rules = loadNotifyRules();
      const rule = createNotifyRule(event as NotifyEvent, channel, opts.destination);
      rules.push(rule);
      saveNotifyRules(rules);
      console.log(`Notification rule added (id: ${rule.id})`);
    });

  notify
    .command('remove <id>')
    .description('Remove a notification rule by id')
    .action((id: string) => {
      const rules = loadNotifyRules();
      const filtered = rules.filter((r) => r.id !== id);
      if (filtered.length === rules.length) {
        console.error(`Rule not found: ${id}`);
        process.exit(1);
      }
      saveNotifyRules(filtered);
      console.log(`Rule ${id} removed.`);
    });

  notify
    .command('list')
    .description('List all notification rules')
    .action(() => {
      const rules = loadNotifyRules();
      if (rules.length === 0) {
        console.log('No notification rules configured.');
        return;
      }
      rules.forEach((r) => {
        const dest = r.destination ? ` -> ${r.destination}` : '';
        const status = r.enabled ? 'enabled' : 'disabled';
        console.log(`[${r.id}] ${r.event} | ${r.channel}${dest} (${status})`);
      });
    });

  notify
    .command('toggle <id>')
    .description('Enable or disable a notification rule')
    .action((id: string) => {
      const rules = loadNotifyRules();
      const rule = rules.find((r) => r.id === id);
      if (!rule) {
        console.error(`Rule not found: ${id}`);
        process.exit(1);
      }
      rule.enabled = !rule.enabled;
      saveNotifyRules(rules);
      console.log(`Rule ${id} is now ${rule.enabled ? 'enabled' : 'disabled'}.`);
    });
}
