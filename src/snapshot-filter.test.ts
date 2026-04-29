import { applyFilters, filterByDate, filterByTags, filterByKeyPattern, filterByKeyCount, formatFilterSummary } from './snapshot-filter';
import { Snapshot } from './storage';

function makeSnapshot(overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    name: 'test',
    env: { FOO: 'bar', BAZ: 'qux' },
    createdAt: new Date('2024-01-15').toISOString(),
    tags: [],
    ...overrides,
  } as Snapshot;
}

describe('filterByDate', () => {
  const snap = makeSnapshot({ createdAt: new Date('2024-06-01').toISOString() });

  it('filters snapshots before a date', () => {
    expect(filterByDate([snap], new Date('2024-07-01'))).toHaveLength(1);
    expect(filterByDate([snap], new Date('2024-05-01'))).toHaveLength(0);
  });

  it('filters snapshots after a date', () => {
    expect(filterByDate([snap], undefined, new Date('2024-05-01'))).toHaveLength(1);
    expect(filterByDate([snap], undefined, new Date('2024-07-01'))).toHaveLength(0);
  });
});

describe('filterByTags', () => {
  const snap = makeSnapshot({ tags: ['prod', 'aws'] });

  it('returns all when no tags specified', () => {
    expect(filterByTags([snap], [])).toHaveLength(1);
  });

  it('matches snapshots with all required tags', () => {
    expect(filterByTags([snap], ['prod'])).toHaveLength(1);
    expect(filterByTags([snap], ['prod', 'aws'])).toHaveLength(1);
    expect(filterByTags([snap], ['prod', 'gcp'])).toHaveLength(0);
  });
});

describe('filterByKeyPattern', () => {
  const snap = makeSnapshot({ env: { DATABASE_URL: 'x', API_KEY: 'y' } });

  it('matches keys by pattern', () => {
    expect(filterByKeyPattern([snap], /^DATABASE/)).toHaveLength(1);
    expect(filterByKeyPattern([snap], /^REDIS/)).toHaveLength(0);
  });
});

describe('filterByKeyCount', () => {
  const snap = makeSnapshot({ env: { A: '1', B: '2', C: '3' } });

  it('filters by minimum key count', () => {
    expect(filterByKeyCount([snap], 2)).toHaveLength(1);
    expect(filterByKeyCount([snap], 4)).toHaveLength(0);
  });

  it('filters by maximum key count', () => {
    expect(filterByKeyCount([snap], undefined, 5)).toHaveLength(1);
    expect(filterByKeyCount([snap], undefined, 2)).toHaveLength(0);
  });
});

describe('applyFilters', () => {
  const snaps = [
    makeSnapshot({ name: 'prod-api', tags: ['prod'], env: { A: '1' } }),
    makeSnapshot({ name: 'dev-api', tags: ['dev'], env: { A: '1', B: '2' } }),
    makeSnapshot({ name: 'prod-db', tags: ['prod'], env: { DB: 'url' } }),
  ];

  it('filters by prefix', () => {
    expect(applyFilters(snaps, { prefix: 'prod' })).toHaveLength(2);
  });

  it('combines multiple filters', () => {
    expect(applyFilters(snaps, { prefix: 'prod', tags: ['prod'], minKeys: 1 })).toHaveLength(2);
    expect(applyFilters(snaps, { prefix: 'dev', minKeys: 2 })).toHaveLength(1);
  });
});

describe('formatFilterSummary', () => {
  it('formats summary correctly', () => {
    expect(formatFilterSummary(10, 3)).toBe('Matched 3 of 10 snapshots.');
    expect(formatFilterSummary(1, 1)).toBe('Matched 1 of 1 snapshot.');
  });
});
