import { Command } from 'commander';
import { registerMergeCommand } from './merge-command';
import * as storage from './storage';

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerMergeCommand(program);
  return program;
}

describe('merge command', () => {
  const baseSnap = { name: 'base', env: { FOO: 'foo', SHARED: 'from-base' }, createdAt: '2024-01-01' };
  const sourceSnap = { name: 'source', env: { BAR: 'bar', SHARED: 'from-source' }, createdAt: '2024-01-02' };

  beforeEach(() => {
    jest.spyOn(storage, 'loadSnapshots').mockReturnValue([baseSnap, sourceSnap] as any);
    jest.spyOn(storage, 'saveSnapshots').mockImplementation(() => {});
    jest.spyOn(storage, 'getSnapshot').mockImplementation((snaps: any[], name: string) =>
      snaps.find((s: any) => s.name === name)
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it('merges two snapshots preferring source by default', async () => {
    const program = makeProgram();
    await program.parseAsync(['merge', 'base', 'source', 'merged'], { from: 'user' });

    const saved = (storage.saveSnapshots as jest.Mock).mock.calls[0][0];
    const merged = saved.find((s: any) => s.name === 'merged');
    expect(merged).toBeDefined();
    expect(merged.env.FOO).toBe('foo');
    expect(merged.env.BAR).toBe('bar');
    expect(merged.env.SHARED).toBe('from-source');
  });

  it('merges preferring base when --prefer base is set', async () => {
    const program = makeProgram();
    await program.parseAsync(['merge', 'base', 'source', 'merged', '--prefer', 'base'], { from: 'user' });

    const saved = (storage.saveSnapshots as jest.Mock).mock.calls[0][0];
    const merged = saved.find((s: any) => s.name === 'merged');
    expect(merged.env.SHARED).toBe('from-base');
  });

  it('exits if base snapshot not found', async () => {
    (storage.getSnapshot as jest.Mock).mockReturnValue(undefined);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = makeProgram();
    await expect(program.parseAsync(['merge', 'missing', 'source', 'merged'], { from: 'user' })).rejects.toThrow();
    exitSpy.mockRestore();
  });

  it('exits if target snapshot already exists', async () => {
    (storage.getSnapshot as jest.Mock).mockImplementation((snaps: any[], name: string) =>
      snaps.find((s: any) => s.name === name) ?? (name === 'merged' ? { name: 'merged' } : undefined)
    );
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = makeProgram();
    await expect(program.parseAsync(['merge', 'base', 'source', 'merged'], { from: 'user' })).rejects.toThrow();
    exitSpy.mockRestore();
  });
});
