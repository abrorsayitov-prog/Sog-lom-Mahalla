// LOKAL FUNKSIYA SERVERI (upload qilinmaydi: dev/ katalogi functionDirectory
// tashqarisida). Haqiqiy functions/routes.mjs'ni xotiradagi fake-db bilan
// ishga tushiradi va /functions/v1/app/* ni eshitadi.
//
//   npm run build:sites && node dev/server.mjs 8000
//
// dist/ statig ham shu portdan beriladi, shunda brauzer tayyor SPA'ni haqiqiy
// marshrutlar orqali sinaydi (http://localhost:8000/admin).
// Ma'lumotlar xotirada: serverni to'xtatganda hammasi o'chadi.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { application } from '../functions/routes.mjs';
import { createFakeDb } from './fake-db.mjs';

const port = Number(process.argv[2] ?? 8000);
const LOCAL_ORIGIN = process.env.LOCAL_ORIGIN ?? 'https://localhost';
const dist = resolve(import.meta.dirname, '../dist');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

const db = createFakeDb();
const env = (name) => (name === 'APP_ORIGIN' ? LOCAL_ORIGIN : process.env[name] ?? null);
const handle = application({ db, env, origin: () => LOCAL_ORIGIN });

async function serveStatic(pathname, res) {
  const clean = pathname === '/' ? '/index.html' : pathname;
  const file = join(dist, normalize(clean).replace(/^([/\\])+/, ''));
  if (!file.startsWith(dist + sep)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  let body;
  try {
    body = await readFile(file);
  } catch {
    body = await readFile(join(dist, 'index.html'));
  }
  const type = MIME[extname(file)] ?? MIME[extname(join(dist, 'index.html'))];
  res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(body);
}

// Brauzer http://localhost:5173'dan Origin yuboradi; mahalliy sinov uchun uni
// sozlangan origin bilan almashtiramiz (chop etilganda bu hech qayerda yo'q).
function rewriteOrigin(request) {
  const headers = new Headers(request.headers);
  headers.set('origin', LOCAL_ORIGIN);
  return headers;
}

const server = createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const url = new URL(req.url, 'http://127.0.0.1');
  if (!url.pathname.startsWith('/functions/')) {
    await serveStatic(url.pathname, res);
    return;
  }
  const request = new Request(`https://localhost${url.pathname}`, {
    method: req.method,
    headers: rewriteOrigin(req),
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
  });
  const response = await handle({ request });
  const body = await response.text();
  const headers = {};
  for (const [name, value] of response.headers) headers[name] = value;
  const cookies = response.headers.getSetCookie?.() ?? [];
  if (cookies.length > 0) headers['set-cookie'] = cookies;
  res.writeHead(response.status, headers);
  res.end(body);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Lokal funksiya serveri: http://127.0.0.1:${port}/functions/v1/app/api/health`);
  console.log('Diqqat: xotiradagi soxta baza — chop etilgan baza emas.');
});

