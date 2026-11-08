import test, { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import type { IncomingMessage } from 'node:http';

process.env.STORAGE_API_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

const { getSafeFilePath, checkAuthorization, isExtensionAllowed } = await import('../src/storage.js');
const { STORAGE_PATH } = await import('../src/config.js');

function mockRequest(headers: Record<string, string | undefined> = {}, url: string = '/cdn/upload'): IncomingMessage {
  return {
    headers,
    url,
  } as unknown as IncomingMessage;
}

describe('web-storage security and containment', () => {
  it('resolves valid relative filenames strictly within STORAGE_PATH', () => {
    const valid = getSafeFilePath('test-file.txt');
    assert.notEqual(valid, null);
    assert.equal(valid, path.join(STORAGE_PATH, 'test-file.txt'));

    const nested = getSafeFilePath('subfolder/document.pdf');
    assert.notEqual(nested, null);
    assert.equal(nested, path.join(STORAGE_PATH, 'subfolder/document.pdf'));
  });

  it('rejects path traversal attempts with ../ and ..\\', () => {
    assert.equal(getSafeFilePath('../outside.txt'), null);
    assert.equal(getSafeFilePath('../../etc/passwd'), null);
    assert.equal(getSafeFilePath('sub/../../outside.txt'), null);
    assert.equal(getSafeFilePath('..\\..\\windows\\win.ini'), null);
  });

  it('rejects filenames containing null bytes', () => {
    assert.equal(getSafeFilePath('safe.txt\0.exe'), null);
    assert.equal(getSafeFilePath('\0/root'), null);
  });

  it('rejects empty or root-targeting paths', () => {
    assert.equal(getSafeFilePath(''), null);
    assert.equal(getSafeFilePath('.'), null);
    assert.equal(getSafeFilePath('./'), null);
  });

  it('validates authorization headers and rejects query string tokens', () => {
    const validKey = process.env.STORAGE_API_KEY!;

    // Valid X-API-Key
    assert.equal(checkAuthorization(mockRequest({ 'x-api-key': validKey })), 'ok');

    // Valid Bearer Authorization
    assert.equal(checkAuthorization(mockRequest({ authorization: `Bearer ${validKey}` })), 'ok');

    // Wrong Key
    assert.equal(checkAuthorization(mockRequest({ 'x-api-key': 'wrong-key-value-12345678901234567890' })), 'unauthorized');

    // Missing Key
    assert.equal(checkAuthorization(mockRequest({})), 'unauthorized');

    // Query string token is explicitly rejected for security
    assert.equal(checkAuthorization(mockRequest({}, `/cdn/upload?token=${validKey}`)), 'unauthorized');
  });

  it('validates file extensions against whitelist', () => {
    // Whitelisted extensions
    assert.equal(isExtensionAllowed('avatar.png'), true);
    assert.equal(isExtensionAllowed('photo.JPG'), true);
    assert.equal(isExtensionAllowed('music.mp3'), true);
    assert.equal(isExtensionAllowed('document.pdf'), true);
    assert.equal(isExtensionAllowed('data.json'), true);
    assert.equal(isExtensionAllowed('notes.txt'), true);

    // Blocked extensions (executables, scripts, malicious files)
    assert.equal(isExtensionAllowed('script.sh'), false);
    assert.equal(isExtensionAllowed('malware.exe'), false);
    assert.equal(isExtensionAllowed('payload.bat'), false);
    assert.equal(isExtensionAllowed('backdoor.php'), false);
    assert.equal(isExtensionAllowed('no-extension-file'), false);
  });
});

