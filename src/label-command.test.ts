import { Command } from 'commander';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { registerLabelCommands, loadLabels, getLabelPath } from './label-command';

function makeTmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'snapenv-label-'));
}

function makeProgram(dir: string): Command {
  const program = new Command();
  program.exitOverride();
  registerLabelCommands(program, dir);
  return program;
}

describe('label set', () => {
  it('writes label to store', () => {
    const dir = makeTmp();
    const program = makeProgram(dir);
    program.parse(['label', 'set', 'snap1', 'env', 'dev'], { from: 'user' });
    const store = loadLabels(dir);
    expect(store['snap1']).toEqual([{ key: 'env', value: 'dev' }]);
  });

  it('updates existing label', () => {
    const dir = makeTmp();
    const program = makeProgram(dir);
    program.parse(['label', 'set', 'snap1', 'env', 'dev'], { from: 'user' });
    program.parse(['label', 'set', 'snap1', 'env', 'prod'], { from: 'user' });
    const store = loadLabels(dir);
    expect(store['snap1'][0].value).toBe('prod');
  });
});

describe('label remove', () => {
  it('removes a label', () => {
    const dir = makeTmp();
    const program = makeProgram(dir);
    program.parse(['label', 'set', 'snap1', 'env', 'dev'], { from: 'user' });
    program.parse(['label', 'remove', 'snap1', 'env'], { from: 'user' });
    const store = loadLabels(dir);
    expect(store['snap1']).toHaveLength(0);
  });
});

describe('label list', () => {
  it('prints labels', () => {
    const dir = makeTmp();
    const program = makeProgram(dir);
    program.parse(['label', 'set', 'snap1', 'team', 'backend'], { from: 'user' });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['label', 'list', 'snap1'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('team=backend'));
    spy.mockRestore();
  });
});

describe('label find', () => {
  it('finds snapshots by key', () => {
    const dir = makeTmp();
    const program = makeProgram(dir);
    program.parse(['label', 'set', 'snap1', 'env', 'dev'], { from: 'user' });
    program.parse(['label', 'set', 'snap2', 'env', 'prod'], { from: 'user' });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['label', 'find', 'env'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith('snap1');
    expect(spy).toHaveBeenCalledWith('snap2');
    spy.mockRestore();
  });

  it('filters by value', () => {
    const dir = makeTmp();
    const program = makeProgram(dir);
    program.parse(['label', 'set', 'snap1', 'env', 'dev'], { from: 'user' });
    program.parse(['label', 'set', 'snap2', 'env', 'prod'], { from: 'user' });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['label', 'find', 'env', 'prod'], { from: 'user' });
    const calls = spy.mock.calls.map((c) => c[0]);
    expect(calls).toContain('snap2');
    expect(calls).not.toContain('snap1');
    spy.mockRestore();
  });
});
