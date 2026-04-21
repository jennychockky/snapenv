import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerLockCommands, getLockPath, loadLocks, saveLocks } from './lock-command';
import { saveSnapshots } from './storage';

function makeTmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'snapenv-lock-cmd-'));
}

function makeProgram(storageDir: string): Command {
  const program = new Command();
  program.exitOverride();
  registerLockCommands(program, storageDir);
  return program;
}

describe('registerLockCommands', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = makeTmp();
    saveSnapshots(tmp, [
      { name: 'dev', vars: { NODE_ENV: 'development' }, createdAt: new Date().toISOString() },
      { name: 'prod', vars: { NODE_ENV: 'production' }, createdAt: new Date().toISOString() },
    ]);
  });

  afterEach(() => fs.rmSync(tmp, { recursive: true }));

  it('lock add creates a lock entry', () => {
    const program = makeProgram(tmp);
    program.parse(['lock', 'add', 'dev'], { from: 'user' });
    const locks = loadLocks(tmp);
    expect(locks['dev']).toBe(true);
  });

  it('lock remove removes a lock entry', () => {
    saveLocks(tmp, { dev: true });
    const program = makeProgram(tmp);
    program.parse(['lock', 'remove', 'dev'], { from: 'user' });
    const locks = loadLocks(tmp);
    expect(locks['dev']).toBeUndefined();
  });

  it('lock status prints locked', () => {
    saveLocks(tmp, { dev: true });
    const program = makeProgram(tmp);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['lock', 'status', 'dev'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('locked'));
    spy.mockRestore();
  });

  it('lock list shows locked snapshots', () => {
    saveLocks(tmp, { prod: true });
    const program = makeProgram(tmp);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['lock', 'list'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('prod'));
    spy.mockRestore();
  });

  it('loadLocks returns empty object when file missing', () => {
    const locks = loadLocks(tmp);
    expect(locks).toEqual({});
  });

  it('getLockPath returns correct path', () => {
    expect(getLockPath('/some/dir')).toBe('/some/dir/locks.json');
  });
});
