import http from 'http';
import fs from 'node:fs';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import { ClientType } from './types.js';
import type {
  WSMessage,
  InitPayload,
  InitAckPayload,
  PairSubmitPayload,
  PairedSuccessPayload,
  SecureMessagePayload,
  StorageStatsPayload
} from './types.js';
import {
  createPairingOffer,
  attemptPair,
  routeSecureMessage,
  removeClientSessions
} from './pairing.js';
import { isOriginAllowed } from './origins.js';
import { ENV } from './config.js';

const PORT = ENV.PORT;
const HOST = ENV.HOST;

export function formatBytes(bytes: number): string {
  const KB = 1024;
  const MB = 1024 * KB;
  const GB = 1024 * MB;
  const TB = 1024 * GB;

  if (bytes >= TB) return `${(bytes / TB).toFixed(2)} TB`;
  if (bytes >= GB) return `${(bytes / GB).toFixed(2)} GB`;
  if (bytes >= MB) return `${(bytes / MB).toFixed(2)} MB`;
  if (bytes >= KB) return `${(bytes / KB).toFixed(2)} KB`;
  return `${bytes} B`;
}

export function getSystemStorageStats(targetPath: string = '.'): StorageStatsPayload {
  try {
    const stat = fs.statfsSync(targetPath);
    const blockSize = Number(stat.bsize || 4096);
    const totalBytes = Number(stat.blocks) * blockSize;
    const freeBytes = Number(stat.bavail) * blockSize;
    const usedBytes = Math.max(0, totalBytes - freeBytes);
    const usedPercentage = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 1000) / 10 : 0;

    return {
      totalBytes,
      freeBytes,
      usedBytes,
      totalFormatted: formatBytes(totalBytes),
      freeFormatted: formatBytes(freeBytes),
      usedFormatted: formatBytes(usedBytes),
      usedPercentage,
      path: targetPath,
    };
  } catch {
    return {
      totalBytes: 0,
      freeBytes: 0,
      usedBytes: 0,
      totalFormatted: '0 B',
      freeFormatted: '0 B',
      usedFormatted: '0 B',
      usedPercentage: 0,
      path: targetPath,
    };
  }
}

interface ClientSession {
  id: string;
  ws: WebSocket;
  clientType: ClientType | string;
  isAlive: boolean;
  connectedAt: Date;
  initData?: InitPayload;
  ip: string;
}

const sessions = new Map<string, ClientSession>();

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (parsedUrl.pathname === '/health' || parsedUrl.pathname === '/storage' || parsedUrl.pathname === '/storage-stats') {
    const stats = getSystemStorageStats();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        service: 'web-service',
        status: 'online',
        uptimeSeconds: Math.floor(process.uptime()),
        storage: stats,
        timestamp: new Date().toISOString()
      })
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

