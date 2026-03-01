import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';

const loadKey = (): Buffer => {
  const raw = process.env.ROUTER_CREDENTIALS_KEY;

  if (!raw) {
    throw new Error('ROUTER_CREDENTIALS_KEY is not set');
  }

  const key = Buffer.from(raw, 'base64');

  if (key.length !== 32) {
    throw new Error('ROUTER_CREDENTIALS_KEY must be 32 bytes (base64)');
  }

  return key;
};

export type EncryptedPayload = {
  encrypted: string;
  iv: string;
  authTag: string;
};

export const encryptSecret = (value: string): EncryptedPayload => {
  const key = loadKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
};

export const decryptSecret = (payload: EncryptedPayload): string => {
  const key = loadKey();
  const iv = Buffer.from(payload.iv, 'base64');
  const authTag = Buffer.from(payload.authTag, 'base64');
  const decipher = createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.encrypted, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
};
