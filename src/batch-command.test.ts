import { Command } from 'commander';
import { registerBatchCommands } from './batch-command';
import * as storage from './storage';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerBatchCommands(program);
  return program;
}

describe('batch delete command', () => {
  it('deletes snapshots and prints result', async () => {
    const snaps = {
      alpha: { name: 'alpha', env: {}, createdAt: '' },
      beta: { name: 'beta', env: {}, createdAt: '' },
    } as any;
    jest.spyOn(storage, 'loadSnapshots').mockResolvedValue(snaps);
    const saveSpy = jest.spyOn(storage, 'saveSnapshots').mockResolvedValue(undefined);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const program = makeProgram();
    await program.parseAsync(['batch', 'delete', 'alpha', 'beta'], { from: 'user' });

    expect(saveSpy).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Succeeded'));
    logSpy.mockRestore();
  });
});

describe('batch tag command', () => {
  it('tags multiple snapshots', async () => {
    const snaps = {
      s1: { name: 's1', env: {}, createdAt: '' },
      s2: { name: 's2', env: {}, createdAt: '' },
    } as any;
    jest.spyOn(storage, 'loadSnapshots').mockResolvedValue(snaps);
    const saveSpy = jest.spyOn(storage, 'saveSnapshots').mockResolvedValue(undefined);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const program = makeProgram();
    await program.parseAsync(['batch', 'tag', 'production', 's1', 's2'], { from: 'user' });

    expect(saveSpy).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Succeeded'));
    logSpy.mockRestore();
  });
});

describe('batch list command', () => {
  it('lists snapshot names', async () => {
    const snaps = { foo: { name: 'foo' }, bar: { name: 'bar' } } as any;
    jest.spyOn(storage, 'loadSnapshots').mockResolvedValue(snaps);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const program = makeProgram();
    await program.parseAsync(['batch', 'list'], { from: 'user' });

    expect(logSpy).toHaveBeenCalledWith('foo');
    expect(logSpy).toHaveBeenCalledWith('bar');
    logSpy.mockRestore();
  });

  it('outputs JSON when --json flag is set', async () => {
    const snaps = { mysnap: { name: 'mysnap' } } as any;
    jest.spyOn(storage, 'loadSnapshots').mockResolvedValue(snaps);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const program = makeProgram();
    await program.parseAsync(['batch', 'list', '--json'], { from: 'user' });

    const call = logSpy.mock.calls[0][0];
    expect(JSON.parse(call)).toContain('mysnap');
    logSpy.mockRestore();
  });
});
