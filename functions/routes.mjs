// Biznes marshrutlari: kirish, shifokorlar, bemorlar, kunlik reja, parhezlar,
// Web Push obunasi va budilnik "tick" uchi.
//
// Barcha ruxsatlar shu yerda tekshiriladi. Browser hech qachon owner id, rol yoki
// predikat yubormaydi — ular faqat tasdiqlangan sessiyadan olinadi.
import { AppError, applicationPath, errorJson, json, readJson, requireTrustedOrigin, rows } from './http.mjs';
import {
  DOCTOR_STATUS, SEVERITIES, STANDARD_DIET_COUNT, TASK_TYPES,
  firstName, hhmm, int, localClock, loginName, nameKey, normPhone, oneOf,
  password, str, tzMinutes, uuid,
} from './validate.mjs';
import { PASSWORD_COLUMNS, hashPassword, timingSafeEqual, verifyPassword, verifyPasswordAgainstDummy } from './passwords.mjs';
import {
  SESSION_TTL_SECONDS, clearSessionCookie, createSession, revokePrincipalSessions,
  revokeSession, sessionCookie, validateSession,
} from './sessions.mjs';
import { consume } from './limiter.mjs';
import { sendPush, vapidConfig } from './push.mjs';

const LIST_LIMIT = 200;
const PLAN_LIMIT = 2000;
const TICK_PATIENT_LIMIT = 500;
const DEFAULT_TZ = 300;

class LoginRequired extends Error {
  constructor(state) { super('login_required'); this.state = state; }
}

const retryAfter = (result) => ({ 'retry-after': String(Math.max(1, Math.ceil(result.retryAfterMs / 1000))) });

function unauthorized(state) {
  return state === 'invalid'
    ? errorJson('login_required', 401, { 'set-cookie': clearSessionCookie() })
    : errorJson('login_required', 401);
}

async function sessionFor(db, request) {
  const result = await validateSession(db, request);
  if (result.state !== 'valid') throw new LoginRequired(result.state);
  return result.session;
}

// Rol mos kelmasa sessiya butunlay yetarli emas: maqsadli panelning o'zi kerak.
async function requireRole(db, request, role) {
  const session = await sessionFor(db, request);
  if (session.role !== role) throw new AppError('forbidden', 403);
  return session;
}

const DOCTOR_PUBLIC = 'id,first_name,last_name,phone,specialty,status,created_at';
const PATIENT_PUBLIC = 'id,doctor_id,first_name,last_name,phone,diagnosis,severity,diet_number,diet_id,tz_minutes,created_at';
const TASK_COLUMNS = 'id,patient_id,time_text,title,note,task_type,remind';

function doctorView(row) {
  return {
    id: row.id, firstName: row.first_name, lastName: row.last_name, phone: row.phone,
    specialty: row.specialty, status: row.status, createdAt: row.created_at,
  };
}

function patientView(row) {
  return {
    id: row.id, doctorId: row.doctor_id, firstName: row.first_name, lastName: row.last_name,
    phone: row.phone, diagnosis: row.diagnosis, severity: row.severity,
    dietNumber: row.diet_number ?? null, dietId: row.diet_id ?? null,
    tzMinutes: row.tz_minutes, createdAt: row.created_at,
  };
}

function taskView(row) {
  return {
    id: row.id, patientId: row.patient_id, time: row.time_text, title: row.title,
    note: row.note, type: row.task_type, remind: row.remind,
  };
}

async function loadPatient(db, patientId) {
  const found = rows(await db.from('patients').select(PATIENT_PUBLIC).eq('id', patientId).limit(1));
  if (found.length !== 1) throw new AppError('not_found', 404);
  return found[0];
}

async function loadOwnPatient(db, doctorId, patientId) {
  const patient = await loadPatient(db, patientId);
  if (patient.doctor_id !== doctorId) throw new AppError('not_found', 404);
  return patient;
}

// Ro'yxatlarni ikki so'rov bilan olamiz (bemor id'lari bo'yicha guruhlangan),
// har bir bemor uchun alohida so'rov yubormaymiz.
async function loadPlan(db, patientIds) {
  if (patientIds.length === 0) return { tasks: [], logs: [] };
  const tasks = rows(await db.from('tasks').select(TASK_COLUMNS)
    .in('patient_id', patientIds).order('time_text').limit(PLAN_LIMIT));
  const logs = rows(await db.from('task_logs').select('task_id,patient_id,done_date')
    .in('patient_id', patientIds).limit(PLAN_LIMIT));
  return { tasks, logs };
}

function planPayload(tasks, logs, serverNow) {
  return {
    tasks: tasks.map(taskView),
    logs: logs.map((row) => ({ taskId: row.task_id, patientId: row.patient_id, doneDate: row.done_date })),
    serverNow,
  };
}

// ---- kirish / akkaunt -------------------------------------------------------

const ACCOUNT_TABLE = { admin: 'admins', doctor: 'doctors', patient: 'patients' };
const SECRET_COLUMNS = 'id,password_salt,password_hash,password_iterations';

