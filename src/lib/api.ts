// Saytdagi bir xil manba (same-origin) funksiya mijozi: /functions/v1/app/*.
// Browser hech qachon baza yoki xizmat kalitlariga murojaat qilmaydi; sessiya
// HttpOnly cookie'da saqlanadi va shu sababli credentials: 'same-origin'.

export const FUNCTION_BASE = "/functions/v1/app";

export type Role = "admin" | "doctor" | "patient";

export type Doctor = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  specialty: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: string;
};

export type Patient = {
  id: string;
  doctorId: string;
  firstName: string;
  lastName: string;
  phone: string;
  diagnosis: string;
  severity: "yengil" | "orta" | "ogir";
  dietNumber: number | null;
  dietId: string | null;
  tzMinutes: number;
  createdAt?: string;
  doctorName?: string;
};

export type Task = {
  id: string;
  patientId: string;
  time: string;
  title: string;
  note: string;
  type: "dori" | "ovqat";
  remind: boolean;
};

export type DoneLog = { taskId: string; patientId: string; doneDate: string };

export type DietPayload = {
  title: string;
  purpose: string;
  indications: string[];
  allowed: string[];
  limited: string[];
  forbidden: string[];
  menu: string[];
};

export type CustomDiet = {
  id: string;
  number: number;
  doctorId: string;
  payload: DietPayload;
  createdAt?: string;
};

export type Plan = { tasks: Task[]; logs: DoneLog[]; serverNow: number };

export type PatientHome = Plan & {
  patient: Patient;
  doctor: Doctor | null;
  customDiet: CustomDiet | null;
  clock: { date: string; time: string };
};

export type SiteConfig = {
  needsBootstrap: boolean;
  vapidPublicKey: string | null;
  defaultTzMinutes: number;
};

export type Session =
  { role: Role; id: string; name?: string } | Partial<Doctor> | Partial<Patient>;

export type Me =
  | { role: "admin"; id: string; name: string }
  | ({ role: "doctor" } & Doctor)
  | ({ role: "patient" } & Patient);

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number) {
    super(code);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const hasBody = init.body !== undefined;
  const response = await fetch(`${FUNCTION_BASE}${path}`, {
    method: init.method ?? "GET",
    credentials: "same-origin",
    headers: hasBody ? { "content-type": "application/json" } : {},
    ...(hasBody ? { body: JSON.stringify(init.body) } : {}),
  });
  const text = await response.text();
  let value: unknown = null;
  if (text) {
    try {
      value = JSON.parse(text);
    } catch {
      value = null;
    }
  }
  if (!response.ok) {
    const code =
      value && typeof value === "object" && "error" in value
        ? String((value as { error: unknown }).error)
        : `http_${response.status}`;
    throw new ApiError(code, response.status);
  }
  return value as T;
}

export type DoctorInput = {
  firstName: string;
  lastName: string;
  phone: string;
  specialty?: string;
  password: string;
};
export type DoctorPatch = Partial<DoctorInput> & { status?: Doctor["status"] };
export type PatientInput = {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  diagnosis?: string;
  severity?: Patient["severity"];
  tzMinutes?: number;
};
export type PatientPatch = Partial<PatientInput> & {
  dietNumber?: number | null;
  dietId?: string | null;
};
export type TaskInput = {
  time: string;
  title: string;
  note?: string;
  type: Task["type"];
  remind?: boolean;
};
export type TaskPatch = Partial<TaskInput>;

export type AdminAlert = {
  patient: Patient;
  total: number;
  done: number;
  missed: number;
  missedList: { time: string; title: string }[];
};

