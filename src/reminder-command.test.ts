import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerReminderCommands, loadReminders, saveReminders } from './reminder-command';
import { createReminder, markTriggered } from './reminder';

function makeTmp() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'snapenv-reminder-'));
  const file = path.join(dir, 'reminders.json');
  jest.spyOn(path, 'join').mockImplementation((...args) => {
    if (args.includes('reminders.json')) return file;
    return jest.requireActual('path').join(...args);
  });
  return { dir, file };
}

function makeProgram() {
  const prog = new Command();
  prog.exitOverride();
  registerReminderCommands(prog);
  return prog;
}

describe('reminder-command', () => {
  let tmp: { dir: string; file: string };

  beforeEach(() => {
    jest.restoreAllMocks();
    tmp = makeTmp();
  });

  afterEach(() => {
    fs.rmSync(tmp.dir, { recursive: true, force: true });
  });

  it('loadReminders returns empty array when file missing', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    expect(loadReminders()).toEqual([]);
  });

  it('saveReminders and loadReminders round-trip', () => {
    const rules = [createReminder('dev', 'Check dev', 7)];
    saveReminders(rules);
    const loaded = loadReminders();
    expect(loaded[0].snapshotName).toBe('dev');
  });

  it('reminder add writes a new rule', () => {
    saveReminders([]);
    const prog = makeProgram();
    prog.parse(['node', 'cli', 'reminder', 'add', 'staging', 'Review staging', '--days', '3']);
    const rules = loadReminders();
    expect(rules.length).toBe(1);
    expect(rules[0].intervalDays).toBe(3);
  });

  it('reminder remove deletes rule by id', () => {
    const rule = createReminder('prod', 'Check prod', 14);
    saveReminders([rule]);
    const prog = makeProgram();
    prog.parse(['node', 'cli', 'reminder', 'remove', rule.id]);
    expect(loadReminders().length).toBe(0);
  });

  it('reminder toggle flips enabled flag', () => {
    const rule = createReminder('prod', 'Check prod', 7);
    saveReminders([rule]);
    const prog = makeProgram();
    prog.parse(['node', 'cli', 'reminder', 'toggle', rule.id]);
    expect(loadReminders()[0].enabled).toBe(false);
  });

  it('reminder check marks triggered rules', () => {
    const rule = createReminder('dev', 'Check dev', 1);
    saveReminders([rule]);
    const prog = makeProgram();
    prog.parse(['node', 'cli', 'reminder', 'check']);
    const updated = loadReminders();
    expect(updated[0].lastTriggered).toBeDefined();
  });
});
