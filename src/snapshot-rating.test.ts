import {
  createRating,
  setRating,
  removeRating,
  getRating,
  listRatings,
  formatRatings,
  RatingStore,
} from './snapshot-rating';

const emptyStore = (): RatingStore => ({ ratings: [] });

describe('createRating', () => {
  it('creates a valid rating', () => {
    const r = createRating('snap-a', 4, 'good one');
    expect(r.snapshotName).toBe('snap-a');
    expect(r.rating).toBe(4);
    expect(r.note).toBe('good one');
    expect(r.ratedAt).toBeTruthy();
  });

  it('throws for out-of-range rating', () => {
    expect(() => createRating('snap-a', 0)).toThrow();
    expect(() => createRating('snap-a', 6)).toThrow();
  });

  it('throws for non-integer rating', () => {
    expect(() => createRating('snap-a', 3.5)).toThrow();
  });
});

describe('setRating', () => {
  it('adds a new rating', () => {
    const store = setRating(emptyStore(), 'snap-a', 3);
    expect(store.ratings).toHaveLength(1);
    expect(store.ratings[0].rating).toBe(3);
  });

  it('replaces an existing rating', () => {
    let store = setRating(emptyStore(), 'snap-a', 3);
    store = setRating(store, 'snap-a', 5, 'updated');
    expect(store.ratings).toHaveLength(1);
    expect(store.ratings[0].rating).toBe(5);
    expect(store.ratings[0].note).toBe('updated');
  });
});

describe('removeRating', () => {
  it('removes a rating by name', () => {
    let store = setRating(emptyStore(), 'snap-a', 4);
    store = removeRating(store, 'snap-a');
    expect(store.ratings).toHaveLength(0);
  });

  it('is a no-op for unknown name', () => {
    const store = setRating(emptyStore(), 'snap-a', 4);
    expect(removeRating(store, 'snap-z').ratings).toHaveLength(1);
  });
});

describe('listRatings', () => {
  it('returns sorted by rating desc', () => {
    let store = setRating(emptyStore(), 'snap-a', 2);
    store = setRating(store, 'snap-b', 5);
    const list = listRatings(store);
    expect(list[0].snapshotName).toBe('snap-b');
  });

  it('filters by minRating', () => {
    let store = setRating(emptyStore(), 'snap-a', 2);
    store = setRating(store, 'snap-b', 4);
    expect(listRatings(store, 3)).toHaveLength(1);
  });
});

describe('formatRatings', () => {
  it('returns no-ratings message for empty list', () => {
    expect(formatRatings([])).toContain('No ratings');
  });

  it('formats stars correctly', () => {
    const r = createRating('snap-a', 3);
    const out = formatRatings([r]);
    expect(out).toContain('★★★☆☆');
  });
});
