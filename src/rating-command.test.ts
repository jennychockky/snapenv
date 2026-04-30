import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerRatingCommands } from './rating-command';

function makeTmp() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'snapenv-rating-'));
  process.env.SNAPENV_DIR = dir;
  return dir;
}

function makeProgram(dir: string) {
  process.env.SNAPENV_DIR = dir;
  const program = new Command();
  program.exitOverride();
  registerRatingCommands(program);
  return program;
}

describe('rating-command', () => {
  let dir: string;

  beforeEach(() => { dir = makeTmp(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('sets a rating', () => {
    const program = makeProgram(dir);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['node', 'snapenv', 'rating', 'set', 'my-snap', '4']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('4/5'));
    spy.mockRestore();
  });

  it('sets a rating with a note', () => {
    const program = makeProgram(dir);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['node', 'snapenv', 'rating', 'set', 'my-snap', '5', '--note', 'excellent']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('5/5'));
    spy.mockRestore();
  });

  it('gets a rating', () => {
    const program = makeProgram(dir);
    program.parse(['node', 'snapenv', 'rating', 'set', 'my-snap', '3']);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['node', 'snapenv', 'rating', 'get', 'my-snap']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('★★★'));
    spy.mockRestore();
  });

  it('removes a rating', () => {
    const program = makeProgram(dir);
    program.parse(['node', 'snapenv', 'rating', 'set', 'my-snap', '3']);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['node', 'snapenv', 'rating', 'remove', 'my-snap']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('removed'));
    spy.mockRestore();
  });

  it('lists ratings with min filter', () => {
    const program = makeProgram(dir);
    program.parse(['node', 'snapenv', 'rating', 'set', 'snap-a', '2']);
    program.parse(['node', 'snapenv', 'rating', 'set', 'snap-b', '5']);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['node', 'snapenv', 'rating', 'list', '--min', '4']);
    const output: string = spy.mock.calls[0][0];
    expect(output).toContain('snap-b');
    expect(output).not.toContain('snap-a');
    spy.mockRestore();
  });
});
