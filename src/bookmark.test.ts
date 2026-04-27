import {
  createBookmark,
  addBookmark,
  removeBookmark,
  resolveBookmark,
  listBookmarks,
  formatBookmarks,
  BookmarkMap,
} from './bookmark';

function makeBookmarks(): BookmarkMap {
  return {
    prod: { name: 'prod', snapshotName: 'production-2024', description: 'Production env', createdAt: '2024-01-01T00:00:00.000Z' },
    dev: { name: 'dev', snapshotName: 'dev-local', createdAt: '2024-01-02T00:00:00.000Z' },
  };
}

test('createBookmark sets fields correctly', () => {
  const b = createBookmark('staging', 'staging-snap', 'Staging env');
  expect(b.name).toBe('staging');
  expect(b.snapshotName).toBe('staging-snap');
  expect(b.description).toBe('Staging env');
  expect(b.createdAt).toBeTruthy();
});

test('addBookmark adds a new bookmark', () => {
  const bm = makeBookmarks();
  const b = createBookmark('staging', 'staging-snap');
  const updated = addBookmark(bm, b);
  expect(updated['staging'].snapshotName).toBe('staging-snap');
});

test('addBookmark throws on duplicate name', () => {
  const bm = makeBookmarks();
  const b = createBookmark('prod', 'other-snap');
  expect(() => addBookmark(bm, b)).toThrow('already exists');
});

test('removeBookmark removes existing bookmark', () => {
  const bm = makeBookmarks();
  const updated = removeBookmark(bm, 'dev');
  expect(updated['dev']).toBeUndefined();
  expect(updated['prod']).toBeDefined();
});

test('removeBookmark throws when not found', () => {
  const bm = makeBookmarks();
  expect(() => removeBookmark(bm, 'missing')).toThrow('not found');
});

test('resolveBookmark returns snapshot name', () => {
  const bm = makeBookmarks();
  expect(resolveBookmark(bm, 'prod')).toBe('production-2024');
});

test('resolveBookmark throws when not found', () => {
  const bm = makeBookmarks();
  expect(() => resolveBookmark(bm, 'ghost')).toThrow('not found');
});

test('listBookmarks returns sorted by createdAt', () => {
  const bm = makeBookmarks();
  const list = listBookmarks(bm);
  expect(list[0].name).toBe('prod');
  expect(list[1].name).toBe('dev');
});

test('formatBookmarks returns readable output', () => {
  const bm = makeBookmarks();
  const out = formatBookmarks(listBookmarks(bm));
  expect(out).toContain('prod -> production-2024');
  expect(out).toContain('# Production env');
  expect(out).toContain('dev -> dev-local');
});

test('formatBookmarks handles empty list', () => {
  expect(formatBookmarks([])).toBe('No bookmarks defined.');
});