async function findAccount(db, role, identifier) {
  const column = role === 'admin' ? 'login' : 'phone_key';
  const columns = role === 'doctor' ? `id,status,${SECRET_COLUMNS.slice(3)}` : SECRET_COLUMNS;
  return rows(await db.from(ACCOUNT_TABLE[role]).select(columns).eq(column, identifier).limit(1));
}

async function login(db, request) {
  const body = await readJson(request);
  const role = oneOf(body?.role, ['admin', 'doctor', 'patient']);
  const identifier = role === 'admin' ? loginName(body?.identifier) : normPhone(body?.identifier);

  const limit = await consume(db, 'login', `${role}:${identifier}`);
  if (!limit.allowed) return errorJson('rate_limited', 429, retryAfter(limit));

  const raw = body?.password;
  if (typeof raw !== 'string' || raw.length > 256) throw new AppError('invalid_input', 400);
  const passwordValue = raw;
  const found = await findAccount(db, role, identifier);
  if (found.length !== 1) {
    await verifyPasswordAgainstDummy(passwordValue);
    return errorJson('invalid_credentials', 401);
  }
  const account = found[0];
  const ok = await verifyPassword(passwordValue, {
    salt: account.password_salt, hash: account.password_hash, iterations: account.password_iterations,
  });
  if (!ok) return errorJson('invalid_credentials', 401);

  if (role === 'doctor' && account.status !== 'approved') {
    return errorJson(account.status === 'pending' ? 'awaiting_approval' : 'account_blocked', 403);
  }

  const { token } = await createSession(db, role, account.id);
  return json({ role, id: account.id }, 200, { 'set-cookie': sessionCookie(token, SESSION_TTL_SECONDS) });}

async function logout(db, request) {
  const result = await validateSession(db, request);
  if (result.state === 'valid' && result.session) {
    try {
      await revokeSession(db, result.session.digest);
    } catch {
      return errorJson('logout_unconfirmed', 503);
    }
  }
  return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie() });
}

// Birinchi admin: admins jadvali bo'sh bo'lganda va faqat shunda ochiq.
async function bootstrap(db, request) {
  const body = await readJson(request);
  const login = loginName(body?.login);
  const passwordValue = password(body?.password);
  const existing = rows(await db.from('admins').select('id').limit(1));
  if (existing.length > 0) throw new AppError('already_initialized', 409);
  const limit = await consume(db, 'write', `bootstrap:${login}`);
  if (!limit.allowed) return errorJson('rate_limited', 429, retryAfter(limit));

  const derived = await hashPassword(passwordValue);
  const id = crypto.randomUUID();
  const created = rows(await db.from('admins').insertIfAbsent({
    id, login, password_salt: derived.salt, password_hash: derived.hash,
    password_iterations: derived.iterations, created_at: new Date().toISOString(),
  }, { onConflict: 'login' }).select('id'));
  if (created.length !== 1) throw new AppError('already_initialized', 409);
  return json({ id, login }, 201);
}

async function changeOwnPassword(db, request) {
  const session = await sessionFor(db, request);
  const body = await readJson(request);
  const next = password(body?.next);
  const table = ACCOUNT_TABLE[session.role];
  const found = rows(await db.from(table).select(PASSWORD_COLUMNS).eq('id', session.principalId).limit(1));
  if (found.length !== 1) throw new AppError('not_found', 404);
  const current = found[0];
  const ok = await verifyPassword(typeof body?.current === 'string' ? body.current : '', {
    salt: current.password_salt, hash: current.password_hash, iterations: current.password_iterations,
  });
  if (!ok) throw new AppError('invalid_credentials', 401);
  const derived = await hashPassword(next);
  const updated = rows(await db.from(table)
    .update({ password_salt: derived.salt, password_hash: derived.hash, password_iterations: derived.iterations })
    .eq('id', session.principalId).select('id'));
  if (updated.length !== 1) throw new AppError('write_conflict', 409);
  // Eski sessiyalar bekor qilinadi: parol o'zgargach qurilmalar qaytadan kiradi.
  await revokePrincipalSessions(db, session.role, session.principalId);
  return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie() });
}

// ---- admin ------------------------------------------------------------------

async function adminDoctors(db) {
  const found = rows(await db.from('doctors').select(DOCTOR_PUBLIC)
    .order('created_at', { ascending: false }).limit(LIST_LIMIT));
  return found.map(doctorView);
}

async function adminCreateDoctor(db, request) {
  const body = await readJson(request);
  const derived = await hashPassword(password(body?.password));
  const id = crypto.randomUUID();
  const row = {
    id,
    first_name: firstName(body?.firstName),
    last_name: firstName(body?.lastName),
    phone: str(body?.phone, 24),
    phone_key: normPhone(body?.phone),
    specialty: str(body?.specialty, 60, { required: false }),
    status: 'pending',
    password_salt: derived.salt,
    password_hash: derived.hash,
    password_iterations: derived.iterations,
    created_at: new Date().toISOString(),
  };
  row.name_key = nameKey(row.first_name, row.last_name);
  const created = rows(await db.from('doctors').insertIfAbsent(row, { onConflict: 'phone_key' }).select('id'));
  if (created.length !== 1) throw new AppError('phone_taken', 409);
  return json(doctorView(row), 201);
}

