export const ClientType = {
  DESKTOP: 'desktop-platform',
  MOBILE: 'mobile-platform',
  WEB: 'web-platform',
  UNKNOWN: 'unknown'
} as const;

export type ClientType = (typeof ClientType)[keyof typeof ClientType];

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

export interface PairCredentialsPayload {
  pairCode: string;
  slug: string;
  ccode: string;
  token: string;
  expiresAt: number;
}

export interface InitPayload {
  clientType: ClientType | string;
  clientName?: string;
  version?: string;
  pairCredentials?: PairCredentialsPayload;
}

export interface InitAckPayload {
  clientId: string;
  serverTime: string;
  message: string;
  pairing?: PairCredentialsPayload;
  pairCredentials?: PairCredentialsPayload;
  storage?: StorageStatsPayload;
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
    clientType: ClientType | string;
    name?: string;
  };
  message: string;
}

export interface SecureMessagePayload<T = unknown> {
  pairToken: string;
  data: T;
}

export interface WSMessage<T = unknown> {
  type: string;
  payload?: T;
  timestamp?: string;
  sender?: string;
}

