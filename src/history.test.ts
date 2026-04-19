import {
  recordHistory,
  filterHistory,
  formatHistory,
  formatHistoryEntry,
  snapshotToHistoryEntry,
  HistoryEntry,
} from './history';
import { Snapshot } from './storage';

const makeEntry = (overrides: Partial<HistoryEntry> = {}): HistoryEntry => ({
  snapshotName: 'test',
  action: 'save',
  timestamp: '2024-01-01T00:00:00.000Z',
  keyCount: 3,
  ...overrides,
});

describe('recordHistory', () => {
  it('appends a new entry with a timestamp', () => {
    const result = recordHistory([], { snapshotName: 'dev', action: 'save', keyCount: 2 });
    expect(result).toHaveLength(1);
    expect(result[0].snapshotName).toBe('dev');
    expect(result[0].timestamp).toBeDefined();
  });

  it('preserves existing entries', () => {
    const existing = [makeEntry()];
    const result = recordHistory(existing, { snapshotName: 'prod', action: 'restore', keyCount: 5 });
    expect(result).toHaveLength(2);
  });
});

describe('filterHistory', () => {
  const history = [
    makeEntry({ snapshotName: 'dev', action: 'save' }),
    makeEntry({ snapshotName: 'prod', action: 'restore' }),
    makeEntry({ snapshotName: 'dev', action: 'delete' }),
  ];

  it('filters by snapshot name', () => {
    expect(filterHistory(history, 'dev')).toHaveLength(2);
  });

  it('filters by action', () => {
    expect(filterHistory(history, undefined, 'restore')).toHaveLength(1);
  });

  it('filters by both', () => {
    expect(filterHistory(history, 'dev', 'save')).toHaveLength(1);
  });
});

describe('formatHistory', () => {
  it('returns message when empty', () => {
    expect(formatHistory([])).toMatch(/no history/i);
  });

  it('formats entries', () => {
    const result = formatHistory([makeEntry()]);
    expect(result).toContain('SAVE');
    expect(result).toContain('test');
    expect(result).toContain('3 keys');
  });
});

describe('snapshotToHistoryEntry', () => {
  it('converts snapshot to history entry', () => {
    const snapshot: Snapshot = { name: 'dev', env: { A: '1', B: '2' }, createdAt: '' };
    const entry = snapshotToHistoryEntry(snapshot, 'save');
    expect(entry.snapshotName).toBe('dev');
    expect(entry.keyCount).toBe(2);
    expect(entry.action).toBe('save');
  });
});