function doctorPatch(body) {
  const patch = {};
  if (body?.firstName !== undefined) patch.first_name = firstName(body.firstName);
  if (body?.lastName !== undefined) patch.last_name = firstName(body.lastName);
  if (body?.phone !== undefined) { patch.phone = str(body.phone, 24); patch.phone_key = normPhone(body.phone); }
  if (body?.specialty !== undefined) patch.specialty = str(body.specialty, 60, { required: false });
  if (body?.status !== undefined) patch.status = oneOf(body.status, DOCTOR_STATUS);
  return patch;
}

async function adminPatchDoctor(db, doctorId, request) {
  const body = await readJson(request);
  const patch = doctorPatch(body);
  const nextPassword = body?.password === undefined ? null : password(body.password);
  if (Object.keys(patch).length === 0 && !nextPassword) throw new AppError('invalid_input', 400);
  if (patch.first_name || patch.last_name) {
    const current = rows(await db.from('doctors').select('first_name,last_name').eq('id', doctorId).limit(1));
    if (current.length !== 1) throw new AppError('not_found', 404);
    patch.name_key = nameKey(patch.first_name ?? current[0].first_name, patch.last_name ?? current[0].last_name);
  }
  if (nextPassword) {
    const derived = await hashPassword(nextPassword);
    patch.password_salt = derived.salt; patch.password_hash = derived.hash; patch.password_iterations = derived.iterations;
  }
  const updated = rows(await db.from('doctors').update(patch).eq('id', doctorId).select(DOCTOR_PUBLIC));
  if (updated.length !== 1) throw new AppError('write_conflict', 409);
  if (nextPassword) await revokePrincipalSessions(db, 'doctor', doctorId);
  return json(doctorView(updated[0]));
}

async function adminDeleteDoctor(db, doctorId) {
  const patients = rows(await db.from('patients').select('id').eq('doctor_id', doctorId).limit(1));
  if (patients.length > 0) throw new AppError('doctor_has_patients', 409);
  const deleted = rows(await db.from('doctors').delete().eq('id', doctorId).select('id'));
  if (deleted.length !== 1) throw new AppError('not_found', 404);
  await revokePrincipalSessions(db, 'doctor', doctorId);
  return json({ ok: true });
}

async function adminPatients(db) {
  const found = rows(await db.from('patients').select(PATIENT_PUBLIC)
    .order('created_at', { ascending: false }).limit(LIST_LIMIT));
  const doctorIds = [...new Set(found.map((row) => row.doctor_id))];
  const doctors = doctorIds.length === 0 ? [] : rows(await db.from('doctors')
    .select('id,first_name,last_name').in('id', doctorIds).limit(LIST_LIMIT));
  const names = new Map(doctors.map((d) => [d.id, `${d.first_name} ${d.last_name}`]));
  return found.map((row) => ({ ...patientView(row), doctorName: names.get(row.doctor_id) ?? '' }));
}

// Bitta borishda bemorning mahalliy jadvali bo'yicha "o'tkazib yuborilgan" ni
// hisoblaymiz: bugun belgilanmagan va vaqti o'tgan vazifa borimi.
function missedByPatient(patients, tasks, logs, nowMs) {
  const byPatient = new Map();
  for (const patient of patients) {
    const clock = localClock(nowMs, patient.tz_minutes);
    const done = new Set(logs
      .filter((log) => log.patient_id === patient.id && log.done_date === clock.date)
      .map((log) => log.task_id));
    const own = tasks.filter((task) => task.patient_id === patient.id);
    const missed = own.filter((task) => !done.has(task.id) && task.time_text < clock.time);
    byPatient.set(patient.id, {
      total: own.length,
      done: own.length - missed.length,
      missed: missed.length,
      missedList: missed.map((task) => ({ time: task.time_text, title: task.title })),
    });
  }
  return byPatient;
}

async function adminStats(db, request, nowMs) {
  await requireRole(db, request, 'admin');
  const doctors = await adminDoctors(db);
  const patients = rows(await db.from('patients').select(PATIENT_PUBLIC).limit(LIST_LIMIT));
  const { tasks, logs } = await loadPlan(db, patients.map((row) => row.id));
  const summary = missedByPatient(patients, tasks, logs, nowMs);
  let alerts = 0, completed = 0;
  for (const state of summary.values()) {
    if (state.missed > 0) alerts += 1;
    if (state.total > 0 && state.done === state.total) completed += 1;
  }
  return json({
    doctors: doctors.length,
    pending: doctors.filter((row) => row.status === 'pending').length,
    patients: patients.length,
    severe: patients.filter((row) => row.severity === 'ogir').length,
    completedToday: completed,
    alerts,
  });
}

async function adminAlerts(db, request, nowMs) {
  await requireRole(db, request, 'admin');
  const list = await adminPatients(db);
  const { tasks, logs } = await loadPlan(db, list.map((row) => row.id));
  const summary = missedByPatient(
    list.map((row) => ({ id: row.id, tz_minutes: row.tzMinutes })), tasks, logs, nowMs);
  return json(list
    .map((row) => ({ patient: row, ...(summary.get(row.id) ?? { missedList: [] }) }))
    .filter((row) => row.missedList.length > 0));
}

