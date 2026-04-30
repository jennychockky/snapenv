import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerNoteCommands, loadNotes, saveNotes } from './note-command';
import { setNote } from './snapshot-note';

function makeTmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'snapenv-note-'));
}

function makeProgram(dir: string): Command {
  const p = new Command();
  p.exitOverride();
  registerNoteCommands(p, dir);
  return p;
}

describe('note set', () => {
  it('writes a note to disk', () => {
    const dir = makeTmp();
    const p = makeProgram(dir);
    p.parse(['note', 'set', 'prod', 'production snapshot'], { from: 'user' });
    const store = loadNotes(dir);
    expect(store['prod'].note).toBe('production snapshot');
  });
});

describe('note get', () => {
  it('prints note text', () => {
    const dir = makeTmp();
    let store = setNote({}, 'dev', 'dev env');
    saveNotes(dir, store);
    const p = makeProgram(dir);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    p.parse(['note', 'get', 'dev'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('dev env'));
    spy.mockRestore();
  });

  it('prints fallback for missing note', () => {
    const dir = makeTmp();
    const p = makeProgram(dir);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    p.parse(['note', 'get', 'ghost'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No note found'));
    spy.mockRestore();
  });
});

describe('note remove', () => {
  it('deletes the note from disk', () => {
    const dir = makeTmp();
    saveNotes(dir, setNote({}, 'ci', 'ci env'));
    const p = makeProgram(dir);
    p.parse(['note', 'remove', 'ci'], { from: 'user' });
    const store = loadNotes(dir);
    expect(store['ci']).toBeUndefined();
  });
});

describe('note list', () => {
  it('prints all notes', () => {
    const dir = makeTmp();
    let store = setNote({}, 'alpha', 'first');
    store = setNote(store, 'beta', 'second');
    saveNotes(dir, store);
    const p = makeProgram(dir);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    p.parse(['note', 'list'], { from: 'user' });
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain('alpha');
    expect(output).toContain('beta');
    spy.mockRestore();
  });
});
