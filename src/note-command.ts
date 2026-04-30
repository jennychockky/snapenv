import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import {
  NoteStore,
  setNote,
  removeNote,
  getNote,
  listNotes,
  formatNoteList,
  formatNote,
} from './snapshot-note';

export function getNotePath(dir: string): string {
  return path.join(dir, 'notes.json');
}

export function loadNotes(dir: string): NoteStore {
  const p = getNotePath(dir);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf8')) as NoteStore;
}

export function saveNotes(dir: string, store: NoteStore): void {
  fs.writeFileSync(getNotePath(dir), JSON.stringify(store, null, 2));
}

export function registerNoteCommands(program: Command, storageDir: string): void {
  const note = program.command('note').description('Manage notes attached to snapshots');

  note
    .command('set <snapshot> <text>')
    .description('Set or update a note for a snapshot')
    .action((snapshot: string, text: string) => {
      const store = loadNotes(storageDir);
      const updated = setNote(store, snapshot, text);
      saveNotes(storageDir, updated);
      console.log(`Note set for "${snapshot}".`);
    });

  note
    .command('get <snapshot>')
    .description('Show the note for a snapshot')
    .action((snapshot: string) => {
      const store = loadNotes(storageDir);
      const n = getNote(store, snapshot);
      if (!n) {
        console.log(`No note found for "${snapshot}".`);
      } else {
        console.log(formatNote(n));
      }
    });

  note
    .command('remove <snapshot>')
    .description('Remove the note for a snapshot')
    .action((snapshot: string) => {
      const store = loadNotes(storageDir);
      const updated = removeNote(store, snapshot);
      saveNotes(storageDir, updated);
      console.log(`Note removed for "${snapshot}".`);
    });

  note
    .command('list')
    .description('List all snapshot notes')
    .action(() => {
      const store = loadNotes(storageDir);
      console.log(formatNoteList(listNotes(store)));
    });
}
