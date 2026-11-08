/**
 * Central Environment Configuration for mobile-platform
 */
export const ENV = {
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8080',
  DEFAULT_STORAGE_URL: import.meta.env.VITE_STORAGE_URL || 'http://localhost:9000',
  DEV_PORT: Number(import.meta.env.VITE_PORT) || 1421,
  APP_NAME: 'mobile-platform',
  APP_VERSION: '0.1.0',
} as const;

