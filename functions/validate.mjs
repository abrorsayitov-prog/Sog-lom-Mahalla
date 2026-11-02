// Kiruv qiymatlarni tekshirish. Baza bilan ishlaydigan har bir maydon shu
// yerdan o'tadi: faqat ruxsat etilgan simvollar, uzunlik va format.
import { AppError } from './http.mjs';

export const ROLES = ['admin', 'doctor', 'patient'];
export const SEVERITIES = ['yengil', 'orta', 'ogir'];
export const TASK_TYPES = ['dori', 'ovqat'];
export const DOCTOR_STATUS = ['pending', 'approved', 'rejected'];
export const STANDARD_DIET_COUNT = 15;

export function isUuid(value) {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
}

export function uuid(value) {
  if (!isUuid(value)) throw new AppError('invalid_input', 400);
  return value;
}

export function str(value, max, { required = true } = {}) {
  if (value == null || value === '') {
    if (required) throw new AppError('invalid_input', 400);
    return '';
  }
  if (typeof value !== 'string') throw new AppError('invalid_input', 400);
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > max) throw new AppError('invalid_input', 400);
  return trimmed;
}

export function oneOf(value, allowed) {
  if (!allowed.includes(value)) throw new AppError('invalid_input', 400);
  return value;
}

export function int(value, min, max) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new AppError('invalid_input', 400);
  return value;
}

// Telefon kirish identifikatori sifatida ishlatiladi, shuning uchun u bitta
// ko'rinishga keltiriladi: +998XXXXXXXXX.
export function normPhone(value) {
  const raw = str(value, 24);
  const digits = raw.replace(/[^\d]/g, '');
  let national = digits;
  if (national.startsWith('998') && national.length === 12) national = national;
  else if (national.startsWith('8') && national.length === 11) national = `998${national.slice(1)}`;
  else if (national.length === 9) national = `998${national}`;
  else if (national.startsWith('0') && national.length === 10) national = `998${national.slice(1)}`;
  if (!/^998\d{9}$/.test(national)) throw new AppError('invalid_input', 400);
  return `+${national}`;
}

// Ism-familiya qidiruvi uchun silliq kalit: kichitirilgan, tipografik belgilar
// olib tashlangan.
export function nameKey(first, last) {
  const fold = (value) => String(value).toLowerCase()
    .replace(/[‘’ʼ`´]/g, '')
    .replace(/[\u040e\u045e]/g, 'yo')
    .replace(/[\u0491\u0490]/g, 'g')
    .replace(/[^a-z0-9\u0400-\u04ff\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return `${fold(first)} ${fold(last)}`;
}

export function firstName(value) {
  const name = str(value, 50);
  if (!/^[^\d\W][^\d]*$/u.test(name)) throw new AppError('invalid_input', 400);
  return name;
}

export function password(value) {
  if (typeof value !== 'string') throw new AppError('invalid_input', 400);
  const bytes = new TextEncoder().encode(value).length;
  if (value.length < 6 || value.length > 72 || bytes > 128) throw new AppError('weak_password', 400);
  return value;
}

export function loginName(value) {
  const login = str(value, 40).toLowerCase();
  if (!/^[a-z0-9._-]{3,40}$/.test(login)) throw new AppError('invalid_input', 400);
  return login;
}

export function hhmm(value) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new AppError('invalid_input', 400);
  return value;
}

export function ymd(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new AppError('invalid_input', 400);
  const parsed = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed)) throw new AppError('invalid_input', 400);
  return value;
}

export function tzMinutes(value) {
  if (value === undefined || value === null) return 300;
  return int(value, -720, 840);
}

// Funksiyada "hozir" — bemorning mahalliy vaqti (O'zbekiston sukut bo'yicha +05:00).
export function localClock(nowMs, offsetMinutes) {
  const shifted = new Date(nowMs + offsetMinutes * 60000);
  const iso = shifted.toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}
