/**
 * Central Environment & Configuration for web-platform
 */
export const ENV = {
  DEFAULT_WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8080',
  DEFAULT_STORAGE_URL: import.meta.env.VITE_STORAGE_URL || 'http://localhost:9000',
  PORT: Number(import.meta.env.VITE_PORT) || 38291,
  APP_NAME: 'web-platform',
  APP_VERSION: '1.0.0',
} as const;

