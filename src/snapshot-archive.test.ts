import {
  archiveSnapshot,
  unarchiveSnapshot,
  listArchived,
  formatArchiveList,
  exportArchive,
  importArchive,
  ArchiveStore,
} from './snapshot-archive';
import { Snapshot } from './storage';

function makeSnapshot(name: string): Snapshot {
  return { name, env: { KEY: 'value' }, createdAt: '2024-01-01T00:00:00.000Z' };
}

function emptyStore(): ArchiveStore {
  return { entries: [] };
}

describe('archiveSnapshot', () => {
  it('adds an entry to the store', () => {
    const snap = makeSnapshot('prod');
    const store = archiveSnapshot(emptyStore(), snap, 'old release');
    expect(store.entries).toHaveLength(1);
    expect(store.entries[0].name).toBe('prod');
    expect(store.entries[0].reason).toBe('old release');
    expect(store.entries[0].snapshot).toEqual(snap);
  });

  it('preserves immutability of original store', () => {
    const original = emptyStore();
    archiveSnapshot(original, makeSnapshot('dev'));
    expect(original.entries).toHaveLength(0);
  });
});

describe('unarchiveSnapshot', () => {
  it('removes and returns the archived snapshot', () => {
    let store = archiveSnapshot(emptyStore(), makeSnapshot('staging'));
    const { store: updated, snapshot } = unarchiveSnapshot(store, 'staging');
    expect(snapshot).toBeDefined();
    expect(snapshot!.name).toBe('staging');
    expect(updated.entries).toHaveLength(0);
  });

  it('returns undefined for unknown name', () => {
    const { snapshot } = unarchiveSnapshot(emptyStore(), 'nope');
    expect(snapshot).toBeUndefined();
  });
});

describe('listArchived', () => {
  it('returns entries sorted newest first', () => {
    let store = emptyStore();
    const s1 = { ...makeSnapshot('a'), createdAt: '2024-01-01T00:00:00.000Z' };
    const s2 = { ...makeSnapshot('b'), createdAt: '2024-06-01T00:00:00.000Z' };
    store = archiveSnapshot(store, s1);
    store = archiveSnapshot(store, s2);
    const list = listArchived(store);
    expect(list[0].name).toBe('b');
  });
});

describe('formatArchiveList', () => {
  it('returns a message when empty', () => {
    expect(formatArchiveList([])).toBe('No archived snapshots.');
  });

  it('includes name and reason', () => {
    let store = archiveSnapshot(emptyStore(), makeSnapshot('prod'), 'cleanup');
    const output = formatArchiveList(listArchived(store));
    expect(output).toContain('prod');
    expect(output).toContain('cleanup');
  });
});

describe('exportArchive / importArchive', () => {
  it('round-trips the archive store via gzip', () => {
    let store = archiveSnapshot(emptyStore(), makeSnapshot('prod'), 'test');
    const buf = exportArchive(store);
    const restored = importArchive(buf);
    expect(restored.entries).toHaveLength(1);
    expect(restored.entries[0].name).toBe('prod');
  });
});
