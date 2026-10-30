import { useSyncExternalStore } from "react";

export type DoctorStatus = "pending" | "approved" | "rejected";
export type Doctor = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  specialty: string;
  status: DoctorStatus;
  createdAt: string;
};
export type TaskType = "dori" | "ovqat";
export type Task = { id: string; time: string; title: string; note: string; type: TaskType };
export type Severity = "yengil" | "orta" | "ogir";
export type Patient = {
  id: string;
  doctorId: string;
  firstName: string;
  lastName: string;
  phone: string;
  diagnosis: string;
  severity: Severity;
  tasks: Task[];
  done: Record<string, string[]>; // date -> task ids
  createdAt: string;
};
export type Session =
  | { role: "admin" }
  | { role: "doctor"; id: string }
  | { role: "patient"; id: string }
  | null;

type State = { doctors: Doctor[]; patients: Patient[]; session: Session };

const KEY = "sogLomMahalla.v1";
const empty: State = { doctors: [], patients: [], session: null };
let state: State = empty;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...empty, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
}
function set(next: Partial<State>) {
  state = { ...state, ...next };
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      listeners.forEach((l) => l());
    }
  });
}

export function useStore() {
  return useSyncExternalStore(
    (cb) => {
      load();
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => {
      load();
      return state;
    },
    () => empty,
  );
}

export const uid = () => Math.random().toString(36).slice(2, 10);
export const normPhone = (p: string) => p.replace(/\D/g, "").slice(-9);
export const normName = (n: string) => n.trim().toLowerCase().replace(/\s+/g, " ");
export const today = () => new Date().toISOString().slice(0, 10);
export const nowHM = () => new Date().toTimeString().slice(0, 5);

export const ADMIN_LOGIN = "admin";
export const ADMIN_PASSWORD = "admin123";

export const actions = {
  logout: () => set({ session: null }),
  loginAdmin(login: string, password: string) {
    if (login.trim() === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
      set({ session: { role: "admin" } });
      return true;
    }
    return false;
  },
  /** Returns doctor status; registers a pending request if not found. */
  loginDoctor(firstName: string, lastName: string, phone: string): DoctorStatus {
    load();
    const found = state.doctors.find(
      (d) =>
        normPhone(d.phone) === normPhone(phone) &&
        normName(d.firstName) === normName(firstName) &&
        normName(d.lastName) === normName(lastName),
    );
    if (found) {
      if (found.status === "approved") set({ session: { role: "doctor", id: found.id } });
      return found.status;
    }
    const d: Doctor = {
      id: uid(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      specialty: "Terapevt",
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    set({ doctors: [d, ...state.doctors] });
    return "pending";
  },
  loginPatient(firstName: string, lastName: string, phone: string) {
    load();
    const p = state.patients.find(
      (x) =>
        normPhone(x.phone) === normPhone(phone) &&
        normName(x.firstName) === normName(firstName) &&
        normName(x.lastName) === normName(lastName),
    );
    if (p) set({ session: { role: "patient", id: p.id } });
    return !!p;
  },
  setDoctorStatus(id: string, status: DoctorStatus) {
    set({ doctors: state.doctors.map((d) => (d.id === id ? { ...d, status } : d)) });
  },
  updateDoctor(id: string, patch: Partial<Doctor>) {
    set({ doctors: state.doctors.map((d) => (d.id === id ? { ...d, ...patch } : d)) });
  },
  deleteDoctor(id: string) {
    set({
      doctors: state.doctors.filter((d) => d.id !== id),
      patients: state.patients.filter((p) => p.doctorId !== id),
    });
  },
  addPatient(p: Omit<Patient, "id" | "done" | "createdAt">) {
    const np: Patient = { ...p, id: uid(), done: {}, createdAt: new Date().toISOString() };
    set({ patients: [np, ...state.patients] });
  },
  updatePatient(id: string, patch: Partial<Patient>) {
    set({ patients: state.patients.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  },
  deletePatient(id: string) {
    set({ patients: state.patients.filter((p) => p.id !== id) });
  },
  toggleTask(patientId: string, taskId: string) {
    const d = today();
    set({
      patients: state.patients.map((p) => {
        if (p.id !== patientId) return p;
        const list = p.done[d] ?? [];
        const next = list.includes(taskId) ? list.filter((t) => t !== taskId) : [...list, taskId];
        return { ...p, done: { ...p.done, [d]: next } };
      }),
    });
  },
};

export function progress(p: Patient) {
  const done = p.done[today()] ?? [];
  const now = nowHM();
  const missed = p.tasks.filter((t) => t.time < now && !done.includes(t.id));
  return { total: p.tasks.length, done: done.length, missed, doneIds: done };
}

export const severityLabel: Record<Severity, string> = { yengil: "Yengil", orta: "O‘rta", ogir: "Og‘ir" };
