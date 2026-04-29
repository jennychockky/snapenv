import {
  createAccessEntry,
  recordAccess,
  filterAccessLog,
  mostAccessedSnapshots,
  formatAccessLog,
  AccessLog,
} from './snapshot-access';

const emptyLog = (): AccessLog => ({ entries: [] });

describe('createAccessEntry', () => {
  it('creates an entry with correct fields', () => {
    const e = createAccessEntry('prod', 'read', 'cli');
    expect(e.snapshotName).toBe('prod');
    expect(e.action).toBe('read');
    expect(e.source).toBe('cli');
    expect(typeof e.accessedAt).toBe('string');
  });

  it('allows undefined source', () => {
    const e = createAccessEntry('dev', 'write');
    expect(e.source).toBeUndefined();
  });
});

describe('recordAccess', () => {
  it('appends entry to log', () => {
    const log = emptyLog();
    const entry = createAccessEntry('prod', 'read');
    const updated = recordAccess(log, entry);
    expect(updated.entries).toHaveLength(1);
    expect(updated.entries[0]).toBe(entry);
  });

  it('does not mutate original log', () => {
    const log = emptyLog();
    recordAccess(log, createAccessEntry('x', 'read'));
    expect(log.entries).toHaveLength(0);
  });
});

describe('filterAccessLog', () => {
  const log: AccessLog = {
    entries: [
      { snapshotName: 'prod', action: 'read', accessedAt: '2024-01-01T00:00:00Z' },
      { snapshotName: 'dev', action: 'write', accessedAt: '2024-06-01T00:00:00Z' },
      { snapshotName: 'prod', action: 'delete', accessedAt: '2024-06-15T00:00:00Z' },
    ],
  };

  it('filters by snapshotName', () => {
    expect(filterAccessLog(log, { snapshotName: 'prod' })).toHaveLength(2);
  });

  it('filters by action', () => {
    expect(filterAccessLog(log, { action: 'write' })).toHaveLength(1);
  });

  it('filters by since date', () => {
    const since = new Date('2024-06-01T00:00:00Z');
    expect(filterAccessLog(log, { since })).toHaveLength(2);
  });
});

describe('mostAccessedSnapshots', () => {
  it('returns sorted counts', () => {
    const log: AccessLog = {
      entries: [
        { snapshotName: 'prod', action: 'read', accessedAt: '' },
        { snapshotName: 'prod', action: 'read', accessedAt: '' },
        { snapshotName: 'dev', action: 'read', accessedAt: '' },
      ],
    };
    const result = mostAccessedSnapshots(log);
    expect(result[0]).toEqual({ name: 'prod', count: 2 });
    expect(result[1]).toEqual({ name: 'dev', count: 1 });
  });
});

describe('formatAccessLog', () => {
  it('returns message when empty', () => {
    expect(formatAccessLog([])).toMatch(/no access/i);
  });

  it('formats entries', () => {
    const e = createAccessEntry('prod', 'read', 'cli');
    const out = formatAccessLog([e]);
    expect(out).toContain('READ');
    expect(out).toContain('prod');
    expect(out).toContain('via cli');
  });
});