// ---- shifokor ---------------------------------------------------------------

async function doctorPatients(db, doctorId, nowMs) {
  const found = rows(await db.from('patients').select(PATIENT_PUBLIC)
    .eq('doctor_id', doctorId).order('created_at', { ascending: false }).limit(LIST_LIMIT));
  const { tasks, logs } = await loadPlan(db, found.map((row) => row.id));
  return json({
    patients: found.map(patientView),
    ...planPayload(tasks, logs, nowMs),
  });
}

async function doctorCreatePatient(db, doctorId, request) {
  const body = await readJson(request);
  const derived = await hashPassword(password(body?.password));
  const id = crypto.randomUUID();
  const row = {
    id,
    doctor_id: doctorId,
    first_name: firstName(body?.firstName),
    last_name: firstName(body?.lastName),
    phone: str(body?.phone, 24),
    phone_key: normPhone(body?.phone),
    diagnosis: str(body?.diagnosis, 120, { required: false }),
    severity: body?.severity === undefined ? 'yengil' : oneOf(body.severity, SEVERITIES),
    diet_number: null,
    diet_id: null,
    tz_minutes: tzMinutes(body?.tzMinutes),
    password_salt: derived.salt,
    password_hash: derived.hash,
    password_iterations: derived.iterations,
    created_at: new Date().toISOString(),
  };
  row.name_key = nameKey(row.first_name, row.last_name);
  const created = rows(await db.from('patients').insertIfAbsent(row, { onConflict: 'phone_key' }).select('id'));
  if (created.length !== 1) throw new AppError('phone_taken', 409);
  return json(patientView(row), 201);
}

function dietFields(body) {
  const patch = {};
  if (body?.dietNumber !== undefined) {
    patch.diet_number = body.dietNumber === null ? null : int(body.dietNumber, 1, STANDARD_DIET_COUNT);
  }
  if (body?.dietId !== undefined) {
    patch.diet_id = body.dietId === null ? null : uuid(body.dietId);
  }
  return patch;
}

async function doctorPatchPatient(db, doctorId, patientId, request) {
  const body = await readJson(request);
  const existing = await loadOwnPatient(db, doctorId, patientId);
  const patch = {};
  if (body?.firstName !== undefined) patch.first_name = firstName(body.firstName);
  if (body?.lastName !== undefined) patch.last_name = firstName(body.lastName);
  if (body?.phone !== undefined) { patch.phone = str(body.phone, 24); patch.phone_key = normPhone(body.phone); }
  if (body?.diagnosis !== undefined) patch.diagnosis = str(body.diagnosis, 120, { required: false });
  if (body?.severity !== undefined) patch.severity = oneOf(body.severity, SEVERITIES);
  if (body?.tzMinutes !== undefined) patch.tz_minutes = tzMinutes(body.tzMinutes);
  Object.assign(patch, dietFields(body));
  if (body?.password !== undefined) {
    const derived = await hashPassword(password(body.password));
    patch.password_salt = derived.salt; patch.password_hash = derived.hash; patch.password_iterations = derived.iterations;
  }
  if (patch.first_name || patch.last_name) {
    patch.name_key = nameKey(patch.first_name ?? existing.first_name, patch.last_name ?? existing.last_name);
  }
  if (patch.diet_id) {
    const diets = rows(await db.from('diets').select('id').eq('id', patch.diet_id).eq('doctor_id', doctorId).limit(1));
    if (diets.length !== 1) throw new AppError('invalid_input', 400);
  }
  if (Object.keys(patch).length === 0) throw new AppError('invalid_input', 400);
  const updated = rows(await db.from('patients').update(patch).eq('id', patientId)
    .eq('doctor_id', doctorId).select(PATIENT_PUBLIC));
  if (updated.length !== 1) throw new AppError('write_conflict', 409);
  if (patch.password_hash) await revokePrincipalSessions(db, 'patient', patientId);
  return json(patientView(updated[0]));
}

async function doctorDeletePatient(db, doctorId, patientId) {
  await loadOwnPatient(db, doctorId, patientId);
  // Ketma-ket tozalash: vazifalar, bajarilgan kunlar, obunalar va budilnik yozuvlari.
  const tasks = rows(await db.from('tasks').select('id').eq('patient_id', patientId).limit(PLAN_LIMIT));
  for (const task of tasks) {
    rows(await db.from('task_logs').delete().eq('task_id', task.id).select('id'));
  }
  rows(await db.from('tasks').delete().eq('patient_id', patientId).select('id'));
  rows(await db.from('push_subs').delete().eq('patient_id', patientId).select('id'));
  rows(await db.from('push_fires').delete().eq('patient_id', patientId).select('id'));
  const deleted = rows(await db.from('patients').delete().eq('id', patientId).eq('doctor_id', doctorId).select('id'));
  if (deleted.length !== 1) throw new AppError('write_conflict', 409);
  await revokePrincipalSessions(db, 'patient', patientId);
  return json({ ok: true });
}

