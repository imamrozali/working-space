import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mime from 'mime-types';
import type { IncomingMessage, ServerResponse } from 'http';
import { STORAGE_PATH, CDN_FOLDER, STORAGE_API_KEY, MAX_UPLOAD_SIZE, ALLOWED_EXTENSIONS } from './config.js';

export function isExtensionAllowed(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase().replace(/^\./, '');
  if (!ext) return false;
  return ALLOWED_EXTENSIONS.includes(ext);
}

export function formatBytes(bytes: number): string {
  const KB = 1024;
  const MB = 1024 * KB;
  const GB = 1024 * MB;
  const TB = 1024 * GB;

  if (bytes >= TB) return `${(bytes / TB).toFixed(2)} TB`;
  if (bytes >= GB) return `${(bytes / GB).toFixed(2)} GB`;
  if (bytes >= MB) return `${(bytes / MB).toFixed(2)} MB`;
  if (bytes >= KB) return `${(bytes / KB).toFixed(2)} KB`;
  return `${bytes} B`;
}

export function getStorageStats(): {
  totalBytes: number;
  freeBytes: number;
  usedBytes: number;
  totalFormatted: string;
  freeFormatted: string;
  usedFormatted: string;
  usedPercentage: number;
  path: string;
} {
  try {
    const stat = fs.statfsSync(STORAGE_PATH);
    const blockSize = Number(stat.bsize || 4096);
    const totalBytes = Number(stat.blocks) * blockSize;
    const freeBytes = Number(stat.bavail) * blockSize;
    const usedBytes = Math.max(0, totalBytes - freeBytes);
    const usedPercentage = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 1000) / 10 : 0;

    return {
      totalBytes,
      freeBytes,
      usedBytes,
      totalFormatted: formatBytes(totalBytes),
      freeFormatted: formatBytes(freeBytes),
      usedFormatted: formatBytes(usedBytes),
      usedPercentage,
      path: CDN_FOLDER,
    };
  } catch {
    return {
      totalBytes: 0,
      freeBytes: 0,
      usedBytes: 0,
      totalFormatted: '0 B',
      freeFormatted: '0 B',
      usedFormatted: '0 B',
      usedPercentage: 0,
      path: CDN_FOLDER,
    };
  }
}

type AuthResult = 'ok' | 'disabled' | 'unauthorized';

/**
 * Validate authorization for mutations (upload and delete).
 * Accepts the key only via header: query strings leak into access logs,
 * browser history, and Referer headers.
 */
export function checkAuthorization(req: IncomingMessage): AuthResult {
  if (STORAGE_API_KEY === null) return 'disabled';

  const headerKey = req.headers['x-api-key'];
  const bearer = req.headers['authorization']?.replace(/^Bearer\s+/i, '');
  const provided = (typeof headerKey === 'string' ? headerKey : undefined) ?? bearer;
  if (!provided) return 'unauthorized';

  // Hash both sides so timingSafeEqual receives equal-length buffers regardless of input length.
  const expected = crypto.createHash('sha256').update(STORAGE_API_KEY).digest();
  const actual = crypto.createHash('sha256').update(provided).digest();
  return crypto.timingSafeEqual(expected, actual) ? 'ok' : 'unauthorized';
}

function rejectUnauthorized(res: ServerResponse, auth: Exclude<AuthResult, 'ok'>): void {
  if (auth === 'disabled') {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Mutations are disabled: STORAGE_API_KEY is not configured on the server.' }));
    return;
  }
  res.writeHead(401, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Unauthorized: valid X-API-Key header is required.' }));
}

/**
 * Validasi dan sanitasi relative path untuk mencegah serangan path traversal.
 * Menggunakan path containment check ketat dengan path.relative.
 */
export function getSafeFilePath(relativeFilePath: string): string | null {
  if (!relativeFilePath || relativeFilePath.includes('\0')) {
    return null;
  }

  // Normalize and resolve directly against STORAGE_PATH without stripping traversal attempts
  const normalized = path.normalize(relativeFilePath);
  const resolved = path.resolve(STORAGE_PATH, normalized);
  const relative = path.relative(STORAGE_PATH, resolved);

  // Path must remain strictly within STORAGE_PATH and cannot traverse outside or point to root
  if (relative.startsWith('..') || path.isAbsolute(relative) || relative === '') {
    return null;
  }

  return resolved;
}

/**
 * Handle streaming file dari storage CDN
 */
export function serveFile(req: IncomingMessage, res: ServerResponse, filename: string): void {
  const filePath = getSafeFilePath(filename);

  if (!filePath || !fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'File not found in CDN storage', filename }));
    return;
  }

  try {
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Path is a directory, not a file' }));
      return;
    }

    const contentType = mime.lookup(filePath) || 'application/octet-stream';
    const ext = path.extname(filePath).toLowerCase();
    const isDangerousMime = ['text/html', 'image/svg+xml', 'application/javascript', 'text/javascript', 'application/xml', 'text/xml'].includes(contentType);
    const isExecutableExt = ['.html', '.htm', '.xhtml', '.svg', '.xml', '.js', '.mjs', '.sh', '.bat', '.exe', '.cmd'].includes(ext);

    const responseHeaders: Record<string, string | number> = {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'public, max-age=3600, must-revalidate',
      'ETag': `"${stats.mtimeMs}-${stats.size}"`,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    };

    // Force download for active/executable types to neutralize Stored XSS
    if (isDangerousMime || isExecutableExt) {
      responseHeaders['Content-Disposition'] = `attachment; filename="${path.basename(filePath)}"`;
    }

    res.writeHead(200, responseHeaders);

    const readStream = fs.createReadStream(filePath);
    readStream.on('error', (streamErr) => {
      console.error('[web-storage] Read stream error:', streamErr);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to read file from storage' }));
      }
    });
    readStream.pipe(res);
  } catch (err) {
    console.error('[web-storage] Error reading file:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to stream CDN file' }));
  }
}

