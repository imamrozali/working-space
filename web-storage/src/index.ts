import http from 'http';
import { PORT, HOST, CDN_FOLDER, STORAGE_PATH, initStorageDirectory } from './config.js';
import { serveFile, handleUpload, handleListFiles, handleDeleteFile, getStorageStats } from './storage.js';

// Pastikan folder CDN terbuat
initStorageDirectory();

const server = http.createServer((req, res) => {
  // Global CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. Serve CDN file: GET /cdn/:filename
  if (req.method === 'GET' && pathname.startsWith('/cdn/')) {
    const filename = decodeURIComponent(pathname.slice('/cdn/'.length));
    serveFile(req, res, filename);
    return;
  }

  // 2. Upload file: POST /cdn/upload atau POST /upload
  if (req.method === 'POST' && (pathname === '/cdn/upload' || pathname === '/upload')) {
    handleUpload(req, res);
    return;
  }

  // 3. List files: GET /cdn atau GET /files
  if (req.method === 'GET' && (pathname === '/cdn' || pathname === '/files' || pathname === '/cdn-info')) {
    handleListFiles(res);
    return;
  }

  // 4. Delete file: DELETE /cdn/:filename
  if (req.method === 'DELETE' && pathname.startsWith('/cdn/')) {
    const filename = decodeURIComponent(pathname.slice('/cdn/'.length));
    handleDeleteFile(req, res, filename);
    return;
  }

  // 5. Health check & metadata
  if (req.method === 'GET' && (pathname === '/' || pathname === '/health' || pathname === '/storage' || pathname === '/storage-stats')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        service: 'web-storage',
        status: 'online',
        cdnFolder: CDN_FOLDER,
        storage: getStorageStats(),
        endpoints: {
          serve: 'GET /cdn/:filename',
          upload: 'POST /cdn/upload',
          list: 'GET /cdn',
          delete: 'DELETE /cdn/:filename'
        }
      })
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, HOST, () => {
  console.log(`[web-storage] Server running on http://${HOST}:${PORT}`);
  console.log(`[web-storage] CDN folder name: "${CDN_FOLDER}"`);
  console.log(`[web-storage] Physical storage path: ${STORAGE_PATH}`);
  console.log(`[web-storage] Access assets via: http://${HOST}:${PORT}/cdn/:filename`);
});

// Graceful shutdown
function shutdown() {
  console.log('\n[web-storage] Shutting down server...');
  server.close(() => {
    console.log('[web-storage] Server closed gracefully.');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

