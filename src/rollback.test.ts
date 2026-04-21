import {
  buildRollbackStack,
  createRollbackEntry,
  formatRollbackResult,
  getLastRollbackTarget,
  performRollback,
  RollbackEntry,
} from './rollback';
import { Snapshot } from './storage';

function makeSnapshot(name: string, env: Record<string, string> = {}): Snapshot {
  return { name, env, createdAt: new Date().toISOString() };
}

function makeEntry(from: string, to: string): RollbackEntry {
  return { timestamp: new Date().toISOString(), fromSnapshot: from, toSnapshot: to };
}

describe('buildRollbackStack', () => {
  it('returns up to maxDepth entries', () => {
    const entries = Array.from({ length: 15 }, (_, i) => makeEntry(`s${i}`, `s${i + 1}`));
    const stack = buildRollbackStack(entries, 10);
    expect(stack).toHaveLength(10);
    expect(stack[0].fromSnapshot).toBe('s5');
  });

  it('returns all entries if fewer than maxDepth', () => {
    const entries = [makeEntry('a', 'b'), makeEntry('b', 'c')];
    expect(buildRollbackStack(entries)).toHaveLength(2);
  });
});

describe('getLastRollbackTarget', () => {
  it('returns null for empty history', () => {
    expect(getLastRollbackTarget([])).toBeNull();
  });

  it('returns fromSnapshot of last entry', () => {
    const history = [makeEntry('alpha', 'beta'), makeEntry('beta', 'gamma')];
    expect(getLastRollbackTarget(history)).toBe('beta');
  });
});

describe('createRollbackEntry', () => {
  it('creates entry with current timestamp', () => {
    const entry = createRollbackEntry('snap1', 'snap2');
    expect(entry.fromSnapshot).toBe('snap1');
    expect(entry.toSnapshot).toBe('snap2');
    expect(new Date(entry.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
  });
});

describe('performRollback', () => {
  it('returns success result with correct key count', () => {
    const current = makeSnapshot('current', { A: '1' });
    const target = makeSnapshot('target', { X: '1', Y: '2', Z: '3' });
    const result = performRollback(current, target);
    expect(result.success).toBe(true);
    expect(result.restoredKeys).toBe(3);
    expect(result.snapshotName).toBe('target');
    expect(result.previousName).toBe('current');
  });
});

describe('formatRollbackResult', () => {
  it('formats successful rollback', () => {
    const result = { success: true, snapshotName: 'v2', previousName: 'v1', restoredKeys: 5, message: 'OK' };
    expect(formatRollbackResult(result)).toContain('v2');
    expect(formatRollbackResult(result)).toContain('5 key(s)');
  });

  it('formats failure', () => {
    const result = { success: false, snapshotName: '', previousName: null, restoredKeys: 0, message: 'Not found' };
    expect(formatRollbackResult(result)).toContain('Not found');
  });
});