export const api = {
  config: () => request<SiteConfig>("/api/config"),
  bootstrap: (login: string, password: string) =>
    request<{ id: string }>("/api/bootstrap", { method: "POST", body: { login, password } }),
  login: (role: Role, identifier: string, password: string) =>
    request<{ role: Role; id: string }>("/api/login", {
      method: "POST",
      body: { role, identifier, password },
    }),
  logout: () => request<{ ok: true }>("/api/logout", { method: "POST", body: {} }),
  me: () => request<Me>("/api/me"),
  changePassword: (current: string, next: string) =>
    request<{ ok: true }>("/api/me/password", { method: "POST", body: { current, next } }),

  stats: () =>
    request<{
      doctors: number;
      pending: number;
      patients: number;
      severe: number;
      completedToday: number;
      alerts: number;
    }>("/api/admin/stats"),
  doctors: () => request<Doctor[]>("/api/admin/doctors"),
  createDoctor: (input: DoctorInput) =>
    request<Doctor>("/api/admin/doctors", { method: "POST", body: input }),
  patchDoctor: (id: string, patch: DoctorPatch) =>
    request<Doctor>(`/api/admin/doctors/${id}`, { method: "PATCH", body: patch }),
  deleteDoctor: (id: string) =>
    request<{ ok: true }>(`/api/admin/doctors/${id}`, { method: "DELETE" }),
  allPatients: () => request<Patient[]>("/api/admin/patients"),
  adminAlerts: () => request<AdminAlert[]>("/api/admin/alerts"),

  myPatients: () => request<{ patients: Patient[] } & Plan>("/api/doctor/patients"),
  createPatient: (input: PatientInput) =>
    request<Patient>("/api/doctor/patients", { method: "POST", body: input }),
  patchPatient: (id: string, patch: PatientPatch) =>
    request<Patient>(`/api/doctor/patients/${id}`, { method: "PATCH", body: patch }),
  deletePatient: (id: string) =>
    request<{ ok: true }>(`/api/doctor/patients/${id}`, { method: "DELETE" }),
  createTask: (patientId: string, input: TaskInput) =>
    request<Task>(`/api/doctor/patients/${patientId}/tasks`, { method: "POST", body: input }),
  patchTask: (id: string, patch: TaskPatch) =>
    request<Task>(`/api/doctor/tasks/${id}`, { method: "PATCH", body: patch }),
  deleteTask: (id: string) =>
    request<{ ok: true }>(`/api/doctor/tasks/${id}`, { method: "DELETE" }),

  diets: () => request<CustomDiet[]>("/api/doctor/diets"),
  createDiet: (input: { number: number; payload: DietPayload }) =>
    request<CustomDiet>("/api/doctor/diets", { method: "POST", body: input }),
  patchDiet: (id: string, patch: { number?: number; payload?: DietPayload }) =>
    request<CustomDiet>(`/api/doctor/diets/${id}`, { method: "PATCH", body: patch }),
  deleteDiet: (id: string) =>
    request<{ ok: true }>(`/api/doctor/diets/${id}`, { method: "DELETE" }),

  home: () => request<PatientHome>("/api/patient/me"),
  due: () => request<{ date: string; time: string; due: Task[] }>("/api/patient/due"),
  toggle: (taskId: string) =>
    request<{ done: boolean; date: string }>("/api/patient/toggle", {
      method: "POST",
      body: { taskId },
    }),
  subscribe: (endpoint: string) =>
    request<{ ok: true }>("/api/push/subscribe", { method: "POST", body: { endpoint } }),
  unsubscribe: (endpoint: string) =>
    request<{ ok: true }>("/api/push/subscribe", { method: "DELETE", body: { endpoint } }),
};

// Kunlik jadval holati: bajarilganlar, o'tkazib yuborilganlar va joriy soat.
export function planState(
  patient: { id: string; tzMinutes: number },
  tasks: Task[],
  logs: DoneLog[],
  serverNow: number,
) {
  const shifted = new Date(serverNow + patient.tzMinutes * 60000);
  const date = shifted.toISOString().slice(0, 10);
  const time = shifted.toISOString().slice(11, 16);
  const doneIds = logs.filter((log) => log.doneDate === date).map((log) => log.taskId);
  const mine = tasks.filter((task) => task.patientId === patient.id);
  return {
    date,
    time,
    total: mine.length,
    done: mine.filter((task) => doneIds.includes(task.id)).length,
    doneIds,
    missed: mine.filter((task) => !doneIds.includes(task.id) && task.time < time),
  };
}
