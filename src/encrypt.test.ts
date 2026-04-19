import { encryptData, decryptData, isEncryptedPayload, deriveKey } from './encrypt';

describe('encrypt', () => {
  const passphrase = 'test-secret-passphrase';
  const plaintext = 'API_KEY=supersecret\nDB_PASS=hunter2';

  it('encrypts and decrypts data correctly', () => {
    const encrypted = encryptData(plaintext, passphrase);
    const decrypted = decryptData(encrypted, passphrase);
    expect(decrypted).toBe(plaintext);
  });

  it('produces different ciphertext each time (random IV/salt)', () => {
    const a = encryptData(plaintext, passphrase);
    const b = encryptData(plaintext, passphrase);
    expect(a).not.toBe(b);
  });

  it('throws on wrong passphrase', () => {
    const encrypted = encryptData(plaintext, passphrase);
    expect(() => decryptData(encrypted, 'wrong-passphrase')).toThrow();
  });

  it('isEncryptedPayload returns true for encrypted data', () => {
    const encrypted = encryptData(plaintext, passphrase);
    expect(isEncryptedPayload(encrypted)).toBe(true);
  });

  it('isEncryptedPayload returns false for plain text', () => {
    expect(isEncryptedPayload('hello')).toBe(false);
    expect(isEncryptedPayload('API_KEY=value')).toBe(false);
  });

  it('deriveKey returns a 32-byte buffer', () => {
    const salt = Buffer.alloc(16, 0);
    const key = deriveKey(passphrase, salt);
    expect(key.length).toBe(32);
  });
});