async function createTask(db, doctorId, patientId, request) {
  await loadOwnPatient(db, doctorId, patientId);
  const body = await readJson(request);
  const id = crypto.randomUUID();
  const row = {
    id,
    patient_id: patientId,
    time_text: hhmm(body?.time),
    title: str(body?.title, 80),
    note: str(body?.note, 160, { required: false }),
    task_type: body?.type === undefined ? 'dori' : oneOf(body.type, TASK_TYPES),
    remind: body?.remind === undefined ? true : body.remind === true,
    created_at: new Date().toISOString(),
  };
  const created = rows(await db.from('tasks').insert(row).select(TASK_COLUMNS));
  if (created.length !== 1) throw new AppError('write_conflict', 409);
  return json(taskView(created[0]), 201);
}

async function patchTask(db, doctorId, taskId, request) {
  const body = await readJson(request);
  const existing = rows(await db.from('tasks').select('id,patient_id').eq('id', taskId).limit(1));
  if (existing.length !== 1) throw new AppError('not_found', 404);
  await loadOwnPatient(db, doctorId, existing[0].patient_id);
  const patch = {};
  if (body?.time !== undefined) patch.time_text = hhmm(body.time);
  if (body?.title !== undefined) patch.title = str(body.title, 80);
  if (body?.note !== undefined) patch.note = str(body.note, 160, { required: false });
  if (body?.type !== undefined) patch.task_type = oneOf(body.type, TASK_TYPES);
  if (body?.remind !== undefined) patch.remind = body.remind === true;
  if (Object.keys(patch).length === 0) throw new AppError('invalid_input', 400);
  const updated = rows(await db.from('tasks').update(patch).eq('id', taskId).eq('patient_id', existing[0].patient_id)
    .select(TASK_COLUMNS));
  if (updated.length !== 1) throw new AppError('write_conflict', 409);
  return json(taskView(updated[0]));
}

async function deleteTask(db, doctorId, taskId) {
  const existing = rows(await db.from('tasks').select('id,patient_id').eq('id', taskId).limit(1));
  if (existing.length !== 1) throw new AppError('not_found', 404);
  await loadOwnPatient(db, doctorId, existing[0].patient_id);
  rows(await db.from('task_logs').delete().eq('task_id', taskId).select('id'));
  const deleted = rows(await db.from('tasks').delete().eq('id', taskId).select('id'));
  if (deleted.length !== 1) throw new AppError('write_conflict', 409);
  return json({ ok: true });
}

// ---- parhez stollari (shifokor kiritgan maxsus stollar) ---------------------

function dietTextList(value, maxItems) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > maxItems) throw new AppError('invalid_input', 400);
  return value.map((item) => str(item, 80));
}

function dietPayload(value) {
  if (typeof value !== 'object' || value === null) throw new AppError('invalid_input', 400);
  const payload = {
    title: str(value.title, 80),
    purpose: str(value.purpose, 300),
    indications: dietTextList(value.indications, 8),
    allowed: dietTextList(value.allowed, 20),
    limited: dietTextList(value.limited, 20),
    forbidden: dietTextList(value.forbidden, 20),
    menu: dietTextList(value.menu, 8),
  };
  if (JSON.stringify(payload).length > 6000) throw new AppError('payload_too_large', 413);
  return payload;
}

function dietView(row) {
  return { id: row.id, number: row.number, doctorId: row.doctor_id, payload: row.payload, createdAt: row.created_at };
}

async function doctorDiets(db, doctorId) {
  const found = rows(await db.from('diets').select('id,number,doctor_id,payload,created_at')
    .eq('doctor_id', doctorId).order('number').limit(LIST_LIMIT));
  return found.map(dietView);
}

async function doctorCreateDiet(db, doctorId, request) {
  const body = await readJson(request);
  const id = crypto.randomUUID();
  const row = {
    id,
    number: int(body?.number, 1, 99),
    doctor_id: doctorId,
    payload: dietPayload(body?.payload),
    created_at: new Date().toISOString(),
  };
  const created = rows(await db.from('diets').insertIfAbsent(row, { onConflict: 'number,doctor_id' }).select('id'));
  if (created.length !== 1) throw new AppError('diet_number_taken', 409);
  return json(dietView(row), 201);
}

async function doctorPatchDiet(db, doctorId, dietId, request) {
  const body = await readJson(request);
  const patch = {};
  if (body?.number !== undefined) patch.number = int(body.number, 1, 99);
  if (body?.payload !== undefined) patch.payload = dietPayload(body.payload);
  if (Object.keys(patch).length === 0) throw new AppError('invalid_input', 400);
  const updated = rows(await db.from('diets').update(patch).eq('id', dietId).eq('doctor_id', doctorId)
    .select('id,number,doctor_id,payload,created_at'));
  if (updated.length !== 1) throw new AppError('write_conflict', 409);
  return json(dietView(updated[0]));
}

