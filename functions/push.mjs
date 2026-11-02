// Web Push yuborish: VAPID (ES256 JWT) bilan bo'sh payload'li POST.
// Bo'sh payload tanlang — shunda service worker `push` hodisasida ilovaga
// borib "hozir nima vazifa tushdi" so'rovini qiladi va budilnikni shu yerda
// ovoz bilan ko'rsatadi. Bu usul push shifrlash (aes128gcm) kodini talab qilmaydi.
//
// Maxfiy qiymatlar Site Settings'da turadi: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
// VAPID_SUBJECT. Bu fayl ularning birortasini logga chiqarmaydi.
import { AppError } from './http.mjs';

const encoder = new TextEncoder();
const JWT_TTL_SECONDS = 12 * 60 * 60;

function base64ToBytes(text) {
  const normalized = String(text).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64Url(text) {
  return bytesToBase64Url(base64ToBytes(text));
}

function jsonBase64Url(value) {
  return bytesToBase64Url(encoder.encode(JSON.stringify(value)));
}

async function importPrivateKey(privateKeyB64, publicKeyB64) {
  const raw = base64ToBytes(privateKeyB64);
  const ecdsa = { name: 'ECDSA', namedCurve: 'P-256' };
  try {
    return await crypto.subtle.importKey('pkcs8', raw, ecdsa, false, ['sign']);
  } catch {
    // web-push generate-vapid-keys'ning maxfiy kaliti — xom 32 baytli d qiymati.
    if (raw.length !== 32) throw new AppError('push_config_invalid', 503);
    const point = base64ToBytes(publicKeyB64);
    if (point.length !== 65 || point[0] !== 0x04) throw new AppError('push_config_invalid', 503);
    return crypto.subtle.importKey('jwk', {
      crv: 'P-256', kty: 'EC', ext: true,
      x: bytesToBase64Url(point.subarray(1, 33)),
      y: bytesToBase64Url(point.subarray(33, 65)),
      d: bytesToBase64Url(raw),
    }, ecdsa, false, ['sign']);
  }
}

const cache = new Map();

export async function vapidConfig(env) {
  const publicKey = env('VAPID_PUBLIC_KEY');
  const privateKey = env('VAPID_PRIVATE_KEY');
  if (!publicKey || !privateKey) return null;
  const subject = env('VAPID_SUBJECT') || 'mailto:admin@soglom-mahalla.local';
  if (!/^mailto:\S+@\S+\.\S+$/.test(subject)) throw new AppError('push_config_invalid', 503);
  const cacheKey = `${publicKey}:${privateKey}`;
  const cached = cache.get(cacheKey);
  if (cached) return { ...cached, subject, publicKey };
  const key = await importPrivateKey(privateKey, publicKey);
  const stored = { key, publicB64Url: b64Url(publicKey) };
  cache.set(cacheKey, stored);
  return { ...stored, subject, publicKey };
}

function vapidHeader(endpoint, config, nowMs) {
  const header = { typ: 'JWT', alg: 'ES256' };
  const claims = {
    aud: new URL(endpoint).origin,
    exp: Math.floor(nowMs / 1000) + JWT_TTL_SECONDS,
    sub: config.subject,
  };
  const signingInput = `${jsonBase64Url(header)}.${jsonBase64Url(claims)}`;
  return { signingInput };
}

// Bir obunaga yuborish. Natija: 'sent' | 'expired' | 'failed'.
export async function sendPush(subscription, config, nowMs = Date.now()) {
  if (typeof subscription?.endpoint !== 'string' || !/^https:\/\//.test(subscription.endpoint)) {
    return { result: 'expired' };
  }
  const { signingInput } = vapidHeader(subscription.endpoint, config, nowMs);
  let signature;
  try {
    signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, config.key,
      encoder.encode(signingInput));
  } catch {
    throw new AppError('push_unavailable', 503);
  }
  const assertion = `${signingInput}.${bytesToBase64Url(new Uint8Array(signature))}`;
  try {
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        authorization: `webpush header=${assertion}`,
        'crypto-key': `p256=${config.publicB64Url}`,
        ttl: '300',
        urgent: 'yes',
      },
      body: '',
      signal: AbortSignal.timeout(8000),
    });
    if (response.ok) return { result: 'sent' };
    if (response.status === 404 || response.status === 410) {
      await response.body?.cancel();
      return { result: 'expired' };
    }
    await response.body?.cancel();
    return { result: 'failed' };
  } catch {
    return { result: 'failed' };
  }
}
