// HTTP asoslari: xato obyekti, joyli JSON o'qish, ma'lumot natijasini tekshirish.
// Bu modull brauzer bermaydigan identity'ga tayanmaydi: foydalanuvchini faqat
// ilovaning o'z sessiya-cookies'i orqali tanlaymiz (platforma hisobi ishlatilmaydi).

export class AppError extends Error {
  constructor(code, status) {
    super(code);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

const NO_STORE = { 'cache-control': 'private, no-store', 'referrer-policy': 'no-referrer' };

export function json(value, status = 200, extra = {}) {
  return Response.json(value, { status, headers: { ...NO_STORE, ...extra } });
}

export function errorJson(code, status, extra = {}) {
  return json({ error: code }, status, extra);
}

// Gateway `app` qismini fizik funksiya nomi bilan almashtiradi, Provider esa
// /functions/v1 ni oldindan qisqartirib yuborishi mumkin.
export function applicationPath(request) {
  const match = new URL(request.url).pathname.match(/^\/(?:functions\/v1\/)?(?:app|app-d[0-9a-f]{32})(\/.*)?$/);
  if (!match) throw new AppError('not_found', 404);
  return match[1] || '/';
}

// Noxavfsiz metodlar faqat saytning o'z fixed origin'idan kelishi kerak.
export function requireTrustedOrigin(request, origin) {
  let configured;
  try { configured = new URL(String(origin)); }
  catch { throw new AppError('origin_not_configured', 503); }
  if (configured.protocol !== 'https:' || configured.origin !== String(origin)) {
    throw new AppError('origin_not_configured', 503);
  }
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;
  if (request.headers.get('origin') !== String(origin)) throw new AppError('origin_forbidden', 403);
}

// Content-Length'ga ishonmaymiz: o'qilgan haqiqiy baytlar soni cheklangan.
export async function readJson(request, maxBytes = 16384) {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
    throw new AppError('invalid_input', 400);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new AppError('invalid_input', 400);
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) {
        await reader.cancel();
        throw new AppError('payload_too_large', 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new AppError('invalid_input', 400);
  }
}

// Ma'lumot bazasi xatolari barqaror ilova kodlariga aylanadi, Provider tafsiloti
// brauzerga chiqmaydi.
export function rows(result) {
  if (result?.error || !Array.isArray(result?.data)) throw new AppError('database_unavailable', 503);
  return result.data;
}

export function count(result) {
  if (result?.error || !Number.isSafeInteger(result.count) || result.count < 0) {
    throw new AppError('database_unavailable', 503);
  }
  return result.count;
}
