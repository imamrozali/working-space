/**
 * End-to-End Encryption (E2EE) utilities using standard WebCrypto (AES-256-GCM).
 * Fully compatible across Node.js 19+, modern browsers, and Tauri WebViews.
 */

const cryptoSubtle = globalThis.crypto?.subtle;

function getSubtle(): SubtleCrypto {
  if (!cryptoSubtle) {
    throw new Error('WebCrypto subtle is not available in the current environment.');
  }
  return cryptoSubtle;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export interface EncryptedEnvelope {
  ciphertext: string;
  iv: string;
  version: '1.0';
}

/**
 * Derive an AES-256-GCM encryption key from pairToken using PBKDF2
 */
export async function deriveKeyFromPairToken(
  pairToken: string,
  saltStr: string = 'omni-e2ee-salt-v1'
): Promise<CryptoKey> {
  const subtle = getSubtle();
  const enc = new TextEncoder();
  const rawKeyMaterial = enc.encode(pairToken);
  const salt = enc.encode(saltStr);

  const baseKey = await subtle.importKey(
    'raw',
    rawKeyMaterial,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt arbitrary payload into an EncryptedEnvelope
 */
export async function encryptPayload(data: unknown, key: CryptoKey): Promise<EncryptedEnvelope> {
  const subtle = getSubtle();
  const enc = new TextEncoder();
  const plaintextBytes = enc.encode(JSON.stringify(data));

  // 12-byte random nonce for AES-GCM
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    plaintextBytes
  );

  return {
    ciphertext: bytesToBase64(new Uint8Array(encryptedBuffer)),
    iv: bytesToBase64(iv),
    version: '1.0',
  };
}

/**
 * Decrypt an EncryptedEnvelope back to original typed payload
 */
export async function decryptPayload<T = unknown>(
  envelope: EncryptedEnvelope,
  key: CryptoKey
): Promise<T> {
  const subtle = getSubtle();
  const dec = new TextDecoder();

  const iv = base64ToBytes(envelope.iv);
  const ciphertext = base64ToBytes(envelope.ciphertext);

  const decryptedBuffer = await subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    ciphertext as BufferSource
  );

  const decryptedText = dec.decode(decryptedBuffer);
  return JSON.parse(decryptedText) as T;
}
