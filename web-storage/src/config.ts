import path from 'path';
import fs from 'fs';

/**
 * Central Environment & Configuration for web-storage
 */
export const ENV = {
  PORT: Number(process.env.PORT) || 9000,
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CDN_FOLDER: process.env.CDN_FOLDER || 'cdn-global',
  STORAGE_PATH: process.env.CDN_STORAGE_PATH
    ? path.resolve(process.env.CDN_STORAGE_PATH)
    : path.resolve(process.cwd(), process.env.CDN_FOLDER || 'cdn-global'),
  // No fallback secret. When unset, mutating endpoints (upload/delete) are disabled.
  STORAGE_API_KEY: process.env.STORAGE_API_KEY?.trim() || null,
  MAX_UPLOAD_SIZE: Number(process.env.MAX_UPLOAD_SIZE) || 50 * 1024 * 1024, // 50 MB
} as const;

const MIN_API_KEY_LENGTH = 32;

if (ENV.STORAGE_API_KEY !== null && ENV.STORAGE_API_KEY.length < MIN_API_KEY_LENGTH) {
  console.error(
    `[web-storage] STORAGE_API_KEY must be at least ${MIN_API_KEY_LENGTH} characters. ` +
      'Generate one with: openssl rand -hex 32'
  );
  process.exit(1);
}

if (ENV.STORAGE_API_KEY === null) {
  if (ENV.NODE_ENV === 'production') {
    console.error('[web-storage] STORAGE_API_KEY is required in production.');
    process.exit(1);
  }
  console.warn('[web-storage] STORAGE_API_KEY is not set: upload and delete endpoints are disabled.');
}

export const { PORT, HOST, CDN_FOLDER, STORAGE_PATH, STORAGE_API_KEY, MAX_UPLOAD_SIZE } = ENV;

export function initStorageDirectory(): void {
  if (!fs.existsSync(STORAGE_PATH)) {
    fs.mkdirSync(STORAGE_PATH, { recursive: true });
    console.log(`[web-storage] CDN folder "${CDN_FOLDER}" created at: ${STORAGE_PATH}`);
  } else {
    console.log(`[web-storage] Using existing CDN folder "${CDN_FOLDER}" at: ${STORAGE_PATH}`);
  }
}