/**
 * Handle upload file ke folder CDN dengan autentikasi dan batasan ukuran
 */
export async function handleUpload(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);

  const auth = checkAuthorization(req);
  if (auth !== 'ok') {
    rejectUnauthorized(res, auth);
    return;
  }

  // Early Content-Length validation to mitigate DoS
  const contentLength = Number(req.headers['content-length'] || 0);
  if (contentLength > MAX_UPLOAD_SIZE) {
    res.writeHead(413, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: `File payload terlalu besar. Batas maksimum adalah ${MAX_UPLOAD_SIZE / (1024 * 1024)}MB.`
    }));
    return;
  }

  const headerFilename = req.headers['x-filename'] as string | undefined;
  const queryFilename = urlObj.searchParams.get('filename') || undefined;
  let targetFilename = headerFilename || queryFilename;

  const chunks: Buffer[] = [];
  let totalBytes = 0;
  let isLimitExceeded = false;

  req.on('data', (chunk: Buffer) => {
    if (isLimitExceeded) return;
    totalBytes += chunk.length;

    if (totalBytes > MAX_UPLOAD_SIZE) {
      isLimitExceeded = true;
      res.writeHead(413, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: `Upload terputus: Ukuran payload melebihi batas maksimum ${MAX_UPLOAD_SIZE / (1024 * 1024)}MB.`
      }));
      req.destroy();
      return;
    }

    chunks.push(chunk);
  });

  req.on('end', () => {
    if (isLimitExceeded) return;

    try {
      const rawBody = Buffer.concat(chunks);
      const contentType = req.headers['content-type'] || '';
      let fileBuffer = rawBody;

      // Handle JSON body payload: { filename, content, encoding }
      if (contentType.includes('application/json')) {
        const json = JSON.parse(rawBody.toString('utf8'));
        if (!json.filename || !json.content) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'JSON payload must include "filename" and "content"' }));
          return;
        }
        targetFilename = json.filename;
        const encoding = json.encoding === 'base64' ? 'base64' : 'utf8';
        fileBuffer = Buffer.from(json.content, encoding);
      }

      if (!targetFilename) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Filename is required via query (?filename=...), header (X-Filename), or JSON body'
        }));
        return;
      }

      if (!isExtensionAllowed(targetFilename)) {
        res.writeHead(415, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: `File extension not allowed. Whitelist: ${ALLOWED_EXTENSIONS.join(', ')}`
        }));
        return;
      }

      const filePath = getSafeFilePath(targetFilename);
      if (!filePath) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid filename or path traversal detected' }));
        return;
      }

      const parentDir = path.dirname(filePath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      fs.writeFileSync(filePath, fileBuffer);
      console.log(`[web-storage] Uploaded: ${targetFilename} (${fileBuffer.length} bytes) to folder "${CDN_FOLDER}"`);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        filename: targetFilename,
        cdnUrl: `/cdn/${encodeURIComponent(targetFilename).replace(/%2F/g, '/')}`,
        size: fileBuffer.length,
        folder: CDN_FOLDER
      }));
    } catch (err) {
      console.error('[web-storage] Upload processing error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to process file upload' }));
    }
  });

  req.on('error', (err) => {
    if (isLimitExceeded) return;
    console.error('[web-storage] Upload stream error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Stream error during upload' }));
  });
}

/**
 * Handle listing file dalam folder CDN
 */
export function handleListFiles(res: ServerResponse): void {
  try {
    const dirents = fs.readdirSync(STORAGE_PATH, { withFileTypes: true });
    const files = dirents
      .filter((d) => d.isFile())
      .map((d) => {
        const full = path.join(STORAGE_PATH, d.name);
        const stats = fs.statSync(full);
        return {
          filename: d.name,
          cdnUrl: `/cdn/${d.name}`,
          size: stats.size,
          mimeType: mime.lookup(d.name) || 'application/octet-stream',
          updatedAt: stats.mtime
        };
      });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      folder: CDN_FOLDER,
      totalFiles: files.length,
      files
    }));
  } catch (err) {
    console.error('[web-storage] Error listing files:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to list files' }));
  }
}

/**
 * Handle delete file dari CDN storage dengan autentikasi
 */
export function handleDeleteFile(req: IncomingMessage, res: ServerResponse, filename: string): void {
  const auth = checkAuthorization(req);
  if (auth !== 'ok') {
    rejectUnauthorized(res, auth);
    return;
  }

  const filePath = getSafeFilePath(filename);

  if (!filePath || !fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'File not found in CDN storage', filename }));
    return;
  }

  try {
    fs.unlinkSync(filePath);
    console.log(`[web-storage] Deleted file: ${filename} from folder "${CDN_FOLDER}"`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: `File ${filename} deleted`, folder: CDN_FOLDER }));
  } catch (err) {
    console.error('[web-storage] Error deleting file:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to delete file' }));
  }
}
