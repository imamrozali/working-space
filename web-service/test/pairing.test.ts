import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createPairingOffer,
  attemptPair,
  checkIpRateLimit,
  routeSecureMessage,
  removeClientSessions
} from '../src/pairing.js';
import type { WebSocket } from 'ws';

function createMockSocket(): WebSocket {
  return {
    OPEN: 1,
    readyState: 1,
    send: () => {},
  } as unknown as WebSocket;
}

describe('web-service pairing module', () => {
  it('generates pairing offer conforming to PAIR-XXXX-YYYY', () => {
    const ws = createMockSocket();
    const offer = createPairingOffer('desk-client-1', ws, 'Desktop Device');

    assert.match(offer.pairCode, /^PAIR-[0-9A-Z]{4}-\d{4}$/);
    assert.match(offer.ccode, /^\d{4}$/);
    assert.equal(offer.pairCode.endsWith(`-${offer.ccode}`), true);
    assert.equal(offer.token.length, 64); // 256-bit hex
    assert.equal(offer.attempts, 0);
  });

  it('rejects prefix or truncated pairing codes', () => {
    const ws = createMockSocket();
    const offer = createPairingOffer('desk-client-2', ws, 'Desktop Device');

    const prefixResult = attemptPair('PAIR', offer.ccode, 'web-client-1', createMockSocket(), '192.168.1.1');
    assert.equal(prefixResult.success, false);

    const truncated = offer.pairCode.slice(0, 9); // PAIR-XXXX
    const truncResult = attemptPair(truncated, offer.ccode, 'web-client-1', createMockSocket(), '192.168.1.2');
    assert.equal(truncResult.success, false);
  });

  it('rejects pairing with incorrect challenge code and counts attempts', () => {
    const ws = createMockSocket();
    const offer = createPairingOffer('desk-client-3', ws, 'Desktop Device');

    const wrongCcode = offer.ccode === '9999' ? '0000' : '9999';
    const result = attemptPair(offer.pairCode, wrongCcode, 'web-client-2', createMockSocket(), '192.168.1.3');

    assert.equal(result.success, false);
    assert.equal(offer.attempts, 1);
  });

  it('invalidates pairing offer after 5 consecutive failed attempts', () => {
    const ws = createMockSocket();
    const offer = createPairingOffer('desk-client-4', ws, 'Desktop Device');
    const wrongCcode = offer.ccode === '9999' ? '0000' : '9999';

    for (let i = 0; i < 4; i++) {
      const res = attemptPair(offer.pairCode, wrongCcode, `web-${i}`, createMockSocket(), `192.168.2.${i}`);
      assert.equal(res.success, false);
    }

    // 5th attempt invalidates
    const finalFail = attemptPair(offer.pairCode, wrongCcode, 'web-5', createMockSocket(), '192.168.2.5');
    assert.equal(finalFail.success, false);

    // Subsequent exact match now fails because code was purged
    const afterPurge = attemptPair(offer.pairCode, offer.ccode, 'web-after', createMockSocket(), '192.168.2.6');
    assert.equal(afterPurge.success, false);
  });

  it('successfully pairs when exact credentials are provided', () => {
    const desktopWs = createMockSocket();
    const webWs = createMockSocket();
    const offer = createPairingOffer('desk-client-5', desktopWs, 'Desktop 5');

    const result = attemptPair(offer.pairCode, offer.ccode, 'web-client-5', webWs, '192.168.3.1');
    assert.equal(result.success, true);

    if (result.success) {
      assert.equal(result.session.desktopClientId, 'desk-client-5');
      assert.equal(result.session.webClientId, 'web-client-5');
      assert.equal(result.session.pairToken.length, 64);

      // Verify routing through the authenticated pairToken
      const routeFromDesktop = routeSecureMessage(result.session.pairToken, desktopWs, 'hello web');
      assert.equal(routeFromDesktop.routed, true);
      if (routeFromDesktop.routed) {
        assert.equal(routeFromDesktop.recipientWs, webWs);
      }

      const routeFromWeb = routeSecureMessage(result.session.pairToken, webWs, 'hello desktop');
      assert.equal(routeFromWeb.routed, true);
      if (routeFromWeb.routed) {
        assert.equal(routeFromWeb.recipientWs, desktopWs);
      }
    }
  });

  it('enforces IP rate limiting on repeated attempts', () => {
    const testIp = '10.99.88.77';
    let allowedCount = 0;

    for (let i = 0; i < 20; i++) {
      if (checkIpRateLimit(testIp)) {
        allowedCount++;
      }
    }

    assert.equal(allowedCount, 10);
  });
});

