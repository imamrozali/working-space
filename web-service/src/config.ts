/**
 * Central Environment & Configuration for web-service
 */

// Dev origins: Vite web-platform (38291, 5173 legacy fallback), Tauri desktop (1420), Tauri mobile (1421), Tauri webview schemes.
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:38291',
  'http://127.0.0.1:38291',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:1420',
  'http://127.0.0.1:1420',
  'http://localhost:1421',
  'http://127.0.0.1:1421',
  'tauri://localhost',
  'http://tauri.localhost',
  'https://tauri.localhost',
];

function parseOrigins(raw: string | undefined): readonly string[] {
  if (!raw) return DEFAULT_ALLOWED_ORIGINS;
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export const ENV = {
  PORT: Number(process.env.PORT) || 8080,
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  PAIR_CODE_EXPIRY_MS: Number(process.env.PAIR_CODE_EXPIRY_MS) || 10 * 60 * 1000, // 10 minutes
  MAX_ATTEMPTS_PER_CODE: Number(process.env.MAX_ATTEMPTS_PER_CODE) || 5,
  RATE_LIMIT_PER_MINUTE: Number(process.env.RATE_LIMIT_PER_MINUTE) || 10,
  // Enforced by ws at the frame level, before any buffering or JSON parsing.
  MAX_PAYLOAD_BYTES: Number(process.env.MAX_PAYLOAD_BYTES) || 1024 * 1024,
  ALLOWED_ORIGINS: parseOrigins(process.env.ALLOWED_ORIGINS),
} as const;