const wss = new WebSocketServer({
  server,
  maxPayload: ENV.MAX_PAYLOAD_BYTES,
  // Browsers always send Origin, so this blocks cross-site WebSocket hijacking.
  // Non-browser clients send no Origin and are not exposed to that attack.
  verifyClient: ({ origin }: { origin?: string }) => {
    const allowed = isOriginAllowed(origin);
    if (!allowed) {
      console.warn(`[web-service] Rejected connection from disallowed origin: ${origin}`);
    }
    return allowed;
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[web-service] HTTP & WebSocket server is running on http://${HOST}:${PORT} and ws://${HOST}:${PORT}`);
});

wss.on('connection', (ws: WebSocket, req) => {
  const clientId = randomUUID();
  const clientIp = req.socket.remoteAddress || '127.0.0.1';

  const session: ClientSession = {
    id: clientId,
    ws,
    clientType: ClientType.UNKNOWN,
    isAlive: true,
    connectedAt: new Date(),
    ip: clientIp
  };
  sessions.set(clientId, session);

  console.log(`[web-service] [${new Date().toISOString()}] New client connected (id: ${clientId}, ip: ${clientIp})`);

  // Prompt the client to initialize
  const welcomeMsg: WSMessage = {
    type: 'welcome',
    payload: {
      clientId,
      serverTime: new Date().toISOString(),
      message: 'Please send init message to establish session'
    },
    timestamp: new Date().toISOString()
  };
  ws.send(JSON.stringify(welcomeMsg));

  ws.on('pong', () => {
    session.isAlive = true;
  });

  ws.on('message', (data) => {
    let rawStr = '';
    try {
      rawStr = data.toString();
      const message: WSMessage = JSON.parse(rawStr);

      switch (message.type) {
        case 'init': {
          const payload = (message.payload || {}) as InitPayload;
          session.clientType = (message.client as ClientType) || payload.clientName || ClientType.UNKNOWN;
          session.initData = payload;

          console.log(`[web-service] [INIT] Client "${session.clientType}" (id: ${clientId})`);

          // If this is desktop-platform or mobile-platform, generate secure pairing credentials automatically
          let pairOffer = null;
          if (session.clientType === ClientType.DESKTOP || session.clientType === ClientType.MOBILE) {
            const offer = createPairingOffer(clientId, ws, payload.clientName || 'Host Platform');
            pairOffer = {
              pairCode: offer.pairCode,
              slug: offer.slug,
              ccode: offer.ccode,
              token: offer.token,
              expiresAt: offer.expiresAt
            };
            console.log(`[web-service] [PAIR_OFFER] Generated for ${session.clientType} ${clientId} (expires: ${new Date(offer.expiresAt).toISOString()})`);
          }

          const ackMsg: WSMessage<InitAckPayload> = {
            type: 'init_ack',
            timestamp: new Date().toISOString(),
            payload: {
              status: 'ok',
              clientId,
              serverTime: new Date().toISOString(),
              message: `Handshake successful. Welcome ${session.clientType} to web-service WebSocket!`,
              pairing: pairOffer || undefined,
              storage: getSystemStorageStats()
            }
          };
          ws.send(JSON.stringify(ackMsg));
          break;
        }

        case 'get_storage_stats': {
          const stats = getSystemStorageStats();
          ws.send(JSON.stringify({
            type: 'storage_stats_response',
            payload: stats,
            timestamp: new Date().toISOString()
          }));
          break;
        }

        case 'pair_request': {
          // Allow desktop or mobile host to manually regenerate a pair code if needed
          if (session.clientType !== ClientType.DESKTOP && session.clientType !== ClientType.MOBILE) {
            ws.send(JSON.stringify({
              type: 'pair_error',
              payload: { message: 'Hanya platform host (desktop atau mobile) yang dapat membuat pairing offer.' },
              timestamp: new Date().toISOString()
            }));
            break;
          }

          const offer = createPairingOffer(clientId, ws, session.initData?.clientName || 'Host Platform');
          console.log(`[web-service] [PAIR_REQUEST] New pair offer created for desktop ${clientId}`);

          ws.send(JSON.stringify({
            type: 'pair_created',
            payload: {
              pairCode: offer.pairCode,
              slug: offer.slug,
              ccode: offer.ccode,
              token: offer.token,
              expiresAt: offer.expiresAt
            },
            timestamp: new Date().toISOString()
          }));
          break;
        }

        case 'pair_submit': {
          // Web platform submits pairCode and optional ccode
          const payload = (message.payload || {}) as PairSubmitPayload;
          const { pairCode, ccode } = payload;

          if (!pairCode) {
            ws.send(JSON.stringify({
              type: 'pair_error',
              payload: { message: 'Pair code wajib diisi.' },
              timestamp: new Date().toISOString()
            }));
            break;
          }

          console.log(`[web-service] [PAIR_SUBMIT] Attempt from web ${clientId} (ip: ${session.ip})`);

          const result = attemptPair(pairCode, ccode, clientId, ws, session.ip);

          if (!result.success) {
            console.warn(`[web-service] [PAIR_FAILED] web ${clientId}: ${result.error}`);
            ws.send(JSON.stringify({
              type: 'pair_error',
              payload: { message: result.error },
              timestamp: new Date().toISOString()
            }));
            break;
          }

          const { session: activeSession, desktopPending } = result;

          console.log(`[web-service] [PAIR_SUCCESS] Paired desktop (${activeSession.desktopClientId}) with web (${activeSession.webClientId})`);

          // Notify Web Platform
          const webNotification: WSMessage<PairedSuccessPayload> = {
            type: 'pair_success',
            timestamp: new Date().toISOString(),
            payload: {
              status: 'paired',
              pairSessionId: activeSession.sessionId,
              pairToken: activeSession.pairToken,
              peerClient: {
                id: activeSession.desktopClientId,
                clientType: ClientType.DESKTOP,
                name: desktopPending.desktopName
              },
              message: 'Terhubung dan terverifikasi secara aman dengan Desktop Platform!'
            }
          };
          ws.send(JSON.stringify(webNotification));

          // Notify Desktop Platform
          const desktopNotification: WSMessage<PairedSuccessPayload> = {
            type: 'pair_success',
            timestamp: new Date().toISOString(),
            payload: {
              status: 'paired',
              pairSessionId: activeSession.sessionId,
              pairToken: activeSession.pairToken,
              peerClient: {
                id: activeSession.webClientId,
                clientType: ClientType.WEB,
                name: 'Web Platform Client'
              },
              message: 'Terhubung dan terverifikasi secara aman dengan Web Platform!'
            }
          };
          activeSession.desktopWs.send(JSON.stringify(desktopNotification));
          break;
        }

        case 'secure_message': {
          // Point-to-point secure message routed via token
          const payload = (message.payload || {}) as SecureMessagePayload;
          const { pairToken, data: innerData } = payload;

          if (!pairToken) {
            ws.send(JSON.stringify({
              type: 'secure_error',
              payload: { message: 'Pair token diperlukan untuk secure message.' },
              timestamp: new Date().toISOString()
            }));
            break;
          }

          const routeResult = routeSecureMessage(pairToken, ws, innerData);
          if (!routeResult.routed) {
            ws.send(JSON.stringify({
              type: 'secure_error',
              payload: { message: routeResult.error },
              timestamp: new Date().toISOString()
            }));
            break;
          }

          // Deliver exclusively to the paired peer
          routeResult.recipientWs.send(JSON.stringify({
            type: 'secure_message',
            sender: session.clientType,
            payload: innerData,
            timestamp: new Date().toISOString()
          }));

          // Confirm back to sender
          ws.send(JSON.stringify({
            type: 'secure_ack',
            timestamp: new Date().toISOString(),
            payload: { delivered: true }
          }));
          break;
        }

        case 'ping': {
          const pongMsg: WSMessage = {
            type: 'pong',
            timestamp: new Date().toISOString()
          };
          ws.send(JSON.stringify(pongMsg));
          break;
        }

        // Unauthenticated broadcast ('chat' / 'message') was removed: AGENTS.md 4.3
        // forbids relaying messages to sockets outside a verified pair session.
        // Clients must use 'secure_message' with a valid pairToken.

        default: {
          console.log(`[web-service] [UNKNOWN_TYPE] ${String(message.type)} from ${session.clientType} (${clientId})`);
          ws.send(
            JSON.stringify({
              type: 'unknown_ack',
              timestamp: new Date().toISOString(),
              payload: { receivedType: message.type }
            })
          );
          break;
        }
      }
    } catch (err) {
      // Raw payload is intentionally not logged: it may contain pairing codes or tokens.
      const reason = err instanceof Error ? err.message : 'unknown error';
      console.error(`[web-service] Error handling message from ${clientId} (${rawStr.length} bytes): ${reason}`);
      ws.send(
        JSON.stringify({
          type: 'error',
          payload: { message: 'Invalid JSON message' },
          timestamp: new Date().toISOString()
        })
      );
    }
  });

  ws.on('close', (code, reason) => {
    sessions.delete(clientId);
    removeClientSessions(clientId);
    console.log(
      `[web-service] [${new Date().toISOString()}] Client disconnected: ${session.clientType} (${clientId}), code: ${code}, reason: ${reason.toString() || 'none'}`
    );
  });

  ws.on('error', (err) => {
    console.error(`[web-service] WebSocket error for client ${clientId}:`, err);
  });
});

// Periodic heartbeat to detect stale clients
const heartbeatInterval = setInterval(() => {
  for (const [id, session] of sessions.entries()) {
    if (!session.isAlive) {
      console.log(`[web-service] Terminating inactive client session ${id} (${session.clientType})`);
      session.ws.terminate();
      sessions.delete(id);
      removeClientSessions(id);
      continue;
    }
    session.isAlive = false;
    session.ws.ping();
  }
}, 30000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

// Graceful shutdown
function shutdown() {
  console.log('\n[web-service] Shutting down HTTP & WebSocket server...');
  clearInterval(heartbeatInterval);
  wss.close(() => {
    server.close(() => {
      console.log('[web-service] HTTP & WebSocket server closed.');
      process.exit(0);
    });
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
