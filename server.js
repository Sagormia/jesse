const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = __dirname;
const port = 4173;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon'
};
const compressible = new Set(['.html', '.css', '.js', '.json', '.svg']);

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(root, urlPath);
  if (!filePath.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(filePath).toLowerCase();
    const headers = {
      'Content-Type': types[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff'
    };
    const acceptsGzip = /\bgzip\b/.test(String(req.headers['accept-encoding'] || ''));
    if (compressible.has(ext) && acceptsGzip) {
      headers['Content-Encoding'] = 'gzip';
      headers['Vary'] = 'Accept-Encoding';
      zlib.gzip(data, (zipErr, zipped) => {
        if (zipErr) { res.writeHead(200, headers); return res.end(data); }
        res.writeHead(200, headers);
        res.end(zipped);
      });
      return;
    }
    res.writeHead(200, headers);
    res.end(data);
  });
}).listen(port, () => console.log('http://localhost:' + port));
