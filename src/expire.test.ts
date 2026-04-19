import { setExpiry, isExpired, filterExpired, formatExpiry } from './expire';

describe('setExpiry', () => {
  it('sets expiry from ttlSeconds', () => {
    const before = Date.now();
    const result = setExpiry('snap1', { ttlSeconds: 3600 });
    expect(result.name).toBe('snap1');
    const exp = new Date(result.expiresAt).getTime();
    expect(exp).toBeGreaterThanOrEqual(before + 3600000);
  });

  it('sets expiry from expiresAt', () => {
    const iso = '2099-01-01T00:00:00.000Z';
    const result = setExpiry('snap2', { expiresAt: iso });
    expect(result.expiresAt).toBe(iso);
  });

  it('throws if no policy provided', () => {
    expect(() => setExpiry('snap3', {})).toThrow();
  });
});

describe('isExpired', () => {
  it('returns true for past date', () => {
    expect(isExpired({ name: 'x', expiresAt: '2000-01-01T00:00:00.000Z' })).toBe(true);
  });

  it('returns false for future date', () => {
    expect(isExpired({ name: 'x', expiresAt: '2099-01-01T00:00:00.000Z' })).toBe(false);
  });
});

describe('filterExpired', () => {
  const expiries = [
    { name: 'old', expiresAt: '2000-01-01T00:00:00.000Z' },
    { name: 'new', expiresAt: '2099-01-01T00:00:00.000Z' },
  ];

  it('splits into expired and active', () => {
    const { expired, active } = filterExpired(expiries);
    expect(expired.map(e => e.name)).toEqual(['old']);
    expect(active.map(e => e.name)).toEqual(['new']);
  });
});

describe('formatExpiry', () => {
  it('shows expired for past entries', () => {
    const result = formatExpiry({ name: 'snap', expiresAt: '2000-01-01T00:00:00.000Z' });
    expect(result).toContain('expired');
  });

  it('shows time remaining for future entries', () => {
    const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const result = formatExpiry({ name: 'snap', expiresAt: future });
    expect(result).toContain('expires in');
  });
});
