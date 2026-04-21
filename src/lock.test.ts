import { lockSnapshot, unlockSnapshot, isLocked, listLocks, formatLocks } from './lock';

const snapshots = [
  { name: 'dev', vars: { NODE_ENV: 'development' }, createdAt: '2024-01-01T00:00:00.000Z' },
  { name: 'prod', vars: { NODE_ENV: 'production' }, createdAt: '2024-01-02T00:00:00.000Z' },
];

describe('lockSnapshot', () => {
  it('adds a lock entry for an existing snapshot', () => {
    const locks = lockSnapshot(snapshots, {}, 'dev');
    expect(locks['dev']).toBe(true);
  });

  it('throws if snapshot does not exist', () => {
    expect(() => lockSnapshot(snapshots, {}, 'staging')).toThrow('Snapshot "staging" not found');
  });

  it('throws if snapshot is already locked', () => {
    expect(() => lockSnapshot(snapshots, { dev: true }, 'dev')).toThrow('already locked');
  });
});

describe('unlockSnapshot', () => {
  it('removes lock entry', () => {
    const locks = unlockSnapshot({ dev: true, prod: true }, 'dev');
    expect(locks['dev']).toBeUndefined();
    expect(locks['prod']).toBe(true);
  });

  it('throws if snapshot is not locked', () => {
    expect(() => unlockSnapshot({}, 'dev')).toThrow('not locked');
  });
});

describe('isLocked', () => {
  it('returns true when locked', () => {
    expect(isLocked({ dev: true }, 'dev')).toBe(true);
  });

  it('returns false when not locked', () => {
    expect(isLocked({}, 'dev')).toBe(false);
  });

  it('returns false when value is false', () => {
    expect(isLocked({ dev: false }, 'dev')).toBe(false);
  });
});

describe('listLocks', () => {
  it('returns only locked snapshot names', () => {
    const result = listLocks({ dev: true, prod: false, staging: true });
    expect(result).toEqual(['dev', 'staging']);
  });

  it('returns empty array when no locks', () => {
    expect(listLocks({})).toEqual([]);
  });
});

describe('formatLocks', () => {
  it('formats locked list', () => {
    const output = formatLocks(['dev', 'prod']);
    expect(output).toContain('dev');
    expect(output).toContain('prod');
  });

  it('shows message when no locks', () => {
    const output = formatLocks([]);
    expect(output).toContain('No locked snapshots');
  });
});
