import { applySnapshot, diffSnapshot, filterByPrefix, mergeEnvMaps } from './snapshot';

describe('applySnapshot', () => {
  it('overlays snapshot values onto base', () => {
    const base = { A: '1', B: '2' };
    const snap = { B: 'override', C: '3' };
    expect(applySnapshot(base, snap)).toEqual({ A: '1', B: 'override', C: '3' });
  });

  it('returns clone of base when snapshot is empty', () => {
    const base = { X: 'x' };
    expect(applySnapshot(base, {})).toEqual({ X: 'x' });
  });
});

describe('diffSnapshot', () => {
  it('detects added keys', () => {
    const r = diffSnapshot({ A: '1' }, { A: '1', B: '2' });
    expect(r.added).toContain('B');
    expect(r.removed).toHaveLength(0);
    expect(r.changed).toHaveLength(0);
  });

  it('detects removed keys', () => {
    const r = diffSnapshot({ A: '1', B: '2' }, { A: '1' });
    expect(r.removed).toContain('B');
    expect(r.added).toHaveLength(0);
  });

  it('detects changed keys', () => {
    const r = diffSnapshot({ A: 'old' }, { A: 'new' });
    expect(r.changed).toContain('A');
    expect(r.added).toHaveLength(0);
    expect(r.removed).toHaveLength(0);
  });

  it('returns empty diff for identical envs', () => {
    const env = { A: '1', B: '2' };
    const r = diffSnapshot(env, { ...env });
    expect(r.added).toHaveLength(0);
    expect(r.removed).toHaveLength(0);
    expect(r.changed).toHaveLength(0);
  });
});

describe('filterByPrefix', () => {
  it('returns only matching keys', () => {
    const env = { APP_FOO: '1', APP_BAR: '2', OTHER: '3' };
    expect(filterByPrefix(env, 'APP_')).toEqual({ APP_FOO: '1', APP_BAR: '2' });
  });

  it('returns empty object when no match', () => {
    expect(filterByPrefix({ A: '1' }, 'Z_')).toEqual({});
  });
});

describe('mergeEnvMaps', () => {
  it('merges multiple maps with last-wins', () => {
    const result = mergeEnvMaps({ A: '1' }, { A: '2', B: '3' }, { C: '4' });
    expect(result).toEqual({ A: '2', B: '3', C: '4' });
  });

  it('handles single map', () => {
    expect(mergeEnvMaps({ X: 'x' })).toEqual({ X: 'x' });
  });
});
