import { Command } from 'commander';
import { registerCompareCommand } from './compare-command';
import * as storage from './storage';

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerCompareCommand(program);
  return program;
}

const snapA = { name: 'snap-a', env: { FOO: '1', SHARED: 'old' }, createdAt: '' };
const snapB = { name: 'snap-b', env: { BAR: '2', SHARED: 'new' }, createdAt: '' };

describe('compare command', () => {
  let loadMock: jest.SpyInstance;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    loadMock = jest.spyOn(storage, 'loadSnapshots').mockResolvedValue({
      'snap-a': snapA,
      'snap-b': snapB,
    });
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('prints formatted comparison', async () => {
    const program = makeProgram();
    await program.parseAsync(['compare', 'snap-a', 'snap-b'], { from: 'user' });
    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('snap-a');
    expect(output).toContain('snap-b');
  });

  it('outputs JSON when --json flag is set', async () => {
    const program = makeProgram();
    await program.parseAsync(['compare', 'snap-a', 'snap-b', '--json'], { from: 'user' });
    const output = logSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('changed');
    expect(parsed).toHaveProperty('onlyInA');
    expect(parsed).toHaveProperty('onlyInB');
  });

  it('exits with error when snapshot not found', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = makeProgram();
    await expect(
      program.parseAsync(['compare', 'missing', 'snap-b'], { from: 'user' })
    ).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('missing'));
    exitSpy.mockRestore();
  });

  it('omits unchanged keys with --only-changed and --json', async () => {
    const program = makeProgram();
    await program.parseAsync(['compare', 'snap-a', 'snap-b', '--json', '--only-changed'], { from: 'user' });
    const output = logSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed).not.toHaveProperty('unchanged');
  });
});
