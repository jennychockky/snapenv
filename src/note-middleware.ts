import { Command } from 'commander';
import { loadNotes } from './note-command';
import { getNote } from './snapshot-note';

/**
 * If a snapshot has an attached note, print it before the command runs.
 * Attach via `program.hook('preAction', ...)` after calling this.
 */
export function registerNoteMiddleware(program: Command, storageDir: string): void {
  program.hook('preAction', (thisCommand) => {
    const args = thisCommand.args;
    if (args.length === 0) return;

    // Heuristic: first positional argument may be a snapshot name.
    const candidate = args[0];
    if (!candidate || candidate.startsWith('-')) return;

    const store = loadNotes(storageDir);
    const note = getNote(store, candidate);
    if (note) {
      console.log(`  📝 Note for "${candidate}": ${note.note}`);
    }
  });
}

/**
 * Returns a note hint string suitable for embedding in help text or output.
 */
export function noteHint(storageDir: string, snapshotName: string): string | null {
  const store = loadNotes(storageDir);
  const note = getNote(store, snapshotName);
  return note ? `📝 ${note.note}` : null;
}
