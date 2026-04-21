import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAuditEntry,
  filterAuditLog,
  formatAuditEntry,
  formatAuditLog,
  AuditEntry,
} from './audit';

function makeEntry(overrides: Partial<AuditEntry> = {}): AuditEntry {
  return {
    id: 'test-id',
    timestamp: '2024-01-15T10:00:00.000Z',
    action: 'save',
    snapshotName: 'my-snap',
    user: 'alice',
    ...overrides,
  };
}

describe('createAuditEntry', () => {
  it('creates an entry with required fields', () => {
    const entry = createAuditEntry('save', 'prod');
    expect(entry.action).toBe('save');
    expect(entry.snapshotName).toBe('prod');
    expect(entry.id).toBeTruthy();
    expect(entry.timestamp).toBeTruthy();
  });

  it('includes optional details', () => {
    const entry = createAuditEntry('delete', 'old-snap', 'manual cleanup');
    expect(entry.details).toBe('manual cleanup');
  });
});

describe('filterAuditLog', () => {
  const entries: AuditEntry[] = [
    makeEntry({ action: 'save', snapshotName: 'prod', timestamp: '2024-01-10T00:00:00.000Z' }),
    makeEntry({ action: 'restore', snapshotName: 'dev', timestamp: '2024-01-12T00:00:00.000Z' }),
    makeEntry({ action: 'delete', snapshotName: 'prod', timestamp: '2024-01-20T00:00:00.000Z' }),
  ];

  it('filters by action', () => {
    const result = filterAuditLog(entries, { action: 'save' });
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe('save');
  });

  it('filters by snapshotName', () => {
    const result = filterAuditLog(entries, { snapshotName: 'prod' });
    expect(result).toHaveLength(2);
  });

  it('filters by since date', () => {
    const result = filterAuditLog(entries, { since: new Date('2024-01-11T00:00:00.000Z') });
    expect(result).toHaveLength(2);
  });

  it('returns all entries when no filter', () => {
    expect(filterAuditLog(entries, {})).toHaveLength(3);
  });
});

describe('formatAuditLog', () => {
  it('returns message when empty', () => {
    expect(formatAuditLog([])).toBe('No audit entries found.');
  });

  it('formats entries as lines', () => {
    const entry = makeEntry();
    const result = formatAuditLog([entry]);
    expect(result).toContain('[SAVE]');
    expect(result).toContain('my-snap');
    expect(result).toContain('alice');
  });
});
