import { Command } from 'commander';
import { registerSizeCommand } from './size-command';
import * as storage from './storage';
import { Snapshot } from './storage';

function makeSnapshot(name: string, env: Record<string, string>): Snapshot {
  return { name, env, createdAt: new Date().toISOString() };
}

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerSizeCommand(program);
  return program;
}

beforeEach(() => {
  jest.spyOn(storage, 'loadSnapshots').mockResolvedValue([
    makeSnapshot('alpha', { FOO: 'bar', BAZ: 'qux' }),
    makeSnapshot('beta', { LONG_KEY: 'a'.repeat(100) }),
  ]);
});

afterEach(() => jest.restoreAllMocks());

describe('size show', () => {
  it('prints size info for a known snapshot', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await makeProgram().parseAsync(['node', 'cli', 'size', 'show', 'alpha']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('alpha'));
  });

  it('exits with error for unknown snapshot', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(makeProgram().parseAsync(['node', 'cli', 'size', 'show', 'missing'])).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe('size all', () => {
  it('lists all snapshots sorted by bytes by default', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await makeProgram().parseAsync(['node', 'cli', 'size', 'all']);
    expect(spy).toHaveBeenCalledTimes(2);
    const first = spy.mock.calls[0][0] as string;
    expect(first).toContain('beta');
  });

  it('sorts by name when --sort name is passed', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await makeProgram().parseAsync(['node', 'cli', 'size', 'all', '--sort', 'name']);
    expect((spy.mock.calls[0][0] as string)).toContain('alpha');
  });
});

describe('size summary', () => {
  it('prints aggregate summary', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await makeProgram().parseAsync(['node', 'cli', 'size', 'summary']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Snapshots'));
  });
});
