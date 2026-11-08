# WEBSOCKET PROTOCOL SPECIFICATION

Version: 1.0.0  
Status: Active  

## 1. Connection Initialization

### Client to Server: `init`
```json
{
  "type": "init",
  "client": "desktop-platform",
  "payload": {
    "clientName": "Desktop Platform",
    "version": "0.1.0",
    "platform": "Tauri Desktop"
  },
  "timestamp": "2026-11-04T14:00:00.000Z"
}
```

### Server to Client: `init_ack`
```json
{
  "type": "init_ack",
  "payload": {
    "status": "ok",
    "clientId": "e0b4a1b0-951e-4cb8-8c11-92576b5cf169",
    "serverTime": "2026-11-04T14:00:00.100Z",
    "message": "Handshake successful.",
    "pairing": {
      "pairCode": "PAIR-9K4B-4819",
      "slug": "dsk-a412",
      "ccode": "4819",
      "token": "4a7bc9...32bytesHex",
      "expiresAt": 1793801400100
    }
  },
  "timestamp": "2026-11-04T14:00:00.100Z"
}
```

## 2. Pairing Verification

### Client (Web) to Server: `pair_submit`
```json
{
  "type": "pair_submit",
  "payload": {
    "pairCode": "PAIR-9K4B-4819",
    "ccode": "4819"
  },
  "timestamp": "2026-11-04T14:01:00.000Z"
}
```

### Server to Clients: `pair_success`
Delivered to both Desktop and Web sockets upon successful authentication:
```json
{
  "type": "pair_success",
  "payload": {
    "status": "paired",
    "pairSessionId": "sess_82b3fa64-c244-42de-9442-f8ab9e52e420",
    "pairToken": "98124bce...32bytesHex",
    "peerClient": {
      "id": "e0b4a1b0-951e-4cb8-8c11-92576b5cf169",
      "clientType": "desktop-platform",
      "name": "Desktop Platform"
    },
    "message": "Terhubung dan terverifikasi secara aman!"
  },
  "timestamp": "2026-11-04T14:01:00.250Z"
}
```

## 3. Secure Messaging

### Client to Server: `secure_message`
```json
{
  "type": "secure_message",
  "payload": {
    "pairToken": "98124bce...32bytesHex",
    "data": {
      "text": "Hello from Web Platform"
    }
  },
  "timestamp": "2026-11-04T14:02:00.000Z"
}
```

### Server to Recipient: `secure_message`
```json
{
  "type": "secure_message",
  "sender": "web-platform",
  "payload": {
    "text": "Hello from Web Platform"
  },
  "timestamp": "2026-11-04T14:02:00.050Z"
}
```

## 4. Disconnection Handling: `peer_disconnected`
Sent to the active partner when either socket terminates:
```json
{
  "type": "peer_disconnected",
  "payload": {
    "message": "Partner (web-platform) telah terputus."
  },
  "timestamp": "2026-11-04T14:05:00.000Z"
}
```