async function doctorDeleteDiet(db, doctorId, dietId) {
  const assigned = rows(await db.from('patients').select('id').eq('diet_id', dietId).limit(1));
  if (assigned.length > 0) throw new AppError('diet_in_use', 409);
  const deleted = rows(await db.from('diets').delete().eq('id', dietId).eq('doctor_id', doctorId).select('id'));
  if (deleted.length !== 1) throw new AppError('not_found', 404);
  return json({ ok: true });
}

// ---- bemor ------------------------------------------------------------------

async function patientMe(db, patientId, nowMs) {
  const patient = await loadPatient(db, patientId);
  const doctors = rows(await db.from('doctors').select('id,first_name,last_name,specialty,phone,status')
    .eq('id', patient.doctor_id).limit(1));
  const { tasks, logs } = await loadPlan(db, [patientId]);
  const custom = patient.diet_id
    ? rows(await db.from('diets').select('id,number,doctor_id,payload,created_at').eq('id', patient.diet_id).limit(1))
    : [];
  return json({
    patient: patientView(patient),
    doctor: doctors.length === 1 ? doctorViewLike(doctors[0]) : null,
    ...planPayload(tasks, logs, nowMs),
    customDiet: custom.length === 1 ? dietView(custom[0]) : null,
    clock: localClock(nowMs, patient.tz_minutes),
  });
}

function doctorViewLike(row) {
  return {
    id: row.id, firstName: row.first_name, lastName: row.last_name,
    specialty: row.specialty, phone: row.phone, status: row.status,
  };
}

