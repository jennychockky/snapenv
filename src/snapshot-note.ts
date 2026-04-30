export interface SnapshotNote {
  snapshotName: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export type NoteStore = Record<string, SnapshotNote>;

export function createNote(snapshotName: string, note: string): SnapshotNote {
  const now = new Date().toISOString();
  return { snapshotName, note, createdAt: now, updatedAt: now };
}

export function setNote(store: NoteStore, snapshotName: string, note: string): NoteStore {
  const existing = store[snapshotName];
  const now = new Date().toISOString();
  return {
    ...store,
    [snapshotName]: {
      snapshotName,
      note,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    },
  };
}

export function removeNote(store: NoteStore, snapshotName: string): NoteStore {
  const next = { ...store };
  delete next[snapshotName];
  return next;
}

export function getNote(store: NoteStore, snapshotName: string): SnapshotNote | undefined {
  return store[snapshotName];
}

export function listNotes(store: NoteStore): SnapshotNote[] {
  return Object.values(store).sort((a, b) => a.snapshotName.localeCompare(b.snapshotName));
}

export function formatNote(note: SnapshotNote): string {
  return `[${note.snapshotName}] ${note.note}  (updated ${note.updatedAt})`;
}

export function formatNoteList(notes: SnapshotNote[]): string {
  if (notes.length === 0) return 'No notes found.';
  return notes.map(formatNote).join('\n');
}
