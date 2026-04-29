import { Command } from 'commander';
import { registerDuplicateCommand } from './snapshot-duplicate-command';
import * as storage from './storage';
import * as dup from './snapshot-duplicate';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerDuplicateCommand(program);
  return program;
}

const baseSnap = (name: string, env: Record<string, string>) => ({
  name,
  env,
  createdAt: new Date().toISOString(),
});

beforeEach(() => jest.restoreAllMocks());

test('prints no snapshots message when store is empty', async () => {
  jest.spyOn(storage, 'loadSnapshots').mockResolvedValue({});
  const log = jest.spyOn(console, 'log').mockImplementation(() => {});
  await makeProgram().parseAsync(['duplicates'], { from: 'user' });
  expect(log).toHaveBeenCalledWith('No snapshots found.');
});

test('prints no duplicates message when all snapshots are unique', async () => {
  jest.spyOn(storage, 'loadSnapshots').mockResolvedValue({
    a: baseSnap('a', { FOO: '1' }),
    b: baseSnap('b', { BAR: '2' }),
  });
  jest.spyOn(dup, 'findDuplicates').mockReturnValue([]);
  const log = jest.spyOn(console, 'log').mockImplementation(() => {});
  await makeProgram().parseAsync(['duplicates'], { from: 'user' });
  expect(log).toHaveBeenCalledWith('No duplicate snapshots found.');
});

test('prints formatted duplicates when found', async () => {
  jest.spyOn(storage, 'loadSnapshots').mockResolvedValue({
    a: baseSnap('a', { FOO: '1' }),
    b: baseSnap('b', { FOO: '1' }),
  });
  const groups = [{ fingerprint: 'abc123', snapshots: [baseSnap('a', { FOO: '1' }), baseSnap('b', { FOO: '1' })] }];
  jest.spyOn(dup, 'findDuplicates').mockReturnValue(groups);
  jest.spyOn(dup, 'formatDuplicates').mockReturnValue('Duplicate group: a, b');
  const log = jest.spyOn(console, 'log').mockImplementation(() => {});
  await makeProgram().parseAsync(['duplicates'], { from: 'user' });
  expect(log).toHaveBeenCalledWith('Duplicate group: a, b');
});

test('outputs JSON when --json flag is passed', async () => {
  jest.spyOn(storage, 'loadSnapshots').mockResolvedValue({
    a: baseSnap('a', { FOO: '1' }),
    b: baseSnap('b', { FOO: '1' }),
  });
  const groups = [{ fingerprint: 'abc123', snapshots: [baseSnap('a', { FOO: '1' }), baseSnap('b', { FOO: '1' })] }];
  jest.spyOn(dup, 'findDuplicates').mockReturnValue(groups);
  const log = jest.spyOn(console, 'log').mockImplementation(() => {});
  await makeProgram().parseAsync(['duplicates', '--json'], { from: 'user' });
  expect(log).toHaveBeenCalledWith(JSON.stringify(groups, null, 2));
});

test('exits with error for invalid --min-count', async () => {
  jest.spyOn(storage, 'loadSnapshots').mockResolvedValue({
    a: baseSnap('a', { FOO: '1' }),
  });
  const err = jest.spyOn(console, 'error').mockImplementation(() => {});
  const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  await expect(
    makeProgram().parseAsync(['duplicates', '--min-count', '1'], { from: 'user' })
  ).rejects.toThrow('exit');
  expect(err).toHaveBeenCalledWith('--min-count must be an integer >= 2');
  exit.mockRestore();
});