const LOOKBACK_MINUTES = 10;
const minutesOf = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
const clockOf = (total) => `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
function dueWindow(time) {
  const now = minutesOf(time);
  const from = Math.max(0, now - LOOKBACK_MINUTES);
  const list = [];
  for (let minute = from; minute <= now; minute += 1) list.push(clockOf(minute));
  return list;
}

// Budilnik: bugun, bu bemorning mahalliy vaqtida endigina kelgan yoki 10 daqiqadan
// ortiq kechikkan vazifalar. Service Worker shu ro'yxatni oladi va jiringlatadi.
async function patientDue(db, patientId, nowMs) {
  const patient = await loadPatient(db, patientId);
  const clock = localClock(nowMs, patient.tz_minutes);
  const tasks = rows(await db.from('tasks').select(TASK_COLUMNS).eq('patient_id', patientId)
    .eq('remind', true).order('time_text').limit(PLAN_LIMIT));
  const logs = rows(await db.from('task_logs').select('task_id').eq('patient_id', patientId)
    .eq('done_date', clock.date).limit(PLAN_LIMIT));
  const done = new Set(logs.map((row) => row.task_id));
  const nowMinute = minutesOf(clock.time);
  const due = tasks.filter((task) => !done.has(task.id)
    && minutesOf(task.time_text) <= nowMinute && nowMinute - minutesOf(task.time_text) <= LOOKBACK_MINUTES);
  return json({ date: clock.date, time: clock.time, due: due.map(taskView) });
}

async function toggleTask(db, patientId, request, nowMs) {
  const patient = await loadPatient(db, patientId);
  const body = await readJson(request);
  const taskId = uuid(body?.taskId);
  const tasks = rows(await db.from('tasks').select('id').eq('id', taskId).eq('patient_id', patientId).limit(1));
  if (tasks.length !== 1) throw new AppError('not_found', 404);
  const date = localClock(nowMs, patient.tz_minutes).date;
  const inserted = rows(await db.from('task_logs').insertIfAbsent({
    id: crypto.randomUUID(), patient_id: patientId, task_id: taskId, done_date: date,
    created_at: new Date().toISOString(),
  }, { onConflict: 'task_id,done_date' }).select('id'));
  if (inserted.length === 1) return json({ done: true, date });
  const removed = rows(await db.from('task_logs').delete().eq('task_id', taskId).eq('done_date', date).select('id'));
  if (removed.length !== 1) throw new AppError('write_conflict', 409);
  return json({ done: false, date });
}

// ---- Web Push obunasi -------------------------------------------------------

async function subscribePush(db, patientId, request) {
  await loadPatient(db, patientId);
  const body = await readJson(request);
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : '';
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 2048) throw new AppError('invalid_input', 400);
  const id = crypto.randomUUID();
  rows(await db.from('push_subs').insertIfAbsent({
    id, patient_id: patientId, endpoint, created_at: new Date().toISOString(),
  }, { onConflict: 'endpoint' }).select('id'));
  return json({ ok: true }, 201);
}

async function unsubscribePush(db, patientId, request) {
  const body = await readJson(request);
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : '';
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 2048) throw new AppError('invalid_input', 400);
  rows(await db.from('push_subs').delete().eq('patient_id', patientId).eq('endpoint', endpoint).select('id'));
  return json({ ok: true });
}

// ---- budilnik uchi (tashqi cron yoki ochiq sahabilardan) ---------------------

async function tick(db, request, env, nowMs) {
  const token = env('APP_TICK_TOKEN');
  const provided = request.headers.get('x-tick-token') ?? '';
  if (!token || !timingSafeEqual(provided, token)) throw new AppError('forbidden', 403);
  const config = await vapidConfig(env);
  if (!config) return json({ ok: true, skipped: 'push_not_configured' });

  const patients = rows(await db.from('patients').select('id,tz_minutes').limit(TICK_PATIENT_LIMIT));
  if (patients.length === 0) return json({ ok: true, fired: 0, sent: 0 });
  const clocks = new Map(patients.map((row) => [row.id, localClock(nowMs, row.tz_minutes)]));
  // Cron bitta daqiqani o'tkazib yuborsa ham budilnik jiringlashi uchun oxirgi
  // 10 daqiqa oynasi tekshiriladi; kun oxiga o'tishda oyna shu kun ichida qoladi.
  const windows = new Map();
  for (const clock of clocks.values()) {
    if (!windows.has(clock.time)) windows.set(clock.time, dueWindow(clock.time));
  }

  let fired = 0, sent = 0, failed = 0, expired = 0;
  for (const [time, window] of windows) {
    const candidates = rows(await db.from('tasks').select(TASK_COLUMNS).in('time_text', window)
      .eq('remind', true).limit(PLAN_LIMIT));
    const due = candidates.filter((task) => clocks.has(task.patient_id)
      && clocks.get(task.patient_id).time === time);
    if (due.length === 0) continue;

    const byDate = new Map();
    for (const task of due) {
      const date = clocks.get(task.patient_id).date;
      const list = byDate.get(date) ?? [];
      list.push(task);
      byDate.set(date, list);
    }
    for (const [date, list] of byDate) {
      const logs = rows(await db.from('task_logs').select('task_id').eq('done_date', date)
        .in('task_id', list.map((task) => task.id)).limit(PLAN_LIMIT));
      const done = new Set(logs.map((row) => row.task_id));
      const pending = list.filter((task) => !done.has(task.id));
      if (pending.length === 0) continue;

      const patientIds = [...new Set(pending.map((task) => task.patient_id))];
      const subs = rows(await db.from('push_subs').select('id,patient_id,endpoint')
        .in('patient_id', patientIds).limit(PLAN_LIMIT));
      const byPatient = new Map();
      for (const sub of subs) {
        const list2 = byPatient.get(sub.patient_id) ?? [];
        list2.push(sub);
        byPatient.set(sub.patient_id, list2);
      }

      for (const task of pending) {
        const targets = byPatient.get(task.patient_id);
        if (!targets || targets.length === 0) continue;
        const gate = rows(await db.from('push_fires').insertIfAbsent({
          id: crypto.randomUUID(), patient_id: task.patient_id, task_id: task.id,
          fire_key: `${task.patient_id}|${task.id}|${date}|${task.time_text}`,
          sent_at: new Date(nowMs).toISOString(),
        }, { onConflict: 'fire_key' }).select('id'));
        if (gate.length !== 1) continue;
        fired += 1;
        for (const target of targets) {
          const outcome = await sendPush(target, config, nowMs);
          if (outcome.result === 'sent') sent += 1;
          else if (outcome.result === 'expired') {
            expired += 1;
            rows(await db.from('push_subs').delete().eq('id', target.id).select('id'));
          } else failed += 1;
        }
      }
    }
  }
  return json({ ok: true, fired, sent, failed, expired, patients: patients.length });
}

// ---- yo'naltirish -----------------------------------------------------------

async function route(db, request, env, origin, nowMs) {
  requireTrustedOrigin(request, origin);
  const path = applicationPath(request);
  const method = request.method;

  if (path === '/api/health' && method === 'GET') return json({ ok: true });
  if (path === '/api/config' && method === 'GET') {
    const admins = rows(await db.from('admins').select('id').limit(1));
    let vapidPublicKey = null;
    try {
      const config = await vapidConfig(env);
      vapidPublicKey = config ? env('VAPID_PUBLIC_KEY') : null;
    } catch {
      vapidPublicKey = null;
    }
    return json({ needsBootstrap: admins.length === 0, vapidPublicKey, defaultTzMinutes: DEFAULT_TZ });
  }
  if (path === '/api/bootstrap' && method === 'POST') return bootstrap(db, request);
  if (path === '/api/login' && method === 'POST') return login(db, request);
  if (path === '/api/logout' && method === 'POST') return logout(db, request);
  if (path === '/api/tick' && method === 'POST') return tick(db, request, env, nowMs);

  if (path === '/api/me' && method === 'GET') {
    const session = await sessionFor(db, request);
    if (session.role === 'admin') {
      const found = rows(await db.from('admins').select('id,login').eq('id', session.principalId).limit(1));
      if (found.length !== 1) throw new LoginRequired('invalid');
      return json({ role: 'admin', id: found[0].id, name: found[0].login });
    }
    if (session.role === 'doctor') {
      const found = rows(await db.from('doctors').select(DOCTOR_PUBLIC).eq('id', session.principalId).limit(1));
      if (found.length !== 1) throw new LoginRequired('invalid');
      return json({ role: 'doctor', ...doctorView(found[0]) });
    }
    const patient = await loadPatient(db, session.principalId);
    return json({ role: 'patient', ...patientView(patient) });
  }
  if (path === '/api/me/password' && method === 'POST') return changeOwnPassword(db, request);

  // --- admin paneli ---
  if (path === '/api/admin/doctors' && method === 'GET') {
    await requireRole(db, request, 'admin');
    return json(await adminDoctors(db));
  }
  if (path === '/api/admin/doctors' && method === 'POST') {
    await requireRole(db, request, 'admin');
    return adminCreateDoctor(db, request);
  }
  if (path === '/api/admin/patients' && method === 'GET') {
    await requireRole(db, request, 'admin');
    return json(await adminPatients(db));
  }
  if (path === '/api/admin/stats' && method === 'GET') return adminStats(db, request, nowMs);
  if (path === '/api/admin/alerts' && method === 'GET') return adminAlerts(db, request, nowMs);

  const adminDoctor = path.match(/^\/api\/admin\/doctors\/([0-9a-f-]{36})$/);
  if (adminDoctor && uuid(adminDoctor[1])) {
    await requireRole(db, request, 'admin');
    if (method === 'PATCH') return adminPatchDoctor(db, adminDoctor[1], request);
    if (method === 'DELETE') return adminDeleteDoctor(db, adminDoctor[1]);
  }

  // --- shifokor paneli ---
  if (path === '/api/doctor/patients' && method === 'GET') {
    const session = await requireRole(db, request, 'doctor');
    return doctorPatients(db, session.principalId, nowMs);
  }
  if (path === '/api/doctor/patients' && method === 'POST') {
    const session = await requireRole(db, request, 'doctor');
    return doctorCreatePatient(db, session.principalId, request);
  }
  if (path === '/api/doctor/diets' && method === 'GET') {
    const session = await requireRole(db, request, 'doctor');
    return json(await doctorDiets(db, session.principalId));
  }
  if (path === '/api/doctor/diets' && method === 'POST') {
    const session = await requireRole(db, request, 'doctor');
    return doctorCreateDiet(db, session.principalId, request);
  }
  const doctorPatient = path.match(/^\/api\/doctor\/patients\/([0-9a-f-]{36})$/);
  if (doctorPatient && uuid(doctorPatient[1])) {
    const session = await requireRole(db, request, 'doctor');
    if (method === 'PATCH') return doctorPatchPatient(db, session.principalId, doctorPatient[1], request);
    if (method === 'DELETE') return doctorDeletePatient(db, session.principalId, doctorPatient[1]);
  }
  const doctorTasks = path.match(/^\/api\/doctor\/patients\/([0-9a-f-]{36})\/tasks$/);
  if (doctorTasks && uuid(doctorTasks[1]) && method === 'POST') {
    const session = await requireRole(db, request, 'doctor');
    return createTask(db, session.principalId, doctorTasks[1], request);
  }
  const doctorTask = path.match(/^\/api\/doctor\/tasks\/([0-9a-f-]{36})$/);
  if (doctorTask && uuid(doctorTask[1])) {
    const session = await requireRole(db, request, 'doctor');
    if (method === 'PATCH') return patchTask(db, session.principalId, doctorTask[1], request);
    if (method === 'DELETE') return deleteTask(db, session.principalId, doctorTask[1]);
  }
  const doctorDiet = path.match(/^\/api\/doctor\/diets\/([0-9a-f-]{36})$/);
  if (doctorDiet && uuid(doctorDiet[1])) {
    const session = await requireRole(db, request, 'doctor');
    if (method === 'PATCH') return doctorPatchDiet(db, session.principalId, doctorDiet[1], request);
    if (method === 'DELETE') return doctorDeleteDiet(db, session.principalId, doctorDiet[1]);
  }

  // --- bemor paneli ---
  if (path === '/api/patient/me' && method === 'GET') {
    const session = await requireRole(db, request, 'patient');
    return patientMe(db, session.principalId, nowMs);
  }
  if (path === '/api/patient/due' && method === 'GET') {
    const session = await requireRole(db, request, 'patient');
    return patientDue(db, session.principalId, nowMs);
  }
  if (path === '/api/patient/toggle' && method === 'POST') {
    const session = await requireRole(db, request, 'patient');
    return toggleTask(db, session.principalId, request, nowMs);
  }
  if (path === '/api/push/subscribe' && method === 'POST') {
    const session = await requireRole(db, request, 'patient');
    return subscribePush(db, session.principalId, request);
  }
  if (path === '/api/push/subscribe' && method === 'DELETE') {
    const session = await requireRole(db, request, 'patient');
    return unsubscribePush(db, session.principalId, request);
  }

  throw new AppError('not_found', 404);
}

// Bog'liqliklarni inject qilish faqat lokal test uchun; index.ts Deno.serve saqlaydi.
export function application({ db, env, origin }) {
  return async function handle(ctx, nowMs = Date.now()) {
    try {
      const configured = typeof origin === 'function' ? origin() : origin;
      return await route(db, ctx.request, env, configured, nowMs);
    } catch (error) {
      if (error instanceof LoginRequired) return unauthorized(error.state);
      if (error instanceof AppError) return errorJson(error.code, error.status);
      return errorJson('service_unavailable', 503);
    }
  };
}
