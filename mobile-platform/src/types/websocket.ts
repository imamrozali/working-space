export const ClientType = {
  DESKTOP: 'desktop-platform',
  WEB: 'web-platform',
  MOBILE: 'mobile-platform',
  UNKNOWN: 'unknown',
} as const;

export type ClientType = (typeof ClientType)[keyof typeof ClientType];

export type WSConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'initialized' | 'error';

export interface WSMessage<T = unknown> {
  type: string;
  client?: ClientType | string;
  payload?: T;
  timestamp?: string;
  token?: string;
  sender?: string;
}

export interface InitPayload {
  clientName: ClientType | string;
  version: string;
  platform: string;
  metadata?: Record<string, unknown>;
}

export interface PairCredentialsPayload {
  pairCode: string;
  slug: string;
  ccode: string;
  token: string;
  expiresAt: number;
}

export interface PairedSuccessPayload {
  status: 'paired';
  pairSessionId: string;
  pairToken: string;
  peerClient: {
    id: string;
    clientType: ClientType;
    name: string;
  };
  message: string;
}

export interface StorageStatsPayload {
  totalBytes: number;
  freeBytes: number;
  usedBytes: number;
  totalFormatted: string;
  freeFormatted: string;
  usedFormatted: string;
  usedPercentage: number;
  path: string;
}

export interface MobileDeviceInfoPayload {
  platform: string;
  arch: string;
  family: string;
  isMobile: boolean;
  engine: string;
}

export interface InitAckPayload {
  status: 'ok' | 'error';
  clientId: string;
  clientType?: ClientType;
  message?: string;
  pairing?: PairCredentialsPayload;
  pairCredentials?: PairCredentialsPayload;
  storage?: StorageStatsPayload;
}
