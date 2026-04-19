import { encryptSnapshot, decryptSnapshot } from './encrypt-storage';
import type { Snapshot } from './storage';

const makeSnapshot = (): Snapshot => ({
  name: 'test',
  vars: { API_KEY: 'abc123', DB_PASS: 'secret' },
  createdAt: new Date().toISOString(),
  encrypted: false,
});

describe('encrypt-storage', () => {
  const passphrase = 'my-passphrase';

  it('encrypts snapshot vars', () => {
    const snap = makeSnapshot();
    const encrypted = encryptSnapshot(snap, passphrase);
    expect(encrypted.encrypted).toBe(true);
    expect(encrypted.vars.API_KEY).not.toBe('abc123');
    expect(encrypted.vars.DB_PASS).not.toBe('secret');
  });

  it('decrypts snapshot vars back to original', () => {
    const snap = makeSnapshot();
    const encrypted = encryptSnapshot(snap, passphrase);
    const decrypted = decryptSnapshot(encrypted, passphrase);
    expect(decrypted.vars).toEqual(snap.vars);
    expect(decrypted.encrypted).toBe(false);
  });

  it('decryptSnapshot is a no-op if not encrypted', () => {
    const snap = makeSnapshot();
    const result = decryptSnapshot(snap, passphrase);
    expect(result.vars).toEqual(snap.vars);
  });

  it('throws on wrong passphrase during decrypt', () => {
    const snap = makeSnapshot();
    const encrypted = encryptSnapshot(snap, passphrase);
    expect(() => decryptSnapshot(encrypted, 'wrong')).toThrow();
  });
});
