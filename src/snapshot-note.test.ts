import {
  createNote,
  setNote,
  removeNote,
  getNote,
  listNotes,
  formatNote,
  formatNoteList,
  NoteStore,
} from './snapshot-note';

const emptyStore: NoteStore = {};

describe('createNote', () => {
  it('creates a note with matching fields', () => {
    const n = createNote('prod', 'production env');
    expect(n.snapshotName).toBe('prod');
    expect(n.note).toBe('production env');
    expect(n.createdAt).toBe(n.updatedAt);
  });
});

describe('setNote', () => {
  it('adds a new note', () => {
    const store = setNote(emptyStore, 'dev', 'dev env');
    expect(store['dev'].note).toBe('dev env');
  });

  it('preserves createdAt on update', () => {
    const store1 = setNote(emptyStore, 'dev', 'first');
    const created = store1['dev'].createdAt;
    const store2 = setNote(store1, 'dev', 'second');
    expect(store2['dev'].createdAt).toBe(created);
    expect(store2['dev'].note).toBe('second');
  });
});

describe('removeNote', () => {
  it('removes an existing note', () => {
    const store = setNote(emptyStore, 'staging', 'staging env');
    const next = removeNote(store, 'staging');
    expect(next['staging']).toBeUndefined();
  });

  it('is a no-op for missing key', () => {
    const next = removeNote(emptyStore, 'ghost');
    expect(next).toEqual({});
  });
});

describe('getNote', () => {
  it('returns the note if present', () => {
    const store = setNote(emptyStore, 'ci', 'ci env');
    expect(getNote(store, 'ci')?.note).toBe('ci env');
  });

  it('returns undefined if absent', () => {
    expect(getNote(emptyStore, 'missing')).toBeUndefined();
  });
});

describe('listNotes', () => {
  it('returns notes sorted by name', () => {
    let store = setNote(emptyStore, 'z-snap', 'z');
    store = setNote(store, 'a-snap', 'a');
    const list = listNotes(store);
    expect(list[0].snapshotName).toBe('a-snap');
    expect(list[1].snapshotName).toBe('z-snap');
  });
});

describe('formatNoteList', () => {
  it('returns fallback for empty list', () => {
    expect(formatNoteList([])).toBe('No notes found.');
  });

  it('formats each note', () => {
    const n = createNote('prod', 'hello');
    expect(formatNoteList([n])).toContain('[prod] hello');
  });
});
