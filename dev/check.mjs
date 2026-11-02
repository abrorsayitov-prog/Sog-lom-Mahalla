// Lokal tekshir: haqiqiy functions/routes.mjs marshrutlari dev/fake-db.mjs
// orqali bajariladi. Bu test hech qanday bulut hisobini ishlatmaydi.
// Ishga tushirish: node dev/check.mjs
import assert from 'node:assert/strict';
import { createFakeDb } from './fake-db.mjs';
import { application } from '../functions/routes.mjs';

const APP_ORIGIN = 'https://soglom-mahalla.example.qoder.site';
const TICK_TOKEN = 'test-tick-token';
const NOW = Date.UTC(2026, 10, 2, 10, 0, 0); // O'zbekistonda mahalliy 15:00

const envValues = {
  APP_ORIGIN,
  APP_TICK_TOKEN: TICK_TOKEN,
  VAPID_PUBLIC_KEY: '',
  VAPID_PRIVATE_KEY: '',
};
const env = (name) => envValues[name] ?? null;

const db = createFakeDb();
const handle = application({ db, env, origin: () => APP_ORIGIN });

const pushAttempts = [];
globalThis.fetch = async (url, init) => {
  pushAttempts.push({ url, headers: init?.headers, method: init?.method });
  if (String(url).includes('gone')) return new Response(null, { status: 410 });
  return new Response(null, { status: 201 });
};

let token = null;
let doctorToken = null;
let patientToken = null;

