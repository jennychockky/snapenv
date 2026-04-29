import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  ReminderRule,
  createReminder,
  filterDueReminders,
  formatReminderList,
  markTriggered,
} from './reminder';

const REMINDER_FILE = path.join(os.homedir(), '.snapenv', 'reminders.json');

export function loadReminders(): ReminderRule[] {
  if (!fs.existsSync(REMINDER_FILE)) return [];
  return JSON.parse(fs.readFileSync(REMINDER_FILE, 'utf-8'));
}

export function saveReminders(rules: ReminderRule[]): void {
  fs.mkdirSync(path.dirname(REMINDER_FILE), { recursive: true });
  fs.writeFileSync(REMINDER_FILE, JSON.stringify(rules, null, 2));
}

export function registerReminderCommands(program: Command): void {
  const reminder = program.command('reminder').description('Manage snapshot review reminders');

  reminder
    .command('add <snapshot> <message>')
    .option('-d, --days <n>', 'reminder interval in days', '7')
    .description('Add a reminder for a snapshot')
    .action((snapshot: string, message: string, opts: { days: string }) => {
      const rules = loadReminders();
      const rule = createReminder(snapshot, message, parseInt(opts.days, 10));
      rules.push(rule);
      saveReminders(rules);
      console.log(`Reminder added for "${snapshot}" every ${opts.days} day(s).`);
    });

  reminder
    .command('remove <id>')
    .description('Remove a reminder by id')
    .action((id: string) => {
      const rules = loadReminders().filter((r) => r.id !== id);
      saveReminders(rules);
      console.log(`Reminder ${id} removed.`);
    });

  reminder
    .command('list')
    .description('List all reminders with status')
    .action(() => {
      const rules = loadReminders();
      console.log(formatReminderList(rules));
    });

  reminder
    .command('check')
    .description('Show reminders that are currently due')
    .action(() => {
      const rules = loadReminders();
      const due = filterDueReminders(rules);
      if (due.length === 0) {
        console.log('No reminders are due.');
        return;
      }
      due.forEach(({ rule }) => {
        console.log(`[DUE] ${rule.snapshotName}: ${rule.message}`);
        const updated = markTriggered(rule);
        const all = loadReminders().map((r) => (r.id === updated.id ? updated : r));
        saveReminders(all);
      });
    });

  reminder
    .command('toggle <id>')
    .description('Enable or disable a reminder')
    .action((id: string) => {
      const rules = loadReminders().map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      );
      saveReminders(rules);
      const rule = rules.find((r) => r.id === id);
      console.log(`Reminder ${id} is now ${rule?.enabled ? 'enabled' : 'disabled'}.`);
    });
}
