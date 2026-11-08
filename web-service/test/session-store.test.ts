import test, { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SessionStore, type PersistedSession } from '../src/session-store.js';

describe('web-service session persistence store', () => {
  const testStorePath = path.resolve(process.cwd(), 'data', 'test-sessions.json');
  let store: SessionStore;

  beforeEach(() => {
    if (fs.existsSync(testStorePath)) {
      fs.unlinkSync(testStorePath);
    }
    store = new SessionStore(testStorePath);
  });

  afterEach(() => {
    store.clear();
    if (fs.existsSync(testStorePath)) {
      fs.unlinkSync(testStorePath);
    }
  });

  it('saves and retrieves active pairing session', () => {
    const session: PersistedSession = {
      sessionId: 'sess_123',
      pairToken: 'tok_abc456',
      pairCode: 'PAIR-TEST-1234',
      desktopClientId: 'desk_1',
      webClientId: 'web_1',
      pairedAt: Date.now(),
      expiresAt: Date.now() + 60000,
    };

    store.save(session);
    const retrieved = store.get('tok_abc456');

    assert.notEqual(retrieved, undefined);
    assert.equal(retrieved?.sessionId, 'sess_123');
    assert.equal(retrieved?.pairCode, 'PAIR-TEST-1234');
    assert.equal(retrieved?.desktopClientId, 'desk_1');
  });

  it('restores sessions from disk upon store re-initialization', () => {
    const session: PersistedSession = {
      sessionId: 'sess_persisted',
      pairToken: 'tok_persist_789',
      pairCode: 'PAIR-DISK-9999',
      desktopClientId: 'desk_disk',
      webClientId: 'web_disk',
      pairedAt: Date.now(),
      expiresAt: Date.now() + 120000,
    };

    store.save(session);

    // Simulate server restart by creating a new SessionStore instance pointing to same file
    const restartedStore = new SessionStore(testStorePath);
    const recovered = restartedStore.get('tok_persist_789');

    assert.notEqual(recovered, undefined);
    assert.equal(recovered?.sessionId, 'sess_persisted');
    assert.equal(recovered?.pairCode, 'PAIR-DISK-9999');
  });

  it('automatically prunes expired sessions', () => {
    const expiredSession: PersistedSession = {
      sessionId: 'sess_expired',
      pairToken: 'tok_old_111',
      pairCode: 'PAIR-OLD-0000',
      desktopClientId: 'desk_old',
      webClientId: 'web_old',
      pairedAt: Date.now() - 50000,
      expiresAt: Date.now() - 1000, // Expired
    };

    store.save(expiredSession);
    const result = store.get('tok_old_111');
    assert.equal(result, undefined);
  });
});
