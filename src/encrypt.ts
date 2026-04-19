import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.scryptSync(passphrase, salt, KEY_LENGTH);
}

export function encryptData(plaintext: string, passphrase: string): string {
  const salt = crypto.randomBytes(16);
  const key = deriveKey(passphrase, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const result = Buffer.concat([salt, iv, tag, encrypted]);
  return result.toString('base64');
}

export function decryptData(ciphertext: string, passphrase: string): string {
  const buf = Buffer.from(ciphertext, 'base64');
  const salt = buf.subarray(0, 16);
  const iv = buf.subarray(16, 16 + IV_LENGTH);
  const tag = buf.subarray(16 + IV_LENGTH, 16 + IV_LENGTH + TAG_LENGTH);
  const encrypted = buf.subarray(16 + IV_LENGTH + TAG_LENGTH);
  const key = deriveKey(passphrase, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

export function isEncryptedPayload(value: string): boolean {
  try {
    const buf = Buffer.from(value, 'base64');
    return buf.length > 16 + IV_LENGTH + TAG_LENGTH;
  } catch {
    return false;
  }
}
