import {
  extractMetadata,
  formatMetadata,
  annotateSnapshot,
  metadataMatchesQuery,
} from './snapshot-metadata';
import { Snapshot } from './storage';

function makeSnapshot(overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    name: 'test-snap',
    env: { FOO: 'bar', BAZ: 'qux' },
    createdAt: '2024-01-15T10:00:00.000Z',
    tags: ['dev', 'local'],
    ...overrides,
  } as Snapshot;
}

describe('extractMetadata', () => {
  it('extracts key count and size', () => {
    const snap = makeSnapshot();
    const meta = extractMetadata(snap);
    expect(meta.keyCount).toBe(2);
    expect(meta.sizeBytes).toBeGreaterThan(0);
    expect(meta.name).toBe('test-snap');
    expect(meta.tags).toEqual(['dev', 'local']);
  });

  it('handles empty env map', () => {
    const snap = makeSnapshot({ env: {} });
    const meta = extractMetadata(snap);
    expect(meta.keyCount).toBe(0);
    expect(meta.sizeBytes).toBe(2); // '{}'
  });

  it('includes optional description and source', () => {
    const snap = makeSnapshot({ description: 'my desc', source: '.env.local' } as any);
    const meta = extractMetadata(snap);
    expect(meta.description).toBe('my desc');
    expect(meta.source).toBe('.env.local');
  });
});

describe('formatMetadata', () => {
  it('formats all fields', () => {
    const snap = makeSnapshot({ description: 'hello', source: 'dotenv' } as any);
    const output = formatMetadata(extractMetadata(snap));
    expect(output).toContain('Name:');
    expect(output).toContain('test-snap');
    expect(output).toContain('Keys:        2');
    expect(output).toContain('Description: hello');
    expect(output).toContain('Source:      dotenv');
  });

  it('shows (none) when no tags', () => {
    const snap = makeSnapshot({ tags: [] });
    const output = formatMetadata(extractMetadata(snap));
    expect(output).toContain('(none)');
  });
});

describe('annotateSnapshot', () => {
  it('adds description and source', () => {
    const snap = makeSnapshot();
    const updated = annotateSnapshot(snap, { description: 'annotated', source: 'ci' });
    expect((updated as any).description).toBe('annotated');
    expect((updated as any).source).toBe('ci');
    expect(updated.name).toBe('test-snap');
  });

  it('does not overwrite unspecified fields', () => {
    const snap = makeSnapshot();
    const updated = annotateSnapshot(snap, { description: 'only desc' });
    expect((updated as any).description).toBe('only desc');
    expect((updated as any).source).toBeUndefined();
  });
});

describe('metadataMatchesQuery', () => {
  it('matches by name', () => {
    const meta = extractMetadata(makeSnapshot());
    expect(metadataMatchesQuery(meta, 'test')).toBe(true);
  });

  it('matches by tag', () => {
    const meta = extractMetadata(makeSnapshot());
    expect(metadataMatchesQuery(meta, 'dev')).toBe(true);
  });

  it('returns false for no match', () => {
    const meta = extractMetadata(makeSnapshot());
    expect(metadataMatchesQuery(meta, 'zzznomatch')).toBe(false);
  });
});
