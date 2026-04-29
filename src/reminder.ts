import { Snapshot } from './storage';

export interface ReminderRule {
  id: string;
  snapshotName: string;
  message: string;
  intervalDays: number;
  lastTriggered?: string; // ISO date
  enabled: boolean;
}

export interface ReminderCheckResult {
  rule: ReminderRule;
  isDue: boolean;
  daysSinceLast: number | null;
  daysUntilNext: number | null;
}

export function createReminder(
  snapshotName: string,
  message: string,
  intervalDays: number
): ReminderRule {
  if (intervalDays <= 0) {
    throw new Error(`intervalDays must be a positive number, got ${intervalDays}`);
  }
  return {
    id: `${snapshotName}-${Date.now()}`,
    snapshotName,
    message,
    intervalDays,
    enabled: true,
  };
}

export function checkReminder(
  rule: ReminderRule,
  now: Date = new Date()
): ReminderCheckResult {
  if (!rule.lastTriggered) {
    return { rule, isDue: true, daysSinceLast: null, daysUntilNext: 0 };
  }
  const last = new Date(rule.lastTriggered);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysSinceLast = Math.floor((now.getTime() - last.getTime()) / msPerDay);
  const daysUntilNext = Math.max(0, rule.intervalDays - daysSinceLast);
  const isDue = rule.enabled && daysSinceLast >= rule.intervalDays;
  return { rule, isDue, daysSinceLast, daysUntilNext };
}

export function markTriggered(rule: ReminderRule, now: Date = new Date()): ReminderRule {
  return { ...rule, lastTriggered: now.toISOString() };
}

export function filterDueReminders(
  rules: ReminderRule[],
  now: Date = new Date()
): ReminderCheckResult[] {
  return rules
    .map((r) => checkReminder(r, now))
    .filter((r) => r.isDue);
}

export function formatReminderList(rules: ReminderRule[], now: Date = new Date()): string {
  if (rules.length === 0) return 'No reminders configured.';
  return rules
    .map((rule) => {
      const { isDue, daysSinceLast, daysUntilNext } = checkReminder(rule, now);
      const status = !rule.enabled ? '[disabled]' : isDue ? '[DUE]' : `[in ${daysUntilNext}d]`;
      const last = daysSinceLast === null ? 'never' : `${daysSinceLast}d ago`;
      return `${status} ${rule.snapshotName}: "${rule.message}" (every ${rule.intervalDays}d, last: ${last})`;
    })
    .join('\n');
}
