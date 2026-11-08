import { useEffect, useRef, useState, useCallback } from 'react';
import { ClientType } from '../types/websocket';
import { ENV } from '../config/env';
import type {
  WSConnectionStatus,
  WSMessage,
  InitAckPayload,
  PairedSuccessPayload,
  StorageStatsPayload
} from '../types/websocket';

export const DEFAULT_SERVER_URL = ENV.DEFAULT_WS_URL;

export function useWebSocket(initialUrl: string = DEFAULT_SERVER_URL) {
  const [serverUrl, setServerUrl] = useState<string>(() => {
    return localStorage.getItem('web_ws_url') || initialUrl;
  });
  const [status, setStatus] = useState<WSConnectionStatus>('disconnected');
  const [initAck, setInitAck] = useState<InitAckPayload | null>(null);
  const [serverStorage, setServerStorage] = useState<StorageStatsPayload | null>(null);
  const [pairedSession, setPairedSession] = useState<PairedSuccessPayload | null>(null);
  const [pairError, setPairError] = useState<string | null>(null);
  const [secureMessages, setSecureMessages] = useState<Array<{ sender: string; text: string; time: string }>>([]);

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

        // Send init message as WEB client
        const initMsg: WSMessage = {
          type: 'init',
          client: ClientType.WEB,
          payload: {
            clientName: ClientType.WEB,
            version: '1.0.0',
            platform: 'Web Browser Platform'
          },
          timestamp: new Date().toISOString()
        };

        ws.send(JSON.stringify(initMsg));
      };

      ws.onmessage = (event) => {
        try {
          const data: WSMessage = JSON.parse(event.data);

          if (data.type === 'init_ack') {
            setStatus('initialized');
            const ack = data.payload as InitAckPayload;
            setInitAck(ack);
            if (ack.storage) {
              setServerStorage(ack.storage);
            }
          } else if (data.type === 'storage_stats_response') {
            setServerStorage(data.payload as StorageStatsPayload);
          } else if (data.type === 'pair_success') {
            setPairError(null);
            setPairedSession(data.payload as PairedSuccessPayload);
          } else if (data.type === 'pair_error') {
            const err = data.payload as { message: string };
            setPairError(err.message || 'Gagal melakukan pairing.');
          } else if (data.type === 'peer_disconnected') {
            setPairedSession(null);
            setPairError('Desktop partner telah terputus.');
          } else if (data.type === 'secure_message') {
            const payload = data.payload as { text?: string };
            setSecureMessages((prev) => [
              ...prev.slice(-49),
              {
                sender: data.sender || 'desktop-platform',
                text: payload?.text || JSON.stringify(payload),
                time: new Date().toLocaleTimeString()
              }
            ]);
          }
        } catch (err) {
          console.error('[web-ws] Message parse error:', err);
        }
      };

      ws.onclose = () => {
        socketRef.current = null;
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current += 1;
          const delay = Math.min(1500 * Math.pow(2, retryCountRef.current - 1), 6000);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect(targetUrl);
          }, delay);
        } else {
          setStatus('disconnected');
        }
      };

      ws.onerror = (err) => {
        console.error('[web-ws] Socket error:', err);
        setStatus('disconnected');
      };
    } catch (err) {
      console.error('[web-ws] Connection error:', err);
      setStatus('disconnected');
    }
  }, [serverUrl]);

  const disconnect = useCallback(() => {
    retryCountRef.current = MAX_RETRIES;
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
    setStatus('disconnected');
  }, []);

  const changeServerUrl = useCallback((newUrl: string) => {
    retryCountRef.current = 0;
    localStorage.setItem('web_ws_url', newUrl);
    setServerUrl(newUrl);
    setPairedSession(null);
    setPairError(null);
    connect(newUrl);
  }, [connect]);

  const submitPair = useCallback((pairCode: string, ccode?: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setPairError('WebSocket belum terhubung ke server.');
      return false;
    }

    setPairError(null);
    socketRef.current.send(JSON.stringify({
      type: 'pair_submit',
      client: ClientType.WEB,
      payload: {
        pairCode: pairCode.trim(),
        ccode: ccode ? ccode.trim() : undefined
      },
      timestamp: new Date().toISOString()
    }));
    return true;
  }, []);

  const sendSecureMessage = useCallback((text: string) => {
    if (!pairedSession || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }

    socketRef.current.send(JSON.stringify({
      type: 'secure_message',
      payload: {
        pairToken: pairedSession.pairToken,
        data: { text }
      },
      timestamp: new Date().toISOString()
    }));

    setSecureMessages((prev) => [
      ...prev.slice(-49),
      {
        sender: 'You (Web)',
        text,
        time: new Date().toLocaleTimeString()
      }
    ]);
    return true;
  }, [pairedSession]);

  const requestServerStorage = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'get_storage_stats',
        timestamp: new Date().toISOString()
      }));
    }
  }, []);

  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    serverUrl,
    changeServerUrl,
    status,
    initAck,
    serverStorage,
    requestServerStorage,
    pairedSession,
    pairError,
    secureMessages,
    submitPair,
    sendSecureMessage,
    reconnect,
    disconnect
  };
}