function request(method, path, { body, cookie, headers = {}, origin = APP_ORIGIN } = {}) {
  const all = new Headers(headers);
  all.set('host', new URL(APP_ORIGIN).host);
  if (origin) all.set('origin', origin);
  if (cookie) all.set('cookie', cookie);
  if (body !== undefined) all.set('content-type', 'application/json');
  return new Request(`${APP_ORIGIN}/functions/v1/app${path}`, {
    method, headers: all, body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function call(method, path, options) {
  const response = await handle({ request: request(method, path, options) }, NOW);
  const text = await response.text();
  let value = null;
  try { value = text ? JSON.parse(text) : null; } catch { value = text; }
  return { status: response.status, value, setCookie: response.headers.get('set-cookie') };
}

const session = (value) => {
  const match = /__Host-smh\.session=([^;]+)/.exec(value.setCookie ?? '');
  return match ? `__Host-smh.session=${match[1]}` : null;
};

const results = [];
async function step(name, fn) {
  await fn();
  results.push(name);
  console.log(`ok — ${name}`);
}

await step('config: admin yo‘qligini bildiradi', async () => {
  const result = await call('GET', '/api/config');
  assert.equal(result.status, 200);
  assert.equal(result.value.needsBootstrap, true);
  assert.equal(result.value.vapidPublicKey, null);
});

await step('bootstrap: birinchi admin yaratiladi', async () => {
  const created = await call('POST', '/api/bootstrap', { body: { login: 'admin', password: 'parol1234' } });
  assert.equal(created.status, 201);
  const again = await call('POST', '/api/bootstrap', { body: { login: 'second', password: 'parol1234' } });
  assert.equal(again.status, 409);
});

await step('login: parol xato bo‘lsa kirish yopiq', async () => {
  const bad = await call('POST', '/api/login', { body: { role: 'admin', identifier: 'admin', password: 'not-mine' } });
  assert.equal(bad.status, 401);
  const unknown = await call('POST', '/api/login', { body: { role: 'doctor', identifier: '+998901111111', password: 'not-mine' } });
  assert.equal(unknown.status, 401);
});

await step('login: admin kira oladi', async () => {
  const result = await call('POST', '/api/login', { body: { role: 'admin', identifier: 'admin', password: 'parol1234' } });
  assert.equal(result.status, 200);
  token = session(result);
  assert.ok(token, 'session cookie');
  const me = await call('GET', '/api/me', { cookie: token });
  assert.equal(me.value.role, 'admin');
});

await step('CSRF: begom origin rad etiladi', async () => {
  const result = await call('POST', '/api/admin/doctors', {
    cookie: token, origin: 'https://evil.example', body: {},
  });
  assert.equal(result.status, 403);
});

let doctorId = null;
await step('admin shifokor yaratadi (pending)', async () => {
  const created = await call('POST', '/api/admin/doctors', {
    cookie: token,
    body: { firstName: 'Dilnoza', lastName: 'Karimova', phone: '901234567', specialty: 'Terapevt', password: 'shifokor123' },
  });
  assert.equal(created.status, 201);
  doctorId = created.value.id;
  assert.equal(created.value.status, 'pending');
  assert.equal(created.value.phone, '901234567');
  assert.equal(db.tables.doctors[0].phone_key, '+998901234567');
});

await step('pending shifokor kira olmaydi', async () => {
  const result = await call('POST', '/api/login', {
    body: { role: 'doctor', identifier: '998901234567', password: 'shifokor123' },
  });
  assert.equal(result.status, 403);
  assert.equal(result.value.error, 'awaiting_approval');
});

await step('admin tasdiqlaydi va shifokor kiradi', async () => {
  const patched = await call('PATCH', `/api/admin/doctors/${doctorId}`, { cookie: token, body: { status: 'approved' } });
  assert.equal(patched.status, 200);
  assert.equal(patched.value.status, 'approved');
  const result = await call('POST', '/api/login', {
    body: { role: 'doctor', identifier: '+998 90 123 45 67', password: 'shifokor123' },
  });
  assert.equal(result.status, 200);
  doctorToken = session(result);
});

await step('rol izolyatsiyasi: admin cookie‘si shifokor marshrutini ochmaydi', async () => {
  const result = await call('GET', '/api/doctor/patients', { cookie: token });
  assert.equal(result.status, 403);
  const noCookie = await call('GET', '/api/patient/me');
  assert.equal(noCookie.status, 401);
});

let patientId = null;
let taskId = null;
await step('shifokor bemor va kunlik reja kiritadi', async () => {
  const created = await call('POST', '/api/doctor/patients', {
    cookie: doctorToken,
    body: {
      firstName: 'Anvar', lastName: 'To‘rayev', phone: '+998931112233',
      diagnosis: 'Gipertoniya', severity: 'orta', password: 'bemor123',
    },
  });
  assert.equal(created.status, 201);
  patientId = created.value.id;
  assert.equal(created.value.tzMinutes, 300);

  const task = await call('POST', `/api/doctor/patients/${patientId}/tasks`, {
    cookie: doctorToken, body: { time: '08:00', title: 'Aspirin', note: '1 tabletka', type: 'dori' },
  });
  assert.equal(task.status, 201);
  taskId = task.value.id;

  const alarm = await call('POST', `/api/doctor/patients/${patientId}/tasks`, {
    cookie: doctorToken, body: { time: '15:00', title: 'Tansiya', type: 'ovqat' },
  });
  assert.equal(alarm.status, 201);

  const list = await call('GET', '/api/doctor/patients', { cookie: doctorToken });
  assert.equal(list.value.patients.length, 1);
  assert.equal(list.value.tasks.length, 2);
});

await step('telefon band bo‘lsa ikkinchi bemor qabul qilmaydi', async () => {
  const duplicate = await call('POST', '/api/doctor/patients', {
    cookie: doctorToken,
    body: { firstName: 'Boshqa', lastName: 'Odam', phone: '931112233', password: 'bemor123' },
  });
  assert.equal(duplicate.status, 409);
});

await step('bemor o‘z jadvalini ko‘radi va vazifani belgilaydi', async () => {
  const result = await call('POST', '/api/login', {
    body: { role: 'patient', identifier: '+998931112233', password: 'bemor123' },
  });
  assert.equal(result.status, 200);
  patientToken = session(result);

  const me = await call('GET', '/api/patient/me', { cookie: patientToken });
  assert.equal(me.value.patient.id, patientId);
  assert.equal(me.value.doctor.lastName, 'Karimova');
  assert.equal(me.value.tasks.length, 2);
  assert.equal(me.value.clock.date, '2026-11-02');
  assert.equal(me.value.clock.time, '15:00');

  const on = await call('POST', '/api/patient/toggle', { cookie: patientToken, body: { taskId } });
  assert.equal(on.value.done, true);
  const off = await call('POST', '/api/patient/toggle', { cookie: patientToken, body: { taskId } });
  assert.equal(off.value.done, false);
  const again = await call('POST', '/api/patient/toggle', { cookie: patientToken, body: { taskId } });
  assert.equal(again.value.done, true);
});

await step('budilnik ro‘yxati: vaqti kelgan 15:00 vazifasi chiqadi', async () => {
  const due = await call('GET', '/api/patient/due', { cookie: patientToken });
  assert.equal(due.value.due.length, 1);
  assert.equal(due.value.due[0].title, 'Tansiya');
});

await step('boshqa bemorga tegishli vazifani belgilab bo‘lmaydi', async () => {
  const foreign = await call('POST', '/api/patient/toggle', {
    cookie: patientToken, body: { taskId: '00000000-0000-4000-8000-000000000000' },
  });
  assert.equal(foreign.status, 404);
});

await step('parhez: shifokor maxsus stol kiritadi va bemorga bog‘laydi', async () => {
  const created = await call('POST', '/api/doctor/diets', {
    cookie: doctorToken,
    body: { number: 16, payload: { title: 'Qandli diabet 16', purpose: 'Qo‘shimcha stol', allowed: ['Sut bo‘tqasi'], forbidden: ['Shirinlik'] } },
  });
  assert.equal(created.status, 201);
  const list = await call('GET', '/api/doctor/diets', { cookie: doctorToken });
  assert.equal(list.value.length, 1);

  const assigned = await call('PATCH', `/api/doctor/patients/${patientId}`, {
    cookie: doctorToken, body: { dietNumber: 10, dietId: created.value.id },
  });
  assert.equal(assigned.value.dietNumber, 10);
  const me = await call('GET', '/api/patient/me', { cookie: patientToken });
  assert.equal(me.value.customDiet.payload.title, 'Qandli diabet 16');

  const blocked = await call('DELETE', `/api/doctor/diets/${created.value.id}`, { cookie: doctorToken });
  assert.equal(blocked.status, 409);
  assert.equal(blocked.value.error, 'diet_in_use');

  const tooBig = await call('PATCH', `/api/doctor/patients/${patientId}`, {
    cookie: doctorToken, body: { dietNumber: 99 },
  });
  assert.equal(tooBig.status, 400);
});

await step('admin statistikasi va ro‘yxatlari', async () => {
  const stats = await call('GET', '/api/admin/stats', { cookie: token });
  assert.equal(stats.value.doctors, 1);
  assert.equal(stats.value.patients, 1);
  assert.equal(stats.value.alerts, 0);
  const patients = await call('GET', '/api/admin/patients', { cookie: token });
  assert.equal(patients.value[0].doctorName, 'Dilnoza Karimova');
  const alertList = await call('GET', '/api/admin/alerts', { cookie: token });
  assert.deepEqual(alertList.value, [], 'hozircha o‘tkazib yuborilgan vazifa yo‘q');
});

await step('push: obuna, tick va takrorlanish to‘siqi', async () => {
  const subscribe = await call('POST', '/api/push/subscribe', {
    cookie: patientToken, body: { endpoint: 'https://push.example/p/abc' },
  });
  assert.equal(subscribe.status, 201);

  const notConfigured = await call('POST', '/api/tick', { headers: { 'x-tick-token': TICK_TOKEN } });
  assert.equal(notConfigured.value.skipped, 'push_not_configured');
});

await step('tick VAPID bilan yuboradi va bir marta qaytaradi', async () => {
  const { webcrypto } = await import('node:crypto');
  const pair = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const rawPrivate = await webcrypto.subtle.exportKey('jwk', pair.privateKey);
  const rawPublic = await webcrypto.subtle.exportKey('jwk', pair.publicKey);
  const toBytes = (value) => {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  };
  const point = new Uint8Array(65);
  point[0] = 0x04;
  point.set(toBytes(rawPublic.x), 1);
  point.set(toBytes(rawPublic.y), 33);
  const base64Url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  envValues.VAPID_PUBLIC_KEY = base64Url(point);
  envValues.VAPID_PRIVATE_KEY = base64Url(toBytes(rawPrivate.d));

  const first = await call('POST', '/api/tick', { headers: { 'x-tick-token': TICK_TOKEN } });
  assert.equal(first.value.fired, 1);
  assert.equal(first.value.sent, 1);
  assert.equal(pushAttempts.length, 1);
  assert.match(pushAttempts[0].headers.authorization, /^webpush header=eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);

  const second = await call('POST', '/api/tick', { headers: { 'x-tick-token': TICK_TOKEN } });
  assert.equal(second.value.fired, 0, 'budilnik bir vazifa uchun bir marta');

  const wrongToken = await call('POST', '/api/tick', { headers: { 'x-tick-token': 'nope' } });
  assert.equal(wrongToken.status, 403);
});

await step('push: 410 javobida obuna o‘chiriladi', async () => {
  const late = await call('POST', `/api/doctor/patients/${patientId}/tasks`, {
    cookie: doctorToken, body: { time: '14:58', title: 'Sut', type: 'ovqat' },
  });
  assert.equal(late.status, 201);
  const alertList = await call('GET', '/api/admin/alerts', { cookie: token });
  assert.equal(alertList.value.length, 1, 'admin kechikkan vazifalarni ko‘radi');
  assert.equal(alertList.value[0].missedList[0].time, '14:58');
  await call('POST', '/api/push/subscribe', { cookie: patientToken, body: { endpoint: 'https://push.example/gone' } });
  const before = db.tables.push_subs.length;
  const result = await call('POST', '/api/tick', { headers: { 'x-tick-token': TICK_TOKEN } });
  assert.equal(result.value.fired, 1, 'oyna ichidagi yangi vazifa ham jiringlaydi');
  assert.equal(result.value.sent, 1);
  assert.equal(result.value.expired, 1);
  assert.equal(db.tables.push_subs.length, before - 1);
});

await step('vazifa o‘chirilsa bajarilgan kunlar ham o‘chadi', async () => {
  const logsBefore = db.tables.task_logs.length;
  const deleted = await call('DELETE', `/api/doctor/tasks/${taskId}`, { cookie: doctorToken });
  assert.equal(deleted.status, 200);
  assert.ok(logsBefore > 0);
  assert.equal(db.tables.task_logs.length, logsBefore - 1);
});

await step('parolni almashtirish barcha sessiyalarni yopadi', async () => {
  const changed = await call('POST', '/api/me/password', {
    cookie: patientToken, body: { current: 'bemor123', next: 'yangiparol1' },
  });
  assert.equal(changed.status, 200);
  const stale = await call('GET', '/api/patient/me', { cookie: patientToken });
  assert.equal(stale.status, 401);
  const fresh = await call('POST', '/api/login', {
    body: { role: 'patient', identifier: '+998931112233', password: 'yangiparol1' },
  });
  assert.equal(fresh.status, 200);
});

await step('urishlar soni cheklanadi (rate limit)', async () => {
  for (let index = 0; index < 9; index += 1) {
    await call('POST', '/api/login', { body: { role: 'patient', identifier: '+998931112233', password: 'not-mine' } });
  }
  const blocked = await call('POST', '/api/login', {
    body: { role: 'patient', identifier: '+998931112233', password: 'not-mine' },
  });
  assert.equal(blocked.status, 429);
});

console.log(`\n${results.length} ta tekshir o‘tdi`);
