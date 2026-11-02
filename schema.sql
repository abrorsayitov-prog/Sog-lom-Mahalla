-- Sog'lom Mahalla — biznes sxemasi (function_backend; accessPolicies: []).
-- Barcha jadvallar app. sxemasida. Browser jadvallarni bevosita o'qimaydi yoki yozmaydi:
-- faqat /functions/v1/app orqali. Migratsiya SQL'ida DML (INSERT/seed) YO'Q.

-- Admin: login + parol.
CREATE TABLE app.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  login text NOT NULL UNIQUE,
  password_salt text NOT NULL,
  password_hash text NOT NULL,
  password_iterations integer NOT NULL DEFAULT 600000,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Shifokor: telefon + parol. admin yaratadi, status pending bo'lsa kirish yopiq.
CREATE TABLE app.doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  name_key text NOT NULL,
  phone_key text NOT NULL UNIQUE,
  phone text NOT NULL,
  specialty text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  password_salt text NOT NULL,
  password_hash text NOT NULL,
  password_iterations integer NOT NULL DEFAULT 600000,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Bemor: shifokor kiritadi. telefon + parol bilan kiradi.
CREATE TABLE app.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES app.doctors (id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  name_key text NOT NULL,
  phone_key text NOT NULL UNIQUE,
  phone text NOT NULL,
  diagnosis text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'yengil',
  diet_number integer,
  diet_id uuid,
  tz_minutes integer NOT NULL DEFAULT 300,
  password_salt text NOT NULL,
  password_hash text NOT NULL,
  password_iterations integer NOT NULL DEFAULT 600000,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX patients_doctor_idx ON app.patients (doctor_id);

-- Kunlik rejaga oid vazifalar (dori / ovqat).
CREATE TABLE app.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES app.patients (id),
  time_text text NOT NULL,
  title text NOT NULL,
  note text NOT NULL DEFAULT '',
  task_type text NOT NULL DEFAULT 'dori',
  remind boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tasks_patient_idx ON app.tasks (patient_id);
CREATE INDEX tasks_time_idx ON app.tasks (time_text);

-- Vazifaning bajarilgan kunlari (har kuni qaytalanadigan belgi).
CREATE TABLE app.task_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  task_id uuid NOT NULL,
  done_date text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, done_date)
);

CREATE INDEX task_logs_patient_idx ON app.task_logs (patient_id, done_date);

-- Shifokor kiritgan maxsus parhez stollari (1–15 standart stollar koddagi ma'lumot).
CREATE TABLE app.diets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer NOT NULL,
  doctor_id uuid NOT NULL REFERENCES app.doctors (id),
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (number, doctor_id)
);

-- Web Push obunalari: faqat endpoint saqlanadi (bo'sh payload yuboriladi).
CREATE TABLE app.push_subs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES app.patients (id),
  endpoint text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX push_subs_patient_idx ON app.push_subs (patient_id);

-- Budilnik takrorlanishini atomik ravishda to'xtatadi: fire_key = tillq:*:task:kun.
CREATE TABLE app.push_fires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  task_id uuid NOT NULL,
  fire_key text NOT NULL UNIQUE,
  sent_at timestamptz NOT NULL
);

-- Ilova o'zi boshqaradigan sessiyalar: faqat token SHA-256 sxemasi saqlanadi.
CREATE TABLE app.sessions (
  token_digest text PRIMARY KEY,
  role text NOT NULL,
  principal_id uuid NOT NULL,
  created_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

-- Kirish uchun urinishlar cheklovi (har bir identifikator uchun bitta qator).
CREATE TABLE app.auth_limiter (
  key text PRIMARY KEY,
  window_started_at timestamptz NOT NULL,
  attempt_count integer NOT NULL
);
