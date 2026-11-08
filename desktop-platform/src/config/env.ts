/**
 * Central Environment & Configuration for desktop-platform
 */
export const ENV = {
  DEFAULT_WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8080',
  DEFAULT_STORAGE_URL: import.meta.env.VITE_STORAGE_URL || 'http://localhost:9000',
  APP_NAME: 'desktop-platform',
  APP_VERSION: '0.1.0',
} as const;

