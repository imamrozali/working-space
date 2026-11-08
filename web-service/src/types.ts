export const ClientType = {
  DESKTOP: 'desktop-platform',
  WEB: 'web-platform',
  MOBILE: 'mobile-platform',
  UNKNOWN: 'unknown',
} as const;

export type ClientType = (typeof ClientType)[keyof typeof ClientType];

export interface WSMessage<T = unknown> {
  type: string;
  client?: ClientType | string;
  payload?: T;
  timestamp?: string;
  token?: string;
}

export interface InitPayload {
  clientName: string;
  version?: string;
  platform?: string;
  metadata?: Record<string, unknown>;
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

export interface InitAckPayload {
  status: 'ok' | 'error';
  clientId: string;
  serverTime: string;
  message: string;
  pairing?: PairCredentialsPayload;
  storage?: StorageStatsPayload;
}

export interface PairCredentialsPayload {
  pairCode: string; // contoh: PAIR-8F2K-7391
  slug: string;     // contoh: dsk-a8f3
  ccode: string;    // kode tantangan: 7391
  token: string;    // token socket aman
  expiresAt: number;
}

export interface PairSubmitPayload {
  pairCode: string;
  ccode?: string;
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

export interface SecureMessagePayload<T = unknown> {
  pairToken: string;
  data: T;
}
