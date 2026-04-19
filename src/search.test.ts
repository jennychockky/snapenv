import { searchSnapshots, formatSearchResults } from './search';
import { Snapshot } from './storage';

const snapshots: Record<string, Snapshot> = {
  dev: {
    name: 'dev',
    env: { NODE_ENV: 'development', DB_HOST: 'localhost', API_KEY: 'abc123' },
    createdAt: '2024-01-01',
    tags: ['local'],
  },
  prod: {
    name: 'prod',
    env: { NODE_ENV: 'production', DB_HOST: 'db.prod.com', API_KEY: 'xyz789' },
    createdAt: '2024-01-02',
    tags: ['remote'],
  },
};

describe('searchSnapshots', () => {
  it('matches by key pattern', () => {
    const results = searchSnapshots(snapshots, { key: 'DB_' });
    expect(results).toHaveLength(2);
    results.forEach(r => expect(r.matches.every(m => m.key.includes('DB_'))).toBe(true));
  });

  it('matches by value pattern', () => {
    const results = searchSnapshots(snapshots, { value: 'localhost' });
    expect(results).toHaveLength(1);
    expect(results[0].snapshotName).toBe('dev');
  });

  it('matches by snapshot name', () => {
    const results = searchSnapshots(snapshots, { name: 'prod' });
    expect(results).toHaveLength(1);
    expect(results[0].snapshotName).toBe('prod');
  });

  it('matches by tag', () => {
    const results = searchSnapshots(snapshots, { tag: 'local' });
    expect(results).toHaveLength(1);
    expect(results[0].snapshotName).toBe('dev');
  });

  it('is case insensitive by default', () => {
    const results = searchSnapshots(snapshots, { key: 'node_env' });
    expect(results).toHaveLength(2);
  });

  it('respects caseSensitive option', () => {
    const results = searchSnapshots(snapshots, { key: 'node_env', caseSensitive: true });
    expect(results).toHaveLength(0);
  });

  it('returns empty when no matches', () => {
    const results = searchSnapshots(snapshots, { value: 'nonexistent' });
    expect(results).toHaveLength(0);
  });
});

describe('formatSearchResults', () => {
  it('returns no matches message for empty results', () => {
    expect(formatSearchResults([])).toBe('No matches found.');
  });

  it('formats results with snapshot name and key=value lines', () => {
    const results = searchSnapshots(snapshots, { key: 'DB_HOST' });
    const output = formatSearchResults(results);
    expect(output).toContain('[dev]');
    expect(output).toContain('DB_HOST=localhost');
  });
});
