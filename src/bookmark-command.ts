import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import {
  BookmarkMap,
  createBookmark,
  addBookmark,
  removeBookmark,
  resolveBookmark,
  listBookmarks,
  formatBookmarks,
} from './bookmark';
import { loadSnapshots } from './storage';

export function getBookmarkPath(storageDir: string): string {
  return path.join(storageDir, 'bookmarks.json');
}

export function loadBookmarks(storageDir: string): BookmarkMap {
  const p = getBookmarkPath(storageDir);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export function saveBookmarks(storageDir: string, bookmarks: BookmarkMap): void {
  fs.writeFileSync(getBookmarkPath(storageDir), JSON.stringify(bookmarks, null, 2));
}

export function registerBookmarkCommands(program: Command, storageDir: string): void {
  const bookmark = program.command('bookmark').description('Manage snapshot bookmarks');

  bookmark
    .command('add <name> <snapshot>')
    .description('Create a bookmark pointing to a snapshot')
    .option('-d, --description <desc>', 'Optional description')
    .action((name: string, snapshot: string, opts: { description?: string }) => {
      const snapshots = loadSnapshots(storageDir);
      if (!snapshots[snapshot]) {
        console.error(`Snapshot "${snapshot}" does not exist.`);
        process.exit(1);
      }
      const bookmarks = loadBookmarks(storageDir);
      const b = createBookmark(name, snapshot, opts.description);
      const updated = addBookmark(bookmarks, b);
      saveBookmarks(storageDir, updated);
      console.log(`Bookmark "${name}" -> "${snapshot}" created.`);
    });

  bookmark
    .command('remove <name>')
    .description('Delete a bookmark')
    .action((name: string) => {
      const bookmarks = loadBookmarks(storageDir);
      const updated = removeBookmark(bookmarks, name);
      saveBookmarks(storageDir, updated);
      console.log(`Bookmark "${name}" removed.`);
    });

  bookmark
    .command('resolve <name>')
    .description('Print the snapshot name a bookmark points to')
    .action((name: string) => {
      const bookmarks = loadBookmarks(storageDir);
      const snapshotName = resolveBookmark(bookmarks, name);
      console.log(snapshotName);
    });

  bookmark
    .command('list')
    .description('List all bookmarks')
    .action(() => {
      const bookmarks = loadBookmarks(storageDir);
      console.log(formatBookmarks(listBookmarks(bookmarks)));
    });
}
