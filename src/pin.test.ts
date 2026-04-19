import { pinSnapshot, unpinSnapshot, isPinned, listPins, formatPins, PinMap } from './pin';

const empty: PinMap = {};

describe('pinSnapshot', () => {
  it('adds a pin entry', () => {
    const pins = pinSnapshot(empty, 'prod');
    expect(pins['prod']).toBeDefined();
    expect(pins['prod'].name).toBe('prod');
  });

  it('stores optional note', () => {
    const pins = pinSnapshot(empty, 'staging', 'release candidate');
    expect(pins['staging'].note).toBe('release candidate');
  });

  it('does not mutate original', () => {
    pinSnapshot(empty, 'prod');
    expect(Object.keys(empty).length).toBe(0);
  });
});

describe('unpinSnapshot', () => {
  it('removes a pin entry', () => {
    const pins = pinSnapshot(empty, 'prod');
    const result = unpinSnapshot(pins, 'prod');
    expect(result['prod']).toBeUndefined();
  });

  it('is a no-op for unknown name', () => {
    const result = unpinSnapshot(empty, 'ghost');
    expect(Object.keys(result).length).toBe(0);
  });
});

describe('isPinned', () => {
  it('returns true when pinned', () => {
    const pins = pinSnapshot(empty, 'dev');
    expect(isPinned(pins, 'dev')).toBe(true);
  });

  it('returns false when not pinned', () => {
    expect(isPinned(empty, 'dev')).toBe(false);
  });
});

describe('listPins', () => {
  it('returns sorted entries', () => {
    let pins = pinSnapshot(empty, 'b');
    pins = pinSnapshot(pins, 'a');
    const list = listPins(pins);
    expect(list.length).toBe(2);
  });
});

describe('formatPins', () => {
  it('returns message when empty', () => {
    expect(formatPins(empty)).toBe('No pinned snapshots.');
  });

  it('includes snapshot name', () => {
    const pins = pinSnapshot(empty, 'prod', 'live');
    const out = formatPins(pins);
    expect(out).toContain('prod');
    expect(out).toContain('live');
  });
});
