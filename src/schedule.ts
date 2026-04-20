import { Snapshot } from './storage';

export interface ScheduleEntry {
  snapshotName: string;
  cron: string;
  action: 'apply' | 'capture';
  lastRun?: string;
  enabled: boolean;
}

export type ScheduleMap = Record<string, ScheduleEntry>;

export function addSchedule(
  schedules: ScheduleMap,
  name: string,
  entry: Omit<ScheduleEntry, 'enabled'>
): ScheduleMap {
  return {
    ...schedules,
    [name]: { ...entry, enabled: true },
  };
}

export function removeSchedule(schedules: ScheduleMap, name: string): ScheduleMap {
  const updated = { ...schedules };
  delete updated[name];
  return updated;
}

export function enableSchedule(schedules: ScheduleMap, name: string): ScheduleMap {
  if (!schedules[name]) throw new Error(`Schedule '${name}' not found`);
  return { ...schedules, [name]: { ...schedules[name], enabled: true } };
}

export function disableSchedule(schedules: ScheduleMap, name: string): ScheduleMap {
  if (!schedules[name]) throw new Error(`Schedule '${name}' not found`);
  return { ...schedules, [name]: { ...schedules[name], enabled: false } };
}

export function listSchedules(schedules: ScheduleMap): ScheduleEntry[] {
  return Object.values(schedules);
}

export function formatSchedule(entry: ScheduleEntry): string {
  const status = entry.enabled ? 'enabled' : 'disabled';
  const last = entry.lastRun ? `last run: ${entry.lastRun}` : 'never run';
  return `[${status}] ${entry.snapshotName} — ${entry.action} @ ${entry.cron} (${last})`;
}

export function isDueCron(cron: string, now: Date = new Date()): boolean {
  // Minimal cron check: supports "* * * * *" style, matches current minute
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  const [min, hour, dom, month, dow] = parts;
  const match = (field: string, value: number) =>
    field === '*' || parseInt(field, 10) === value;
  return (
    match(min, now.getMinutes()) &&
    match(hour, now.getHours()) &&
    match(dom, now.getDate()) &&
    match(month, now.getMonth() + 1) &&
    match(dow, now.getDay())
  );
}
