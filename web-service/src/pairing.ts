import crypto from 'crypto';
import type { WebSocket } from 'ws';
import { ClientType } from './types.js';
import { ENV } from './config.js';
import { sessionStore } from './session-store.js';

export interface PendingPair {
  pairCode: string;
  slug: string;
  ccode: string;
  token: string;
  desktopClientId: string;
  desktopWs: WebSocket;
  desktopName: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
}

export interface ActivePairSession {
  sessionId: string;
  pairToken: string;
  pairCode: string;
  desktopClientId: string;
  desktopWs: WebSocket;
  webClientId: string;
  webWs: WebSocket;
  pairedAt: number;
}

const pendingPairs = new Map<string, PendingPair>(); // key: pairCode
const activeSessions = new Map<string, ActivePairSession>(); // key: pairToken
const ipAttempts = new Map<string, { count: number; resetAt: number }>();

const CODE_EXPIRY_MS = ENV.PAIR_CODE_EXPIRY_MS;
const MAX_ATTEMPTS_PER_CODE = ENV.MAX_ATTEMPTS_PER_CODE;
const RATE_LIMIT_PER_MINUTE = ENV.RATE_LIMIT_PER_MINUTE;

const ALPHANUMERIC_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function generateRandomAlphaNumeric(length: number): string {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += ALPHANUMERIC_CHARS[bytes[i] % ALPHANUMERIC_CHARS.length];
  }
  return result;
}

/**
 * Generate cryptographically secure pairing credentials
 */
export function createPairingOffer(
  desktopClientId: string,
  desktopWs: WebSocket,
  desktopName: string = 'Desktop Platform'
): PendingPair {
  // Generate random 4-char uppercase alphanumeric and 4-digit challenge number
  const randAlnum = generateRandomAlphaNumeric(4);
  const ccode = (1000 + crypto.randomInt(9000)).toString(); // 4-digit challenge code
  const pairCode = `PAIR-${randAlnum}-${ccode}`;

  const slug = `dsk-${crypto.randomBytes(2).toString('hex')}`;
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();

  const pending: PendingPair = {
    pairCode,
    slug,
    ccode,
    token,
    desktopClientId,
    desktopWs,
    desktopName,
    createdAt: now,
    expiresAt: now + CODE_EXPIRY_MS,
    attempts: 0
  };

  // Remove any previous pending offer from this desktop client
  for (const [code, item] of pendingPairs.entries()) {
    if (item.desktopClientId === desktopClientId) {
      pendingPairs.delete(code);
    }
  }

  pendingPairs.set(pairCode, pending);
  return pending;
}

/**
 * Rate limit check for pairing attempts by IP
 */
export function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipAttempts.get(ip);

  if (!record || now > record.resetAt) {
    ipAttempts.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (record.count >= RATE_LIMIT_PER_MINUTE) {
    return false;
  }

  record.count += 1;
  return true;
}

/**
 * Validate and execute pair request from web client
 */
export function attemptPair(
  rawPairCode: string,
  providedCcode: string | undefined,
  webClientId: string,
  webWs: WebSocket,
  clientIp: string
): { success: true; session: ActivePairSession; desktopPending: PendingPair } | { success: false; error: string } {
  if (!checkIpRateLimit(clientIp)) {
    return { success: false, error: 'Terlalu banyak percobaan pairing. Silakan tunggu 1 menit.' };
  }

  // Exact match only. Partial or prefix lookups would let an attacker skip the
  // alphanumeric segment and brute-force the 4-digit ccode alone.
  const normalizedCode = rawPairCode.trim().toUpperCase();
  const pending = pendingPairs.get(normalizedCode);
  const lookupKey = normalizedCode;

  if (!pending) {
    return { success: false, error: 'Kode pairing tidak valid atau tidak ditemukan.' };
  }

  if (Date.now() > pending.expiresAt) {
    pendingPairs.delete(lookupKey);
    return { success: false, error: 'Kode pairing telah kedaluwarsa. Silakan generate kode baru di Desktop.' };
  }

  // Strict challenge code (ccode) verification
  // Either explicitly provided via providedCcode OR extracted as the final segment of rawPairCode
  let inputCcode = providedCcode?.trim();
  if (!inputCcode) {
    const segments = normalizedCode.split('-');
    if (segments.length >= 3) {
      inputCcode = segments[segments.length - 1];
    }
  }

  if (!inputCcode || inputCcode !== pending.ccode) {
    pending.attempts += 1;
    if (pending.attempts >= MAX_ATTEMPTS_PER_CODE) {
      pendingPairs.delete(lookupKey);
      return { success: false, error: 'Batas percobaan terlampaui. Kode pairing dibatalkan untuk keamanan.' };
    }
    return {
      success: false,
      error: `Kode tantangan (ccode) tidak cocok atau belum diisi. Sisa kesempatan: ${MAX_ATTEMPTS_PER_CODE - pending.attempts}`
    };
  }

  if (pending.desktopWs.readyState !== pending.desktopWs.OPEN) {
    pendingPairs.delete(lookupKey);
    return { success: false, error: 'Desktop client sudah tidak terhubung.' };
  }

  // Create active session with shared secure pairToken
  const sessionId = `sess_${crypto.randomUUID()}`;
  const pairToken = crypto.randomBytes(32).toString('hex');

  const session: ActivePairSession = {
    sessionId,
    pairToken,
    pairCode: pending.pairCode,
    desktopClientId: pending.desktopClientId,
    desktopWs: pending.desktopWs,
    webClientId,
    webWs,
    pairedAt: Date.now()
  };

  activeSessions.set(pairToken, session);
  pendingPairs.delete(lookupKey);

  sessionStore.save({
    sessionId,
    pairToken,
    pairCode: pending.pairCode,
    desktopClientId: pending.desktopClientId,
    webClientId,
    pairedAt: session.pairedAt,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000
  });

  return { success: true, session, desktopPending: pending };
}

