# OMNI FOUNDATION ARCHITECTURE SPECIFICATION

Version: 1.0.0  
Status: Active  

## 1. Overview

Omni Foundation is a multi-platform runtime and communication suite designed for low-latency peer-to-peer data coordination, static asset delivery, and cross-device authentication.

The workspace is organized into five independent packages:

```text
/working-space/
├── desktop-platform/    # Native Tauri v2 + React 19 local host runtime
├── mobile-platform/     # Native Tauri v2 (iOS & Android) mobile runtime (Port 1421)
├── web-platform/        # Browser-based remote client interface (Port 38291)
├── web-service/         # Centralized WebSocket session router & pairing authority (Port 8080)
├── web-storage/         # Standalone HTTP CDN static media storage (Port 9000)
└── documents/           # Architectural specifications and interface contracts
```

## 2. Package Boundaries and Responsibilities

### 2.1 Desktop Platform (`desktop-platform`)
- Technology: Tauri 2.12+, React 19, Vite 8, Rust 1.98+.
- Role: Local host device.
- Generates pairing offers via `PAIR-XXXX-YYYY`.
- Displays challenge codes (`ccode`) and device identifiers.
- Participates in secure point-to-point WebSocket communication with paired web clients.
- Centralized configuration: `src/config/env.ts`.

### 2.2 Mobile Platform (`mobile-platform`)
- Technology: Tauri 2.12+, React 19, Vite 8, Rust 1.98+ (iOS and Android targets).
- Role: Mobile client and handheld companion.
- Supports mobile safe-area insets (`env(safe-area-inset-*)`) and touch-first interactions.
- Accepts pairing codes via 8-digit segmented OTP input and generates mobile host pairing offers.
- Calls native Rust commands (`get_storage_stats`, `get_mobile_device_info`, `greet`).
- Centralized configuration: `src/config/env.ts`.

### 2.3 Web Platform (`web-platform`)
- Technology: React 19, TypeScript, Vite 8.
- Role: Remote browser client.
- Connects to the centralized WebSocket service.
- Submits pairing verification requests with pairing code and challenge code.
- Exchanges authenticated messages through verified session tokens.
- Centralized configuration: `src/config/env.ts`.

### 2.4 Web Service (`web-service`)
- Technology: Node.js 24+, TypeScript 5+, `ws` 8+.
- Default Port: 8080.
- Role: Central authority for session handshake, pairing validation, rate limiting, and message routing.
- Generates cryptographically secure pairing credentials (256-bit session tokens, random alphanumeric codes, 10-minute expiry).
- Enforces brute-force protection (maximum 5 attempts per code, 10 attempts per minute per IP).
- Centralized configuration: `src/config.ts`.

### 2.5 Web Storage (`web-storage`)
- Technology: Node.js 24+, TypeScript 5+, `mime-types`.
- Default Port: 9000.
- Role: Standalone HTTP static media server and file vault.
- Endpoints:
  - `GET /cdn/:filename`: Streams static assets with caching and ETag headers.
  - `POST /cdn/upload`: Accepts file uploads with authentication and max payload enforcement.
  - `GET /cdn` or `GET /files`: Lists files in the configured CDN folder.
  - `DELETE /cdn/:filename`: Removes files with API key authorization.
- Security: Enforces path containment to prevent path traversal attacks.
- Centralized configuration: `src/config.ts`.

## 3. Communication and Security Flow

### 3.1 Handshake & Pairing Lifecycle

```text
[ Desktop Platform ]          [ Web Service (Hub) ]          [ Web Client ]
         |                             |                            |
         | --- (1) Connect / Init ---> |                            |
         | <--- (2) InitAck + Offer -- |                            |
         |     [PAIR-XXXX-YYYY]        |                            |
         |                             | <--- (3) Connect / Init -- |
         |                             | --- (4) InitAck ---------> |
         |                             |                            |
         |                             | <--- (5) Submit Pair ----- |
         |                             |     [Code & ccode]         |
         | <--- (6) Pair Success ----- | --- (6) Pair Success ----> |
         |      [pairToken]            |      [pairToken]           |
         |                             |                            |
         | <================= (7) Secure Message =================> |
         |      (Exclusively routed via verified pairToken)         |
```

1. **Init Phase**: The desktop connects and sends an `init` message. The server creates a pending pair offer containing `pairCode`, `slug`, `ccode`, and a 10-minute expiration timestamp.
2. **Challenge Phase**: The desktop displays the credentials. The user enters or pastes the pairing code into the web platform.
3. **Verification**: The web platform submits `pair_submit`. The server validates rate limits, code expiration, and verifies the challenge code (`ccode`).
4. **Session Activation**: Upon verification, an active session is established with a unique 256-bit `pairToken`.
5. **Secure Routing**: Point-to-point messages are routed only to the paired socket. Broadcast or unauthorized socket snooping is blocked.

### 3.2 Security Protections

- **Exact-Match Pairing**: Pairing codes are looked up by exact value only. No prefix or partial matching.
- **Anti-Brute Force**: Maximum 5 failed challenge attempts per code, after which the pairing code is invalidated.
- **IP Rate Limiting**: 10 attempts per minute per IP address with periodic expired record cleanup.
- **Frame Size Limit**: `ws` rejects frames larger than `MAX_PAYLOAD_BYTES` (default 1MB) before buffering or parsing.
- **Origin Allowlist**: Browser connections must come from an origin in `ALLOWED_ORIGINS`.
- **No Broadcast**: The server never relays messages to sockets outside a verified pair session.
- **Credential-Free Logs**: Pairing codes, challenge codes, tokens, and raw message bodies are never logged.
- **Storage Isolation**: Mutating endpoints (`POST`, `DELETE`) require the `X-API-Key` header, compared in constant time. Without `STORAGE_API_KEY`, mutations are disabled (development) or the server refuses to start (production).
- **Path Traversal Guard**: File operations resolve paths strictly inside `STORAGE_PATH` using `path.relative`.

### 3.3 Known Limitations

- **No end-to-end encryption.** The server sees message content in plaintext. Transport encryption depends on deploying behind `wss://` (TLS).
- **Client type is self-declared.** The server cannot yet verify that a socket claiming `desktop-platform` is a genuine desktop install.
- **The challenge code is embedded in the pairing code** (`PAIR-XXXX-YYYY`, where `YYYY` is the ccode), so it does not add an independent second factor.
- **State is in-memory.** Pending pairs and sessions are lost on restart and cannot be shared across multiple instances.

