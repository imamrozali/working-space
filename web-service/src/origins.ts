import { ENV } from './config.js';

export function isPrivateOrLocalHost(hostname: string): boolean {
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === 'tauri.localhost' ||
    hostname.endsWith('.local')
  ) {
    return true;
  }
  // Private IPv4 ranges: 10.0.0.0/8, 192.168.0.0/16, 172.16.0.0/12
  if (hostname.startsWith('10.') || hostname.startsWith('192.168.')) {
    return true;
  }
  const match172 = hostname.match(/^172\.(\d+)\./);
  if (match172) {
    const secondOctet = parseInt(match172[1], 10);
    if (secondOctet >= 16 && secondOctet <= 31) {
      return true;
    }
  }
  return false;
}

export function isOriginAllowed(origin?: string): boolean {
  if (!origin) return true;
  if (ENV.ALLOWED_ORIGINS.includes(origin)) return true;
  if (ENV.NODE_ENV === 'development') {
    try {
      const parsed = new URL(origin);
      if (parsed.protocol === 'tauri:' || isPrivateOrLocalHost(parsed.hostname)) {
        return true;
      }
    } catch {
      return false;
    }
  }
  return false;
}

