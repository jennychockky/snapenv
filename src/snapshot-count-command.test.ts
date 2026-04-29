import { Command } from 'commander';
import { registerCountCommand } from './snapshot-count-command';
import * as storage from './storage';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerCountCommand(program);
  return program;
}

function makeSnapshot(name: string, createdAt: string, env: Record<string, string> = {}, tags: string[] = []) {
  return { name, createdAt, env, tags };
}

const mockSnapshots = [
  makeSnapshot('snap1', '2024-03-01T10:00:00Z', { APP_KEY: 'a', DB_URL: 'b' }, ['prod']),
  makeSnapshot('snap2', '2024-03-01T12:00:00Z', { APP_KEY: 'c' }, ['dev']),
  makeSnapshot('snap3', '2024-04-05T09:00:00Z', { DB_URL: 'd' }, ['prod']),
];

beforeEach(() => {
  jest.spyOn(storage, 'loadSnapshots').mockResolvedValue(mockSnapshots as any);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('count command', () => {
  it('groups by day by default', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(['node', 'cli', 'count']);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('groups by month', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(['node', 'cli', 'count', '--by', 'month']);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('outputs json when --json flag is set', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(['node', 'cli', 'count', '--json']);
    const output = spy.mock.calls[0][0];
    expect(() => JSON.parse(output)).not.toThrow();
    spy.mockRestore();
  });

  it('filters by tag before counting', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(['node', 'cli', 'count', '--tag', 'prod', '--json']);
    const output = JSON.parse(spy.mock.calls[0][0]);
    const total = Object.values(output).reduce((sum: number, v) => sum + (v as number), 0);
    expect(total).toBe(2);
    spy.mockRestore();
  });

  it('exits with error on invalid --by value', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = makeProgram();
    await expect(
      program.parseAsync(['node', 'cli', 'count', '--by', 'invalid'])
    ).rejects.toThrow('exit');
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid --by value'));
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
