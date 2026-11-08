import { useEffect, useRef, useState, useCallback } from 'react';
import { ClientType } from '../types/websocket';
import { ENV } from '../config/env';
import type {
  WSConnectionStatus,
  WSMessage,
  InitAckPayload,
  PairCredentialsPayload,
  PairedSuccessPayload,
  StorageStatsPayload
} from '../types/websocket';

export const DEFAULT_SERVER_URL = ENV.WS_URL;

export function useWebSocket(initialUrl: string = DEFAULT_SERVER_URL) {
  const [serverUrl, setServerUrl] = useState<string>(() => {
    return localStorage.getItem('mobile_ws_url') || initialUrl;
  });
  const [status, setStatus] = useState<WSConnectionStatus>('disconnected');
  const [initAck, setInitAck] = useState<InitAckPayload | null>(null);
  const [serverStorage, setServerStorage] = useState<StorageStatsPayload | null>(null);
  const [pairingInfo, setPairingInfo] = useState<PairCredentialsPayload | null>(null);
  const [pairedSession, setPairedSession] = useState<PairedSuccessPayload | null>(null);
  const [pairError, setPairError] = useState<string | null>(null);
  const [secureMessages, setSecureMessages] = useState<Array<{ sender: string; text: string; time: string }>>([]);
  const [messages, setMessages] = useState<WSMessage[]>([]);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef<number>(0);
  const MAX_RETRIES = 3;

  const connect = useCallback((urlToUse?: string) => {
    const targetUrl = urlToUse || serverUrl;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      socketRef.current.close();
      socketRef.current = null;
    }

    setStatus('connecting');
    setPairError(null);

    try {
      const ws = new WebSocket(targetUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        retryCountRef.current = 0;
        setStatus('connected');

        // Send init message to web-service as MOBILE client
        const initMsg: WSMessage = {
          type: 'init',
          client: ClientType.MOBILE,
          payload: {
            clientName: 'mobile-platform',
            version: '0.1.0',
            platform: 'mobile',
            metadata: {
              target: 'ios-android',
              runtime: 'tauri-v2'
            }
          }
        };
        ws.send(JSON.stringify(initMsg));
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          setMessages((prev) => [msg, ...prev.slice(0, 49)]);

          if (msg.type === 'init_ack') {
            setStatus('initialized');
            const payload = msg.payload as InitAckPayload;
            setInitAck(payload);
            if (payload?.pairing) {
              setPairingInfo(payload.pairing);
            }
            if (payload?.storage) {
              setServerStorage(payload.storage);
            }
          } else if (msg.type === 'storage_stats_response') {
            if (msg.payload) {
              setServerStorage(msg.payload as StorageStatsPayload);
            }
          } else if (msg.type === 'pair_created') {
            setPairingInfo(msg.payload as PairCredentialsPayload);
          } else if (msg.type === 'pair_success') {
            const successPayload = msg.payload as PairedSuccessPayload;
            setPairedSession(successPayload);
            setPairError(null);
          } else if (msg.type === 'pair_error') {
            const err = msg.payload as { message: string };
            setPairError(err.message || 'Verifikasi kode pairing gagal.');
          } else if (msg.type === 'secure_message') {
            const secPayload = msg.payload as { text: string; sender?: string };
            setSecureMessages((prev) => [
              {
                sender: secPayload.sender || msg.sender || 'Peer',
                text: secPayload.text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              },
              ...prev.slice(0, 49)
            ]);
          } else if (msg.type === 'peer_disconnected') {
            setPairedSession(null);
            setPairError('Koneksi perangkat peer terputus.');
          }
        } catch (err) {
          console.error('Failed to parse incoming WebSocket frame:', err);
        }
      };

      ws.onerror = () => {
        setStatus('error');
      };

      ws.onclose = () => {
        setStatus('disconnected');
        socketRef.current = null;

        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 8000);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect(targetUrl);
          }, delay);
        }
      };
    } catch {
      setStatus('error');
    }
  }, [serverUrl]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
      }
    };
  }, [connect]);

  const changeServerUrl = useCallback((newUrl: string) => {
    localStorage.setItem('mobile_ws_url', newUrl);
    setServerUrl(newUrl);
    connect(newUrl);
  }, [connect]);

  const requestNewPairCode = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'pair_request' }));
    }
  }, []);

  const submitPair = useCallback((pairCode: string, ccode?: string) => {
    setPairError(null);
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'pair_submit',
          payload: { pairCode, ccode }
        })
      );
    } else {
      setPairError('Koneksi WebSocket terputus. Silakan hubungkan ulang.');
    }
  }, []);

  const sendSecureMessage = useCallback((text: string) => {
    if (!pairedSession) return;
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'secure_message',
          token: pairedSession.pairToken,
          payload: { text }
        })
      );
      setSecureMessages((prev) => [
        {
          sender: 'You (Mobile)',
          text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        },
        ...prev.slice(0, 49)
      ]);
    }
  }, [pairedSession]);

  const requestServerStorage = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'get_storage_stats' }));
    }
  }, []);

  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    connect();
  }, [connect]);

  return {
    serverUrl,
    changeServerUrl,
    status,
    initAck,
    pairingInfo,
    pairedSession,
    pairError,
    secureMessages,
    messages,
    submitPair,
    sendSecureMessage,
    requestNewPairCode,
    reconnect,
    serverStorage,
    requestServerStorage
  };
}

