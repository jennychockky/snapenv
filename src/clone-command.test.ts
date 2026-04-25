import { Command } from 'commander';
import { registerCloneCommand } from './clone-command';
import * as storage from './storage';
import * as copy from './copy';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerCloneCommand(program);
  return program;
}

const baseSnapshots = {
  dev: { NODE_ENV: 'development', PORT: '3000' },
  'prod': { NODE_ENV: 'production', PORT: '8080' },
  'staging:app': { NODE_ENV: 'staging', PORT: '4000' },
};

beforeEach(() => {
  jest.spyOn(storage, 'loadSnapshots').mockResolvedValue({ ...baseSnapshots } as any);
  jest.spyOn(storage, 'saveSnapshots').mockResolvedValue(undefined);
  jest.spyOn(copy, 'cloneSnapshot').mockImplementation((snaps, src, dest) => ({
    ...snaps,
    [dest]: { ...snaps[src] },
  }));
});

afterEach(() => jest.restoreAllMocks());

describe('clone command', () => {
  it('clones an existing snapshot to a new name', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'cli', 'clone', 'dev', 'dev-backup']);
    expect(copy.cloneSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ dev: baseSnapshots.dev }),
      'dev',
      'dev-backup'
    );
    expect(storage.saveSnapshots).toHaveBeenCalled();
  });

  it('applies namespace prefix to destination', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'cli', 'clone', 'dev', 'copy', '--namespace', 'test']);
    expect(copy.cloneSnapshot).toHaveBeenCalledWith(
      expect.anything(),
      'dev',
      'test:copy'
    );
  });

  it('errors if source snapshot does not exist', async () => {
    const program = makeProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(program.parseAsync(['node', 'cli', 'clone', 'missing', 'dest'])).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('errors if destination exists without --overwrite', async () => {
    const program = makeProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(program.parseAsync(['node', 'cli', 'clone', 'dev', 'prod'])).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('allows overwrite with --overwrite flag', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'cli', 'clone', 'dev', 'prod', '--overwrite']);
    expect(copy.cloneSnapshot).toHaveBeenCalledWith(expect.anything(), 'dev', 'prod');
    expect(storage.saveSnapshots).toHaveBeenCalled();
  });
});

describe('clone-all command', () => {
  it('clones all snapshots matching prefix', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'cli', 'clone-all', 'staging:', 'backup:']);
    expect(copy.cloneSnapshot).toHaveBeenCalledWith(
      expect.anything(),
      'staging:app',
      'backup:app'
    );
  });

  it('warns when no snapshots match prefix', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(['node', 'cli', 'clone-all', 'nope:', 'dest:']);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('No snapshots found'));
    expect(storage.saveSnapshots).not.toHaveBeenCalled();
  });
});
