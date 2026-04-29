import { Command } from 'commander';
import { registerSortCommand } from './sort-command';
import * as storage from './storage';
import { Snapshot } from './storage';

function makeSnapshot(name: string, keys: string[], createdAt: string): Snapshot {
  const env: Record<string, string> = {};
  keys.forEach(k => (env[k] = 'val'));
  return { name, env, createdAt, updatedAt: createdAt } as Snapshot;
}

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerSortCommand(program);
  return program;
}

const snapshots = [
  makeSnapshot('zebra', ['A', 'B'], '2024-03-01T00:00:00Z'),
  makeSnapshot('apple', ['X'], '2024-01-01T00:00:00Z'),
  makeSnapshot('mango', ['P', 'Q', 'R'], '2024-02-01T00:00:00Z'),
];

describe('sort command', () => {
  let loadMock: jest.SpyInstance;
  let saveMock: jest.SpyInstance;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    loadMock = jest.spyOn(storage, 'loadSnapshots').mockResolvedValue(snapshots);
    saveMock = jest.spyOn(storage, 'saveSnapshots').mockResolvedValue(undefined);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('lists snapshots sorted by name asc by default', async () => {
    await makeProgram().parseAsync(['sort'], { from: 'user' });
    const output = consoleSpy.mock.calls.flat().join('\n');
    expect(output).toContain('apple');
    expect(output.indexOf('apple')).toBeLessThan(output.indexOf('mango'));
    expect(output.indexOf('mango')).toBeLessThan(output.indexOf('zebra'));
  });

  it('sorts by keyCount desc', async () => {
    await makeProgram().parseAsync(['sort', '--by', 'keyCount', '--order', 'desc'], { from: 'user' });
    const output = consoleSpy.mock.calls.flat().join('\n');
    expect(output.indexOf('mango')).toBeLessThan(output.indexOf('zebra'));
    expect(output.indexOf('zebra')).toBeLessThan(output.indexOf('apple'));
  });

  it('does not call saveSnapshots without --reorder', async () => {
    await makeProgram().parseAsync(['sort'], { from: 'user' });
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('calls saveSnapshots with --reorder', async () => {
    await makeProgram().parseAsync(['sort', '--reorder'], { from: 'user' });
    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  it('prints message when no snapshots exist', async () => {
    loadMock.mockResolvedValue([]);
    await makeProgram().parseAsync(['sort'], { from: 'user' });
    const output = consoleSpy.mock.calls.flat().join('\n');
    expect(output).toContain('No snapshots found');
  });
});