/**
 * Re-attach a disconnected socket to a recovered active session
 */
export function resumePairSession(
  pairToken: string,
  clientId: string,
  clientType: ClientType | string,
  ws: WebSocket
): { resumed: true; session: ActivePairSession; isDesktop: boolean } | { resumed: false; error: string } {
  let session = activeSessions.get(pairToken);

  if (!session) {
    const persisted = sessionStore.get(pairToken);
    if (!persisted) {
      return { resumed: false, error: 'Sesi pairing tidak ditemukan atau telah kedaluwarsa.' };
    }

    session = {
      sessionId: persisted.sessionId,
      pairToken: persisted.pairToken,
      pairCode: persisted.pairCode,
      desktopClientId: persisted.desktopClientId,
      desktopWs: ws,
      webClientId: persisted.webClientId,
      webWs: ws,
      pairedAt: persisted.pairedAt
    };
    activeSessions.set(pairToken, session);
  }

  const isDesktop = clientType === ClientType.DESKTOP || clientType === 'desktop';
  if (isDesktop) {
    session.desktopClientId = clientId;
    session.desktopWs = ws;
  } else {
    session.webClientId = clientId;
    session.webWs = ws;
  }

  return { resumed: true, session, isDesktop };
}

/**
 * Route a secure message between paired peers
 */
export function routeSecureMessage(
  pairToken: string,
  senderWs: WebSocket,
  data: unknown
): { routed: true; recipientWs: WebSocket } | { routed: false; error: string } {
  const session = activeSessions.get(pairToken);

  if (!session) {
    return { routed: false, error: 'Sesi pairing tidak valid atau telah berakhir.' };
  }

  let recipientWs: WebSocket | null = null;
  if (senderWs === session.desktopWs) {
    recipientWs = session.webWs;
  } else if (senderWs === session.webWs) {
    recipientWs = session.desktopWs;
  }

  if (!recipientWs || recipientWs.readyState !== recipientWs.OPEN) {
    return { routed: false, error: 'Partner pairing sedang offline atau koneksi terputus.' };
  }

  return { routed: true, recipientWs };
}

/**
 * Remove session when a client disconnects
 */
export function removeClientSessions(clientId: string): void {
  // Remove pending
  for (const [code, item] of pendingPairs.entries()) {
    if (item.desktopClientId === clientId) {
      pendingPairs.delete(code);
    }
  }

  // Remove active and notify peer
  for (const [token, session] of activeSessions.entries()) {
    if (session.desktopClientId === clientId || session.webClientId === clientId) {
      const isDesktop = session.desktopClientId === clientId;
      const peerWs = isDesktop ? session.webWs : session.desktopWs;

      if (peerWs && peerWs.readyState === peerWs.OPEN) {
        peerWs.send(
          JSON.stringify({
            type: 'peer_disconnected',
            payload: {
              message: `Partner (${isDesktop ? 'desktop-platform' : 'web-platform'}) telah terputus.`
            },
            timestamp: new Date().toISOString()
          })
        );
      }
      activeSessions.delete(token);
    }
  }
}

// Periodic cleanup of expired pending pairs and IP rate-limit records
setInterval(() => {
  const now = Date.now();
  for (const [code, item] of pendingPairs.entries()) {
    if (now > item.expiresAt) {
      pendingPairs.delete(code);
    }
  }

  for (const [ip, record] of ipAttempts.entries()) {
    if (now > record.resetAt) {
      ipAttempts.delete(ip);
    }
  }
}, 60000).unref();

