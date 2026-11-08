import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { deriveKeyFromPairToken, encryptPayload, decryptPayload } from '../src/crypto.js';

describe('End-to-End Encryption (E2EE) Module', () => {
  const mockPairToken = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';

  it('derives a consistent CryptoKey from pairToken', async () => {
    const key = await deriveKeyFromPairToken(mockPairToken);
    assert.notEqual(key, null);
    assert.equal(key.algorithm.name, 'AES-GCM');
    assert.equal((key.algorithm as AesKeyGenParams).length, 256);
  });

  it('encrypts and decrypts string payloads cleanly', async () => {
    const key = await deriveKeyFromPairToken(mockPairToken);
    const secretMessage = 'Halo dari Omni Desktop, ini pesan rahasia E2EE!';

    const envelope = await encryptPayload({ text: secretMessage, timestamp: Date.now() }, key);

    assert.notEqual(envelope.ciphertext, secretMessage);
    assert.equal(typeof envelope.ciphertext, 'string');
    assert.equal(typeof envelope.iv, 'string');
    assert.equal(envelope.version, '1.0');

    const decrypted = await decryptPayload<{ text: string; timestamp: number }>(envelope, key);
    assert.equal(decrypted.text, secretMessage);
  });

  it('encrypts and decrypts complex nested objects', async () => {
    const key = await deriveKeyFromPairToken(mockPairToken);
    const complexData = {
      action: 'FILE_TRANSFER',
      meta: {
        filename: 'report.pdf',
        sizeBytes: 1048576,
        tags: ['confidential', 'audit'],
      },
      authorized: true,
    };

    const envelope = await encryptPayload(complexData, key);
    const decrypted = await decryptPayload<typeof complexData>(envelope, key);

    assert.deepEqual(decrypted, complexData);
  });

  it('fails decryption when using a different pairToken', async () => {
    const keyHost = await deriveKeyFromPairToken(mockPairToken);
    const wrongToken = '0000000000000000000000000000000000000000000000000000000000000000';
    const keyAttacker = await deriveKeyFromPairToken(wrongToken);

    const envelope = await encryptPayload({ sensitive: 'credit-card-number' }, keyHost);

    await assert.rejects(
      async () => {
        await decryptPayload(envelope, keyAttacker);
      },
      /operation failed|tag mismatch|OperationError/i
    );
  });
});
