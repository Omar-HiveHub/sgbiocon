import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import leadHandler from './api/lead.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4173);

loadLocalEnv();

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    if (url.pathname === '/api/lead') {
      await handleApi(req, res);
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Method not allowed');
      return;
    }

    const pathname = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
    const filePath = join(root, safePath);

    if (!filePath.startsWith(root) || !existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': types[extname(filePath)] || 'application/octet-stream' });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal server error');
  }
}).listen(port, () => {
  console.log(`SG Biocon dev server running at http://localhost:${port}`);
});

async function handleApi(req, nativeRes) {
  let raw = '';
  for await (const chunk of req) raw += chunk;

  if (raw) {
    try {
      req.body = JSON.parse(raw);
    } catch {
      req.body = raw;
    }
  }

  const res = createVercelResponse(nativeRes);
  await leadHandler(req, res);
}

function createVercelResponse(nativeRes) {
  let statusCode = 200;

  return {
    setHeader(name, value) {
      nativeRes.setHeader(name, value);
    },
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      nativeRes.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
      nativeRes.end(JSON.stringify(payload));
    },
    end(payload = '') {
      nativeRes.writeHead(statusCode);
      nativeRes.end(payload);
    },
  };
}

function loadLocalEnv() {
  const envPath = join(root, '.env.local');
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}
