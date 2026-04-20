import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { addSchedule, removeSchedule, enableSchedule, disableSchedule, listSchedules, formatSchedule, ScheduleMap } from './schedule';

const SCHEDULE_FILE = path.join(process.env.SNAPENV_DIR || path.join(process.env.HOME || '~', '.snapenv'), 'schedules.json');

export function loadSchedules(): ScheduleMap {
  if (!fs.existsSync(SCHEDULE_FILE)) return {};
  return JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf-8'));
}

export function saveSchedules(schedules: ScheduleMap): void {
  fs.mkdirSync(path.dirname(SCHEDULE_FILE), { recursive: true });
  fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(schedules, null, 2));
}

export function registerScheduleCommands(program: Command): void {
  const schedule = program.command('schedule').description('Manage snapshot schedules');

  schedule
    .command('add <name> <snapshot> <cron> <action>')
    .description('Add a schedule (action: apply|capture)')
    .action((name, snapshot, cron, action) => {
      if (action !== 'apply' && action !== 'capture') {
        console.error('Action must be "apply" or "capture"');
        process.exit(1);
      }
      const schedules = addSchedule(loadSchedules(), name, { snapshotName: snapshot, cron, action });
      saveSchedules(schedules);
      console.log(`Schedule '${name}' added.`);
    });

  schedule
    .command('remove <name>')
    .description('Remove a schedule')
    .action((name) => {
      const schedules = removeSchedule(loadSchedules(), name);
      saveSchedules(schedules);
      console.log(`Schedule '${name}' removed.`);
    });

  schedule
    .command('enable <name>')
    .description('Enable a schedule')
    .action((name) => {
      const schedules = enableSchedule(loadSchedules(), name);
      saveSchedules(schedules);
      console.log(`Schedule '${name}' enabled.`);
    });

  schedule
    .command('disable <name>')
    .description('Disable a schedule')
    .action((name) => {
      const schedules = disableSchedule(loadSchedules(), name);
      saveSchedules(schedules);
      console.log(`Schedule '${name}' disabled.`);
    });

  schedule
    .command('list')
    .description('List all schedules')
    .action(() => {
      const entries = listSchedules(loadSchedules());
      if (entries.length === 0) {
        console.log('No schedules defined.');
        return;
      }
      entries.forEach((e) => console.log(formatSchedule(e)));
    });
}
