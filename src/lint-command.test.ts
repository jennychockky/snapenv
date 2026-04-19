import { Command } from 'commander';
import { registerLintCommand } from './lint-command';
import * as storage from './storage';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerLintCommand(program);
  return program;
}

describe('lint command', () => {
  beforeEach(() => jest.restoreAllMocks());

  it('prints no issues for clean snapshot', () => {
    jest.spyOn(storage, 'loadSnapshots').mockReturnValue({
      clean: { name: 'clean', env: { API_KEY: 'abc', BASE_URL: 'https://x.com' }, createdAt: '' },
    });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    makeProgram().parse(['node', 'snapenv', 'lint', 'clean']);
    expect(spy).toHaveBeenCalledWith('No lint issues found.');
  });

  it('outputs JSON when --json flag is passed', () => {
    jest.spyOn(storage, 'loadSnapshots').mockReturnValue({
      s1: { name: 's1', env: { bad_key: '' }, createdAt: '' },
    });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    try {
      makeProgram().parse(['node', 'snapenv', 'lint', 's1', '--json']);
    } catch {}
    const output = JSON.parse(spy.mock.calls[0][0]);
    expect(Array.isArray(output)).toBe(true);
    expect(output.length).toBeGreaterThan(0);
  });

  it('errors when snapshot not found', () => {
    jest.spyOn(storage, 'loadSnapshots').mockReturnValue({});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() =>
      makeProgram().parse(['node', 'snapenv', 'lint', 'missing'])
    ).toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
