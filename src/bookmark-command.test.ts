import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerBookmarkCommands, loadBookmarks, saveBookmarks } from './bookmark-command';
import { saveSnapshots } from './storage';

function makeTmp(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'snapenv-bookmark-'));
  return dir;
}

function makeProgram(storageDir: string): Command {
  const program = new Command();
  program.exitOverride();
  registerBookmarkCommands(program, storageDir);
  return program;
}

test('add creates a bookmark for an existing snapshot', () => {
  const dir = makeTmp();
  saveSnapshots(dir, { mysnap: { name: 'mysnap', env: { FOO: 'bar' }, createdAt: new Date().toISOString() } });
  const program = makeProgram(dir);
  program.parse(['bookmark', 'add', 'b1', 'mysnap'], { from: 'user' });
  const bm = loadBookmarks(dir);
  expect(bm['b1'].snapshotName).toBe('mysnap');
});

test('add with description stores description', () => {
  const dir = makeTmp();
  saveSnapshots(dir, { mysnap: { name: 'mysnap', env: {}, createdAt: new Date().toISOString() } });
  const program = makeProgram(dir);
  program.parse(['bookmark', 'add', 'b2', 'mysnap', '--description', 'My bookmark'], { from: 'user' });
  const bm = loadBookmarks(dir);
  expect(bm['b2'].description).toBe('My bookmark');
});

test('remove deletes a bookmark', () => {
  const dir = makeTmp();
  saveBookmarks(dir, {
    b1: { name: 'b1', snapshotName: 'snap1', createdAt: new Date().toISOString() },
  });
  const program = makeProgram(dir);
  program.parse(['bookmark', 'remove', 'b1'], { from: 'user' });
  const bm = loadBookmarks(dir);
  expect(bm['b1']).toBeUndefined();
});

test('resolve prints snapshot name', () => {
  const dir = makeTmp();
  saveBookmarks(dir, {
    prod: { name: 'prod', snapshotName: 'production-snap', createdAt: new Date().toISOString() },
  });
  const program = makeProgram(dir);
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  program.parse(['bookmark', 'resolve', 'prod'], { from: 'user' });
  expect(spy).toHaveBeenCalledWith('production-snap');
  spy.mockRestore();
});

test('list outputs formatted bookmarks', () => {
  const dir = makeTmp();
  saveBookmarks(dir, {
    dev: { name: 'dev', snapshotName: 'dev-snap', createdAt: new Date().toISOString() },
  });
  const program = makeProgram(dir);
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  program.parse(['bookmark', 'list'], { from: 'user' });
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('dev -> dev-snap'));
  spy.mockRestore();
});

test('list shows empty message when no bookmarks', () => {
  const dir = makeTmp();
  const program = makeProgram(dir);
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  program.parse(['bookmark', 'list'], { from: 'user' });
  expect(spy).toHaveBeenCalledWith('No bookmarks defined.');
  spy.mockRestore();
});
