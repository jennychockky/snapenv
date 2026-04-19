import { Command } from 'commander';
import { registerTagCommands } from './tag-command';
import * as tag from './tag';

beforeEach(() => {
  jest.spyOn(tag, 'addTag').mockImplementation(() => {});
  jest.spyOn(tag, 'removeTag').mockImplementation(() => {});
  jest.spyOn(tag, 'listTags').mockReturnValue(['staging', 'ci']);
  jest.spyOn(tag, 'findByTag').mockReturnValue(['dev', 'test']);
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerTagCommands(program);
  return program;
}

describe('tag add', () => {
  it('calls addTag and logs success', () => {
    makeProgram().parse(['tag', 'add', 'dev', 'ci'], { from: 'user' });
    expect(tag.addTag).toHaveBeenCalledWith('dev', 'ci');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('ci'));
  });

  it('logs error and exits on failure', () => {
    (tag.addTag as jest.Mock).mockImplementation(() => { throw new Error('not found'); });
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => makeProgram().parse(['tag', 'add', 'x', 'y'], { from: 'user' })).toThrow('exit');
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });
});

describe('tag list', () => {
  it('prints each tag', () => {
    makeProgram().parse(['tag', 'list', 'dev'], { from: 'user' });
    expect(console.log).toHaveBeenCalledWith('staging');
    expect(console.log).toHaveBeenCalledWith('ci');
  });

  it('prints no tags message when empty', () => {
    (tag.listTags as jest.Mock).mockReturnValue([]);
    makeProgram().parse(['tag', 'list', 'dev'], { from: 'user' });
    expect(console.log).toHaveBeenCalledWith('No tags.');
  });
});

describe('tag find', () => {
  it('prints matching snapshot names', () => {
    makeProgram().parse(['tag', 'find', 'ci'], { from: 'user' });
    expect(console.log).toHaveBeenCalledWith('dev');
    expect(console.log).toHaveBeenCalledWith('test');
  });
});
